BEGIN;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_rating numeric(4,2);

CREATE OR REPLACE FUNCTION public.resolve_customer_id_for_order(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_customer_id text;
  v_customer_phone text;
BEGIN
  SELECT o.customer_id, o.customer_phone
    INTO v_customer_id, v_customer_phone
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF v_customer_id IS NOT NULL THEN
    RETURN v_customer_id;
  END IF;

  IF COALESCE(v_customer_phone, '') = '' THEN
    RETURN NULL;
  END IF;

  SELECT c.id
    INTO v_customer_id
    FROM public.customers c
   WHERE regexp_replace(COALESCE(c.phone, ''), '\D', '', 'g') =
         regexp_replace(COALESCE(v_customer_phone, ''), '\D', '', 'g')
   ORDER BY c.created_at DESC
   LIMIT 1;

  RETURN v_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_customer_rating_value(p_customer_id text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_customer_avg numeric;
  v_customer_count integer;
  v_global_avg numeric;
  v_result numeric;
BEGIN
  WITH customer_order_ids AS (
    SELECT o.id
      FROM public.orders o
     WHERE o.customer_id = p_customer_id
        OR (
          COALESCE(o.customer_id, '') = ''
          AND EXISTS (
            SELECT 1
              FROM public.customers c
             WHERE c.id = p_customer_id
               AND regexp_replace(COALESCE(c.phone, ''), '\D', '', 'g') =
                   regexp_replace(COALESCE(o.customer_phone, ''), '\D', '', 'g')
          )
        )
  ),
  review_ratings AS (
    SELECT r.order_id, r.rating::numeric AS rating
      FROM public.reviews_table r
     WHERE r.rating IS NOT NULL
       AND (
         r.customer_id = p_customer_id
         OR r.order_id IN (SELECT id FROM customer_order_ids)
       )
  ),
  fallback_order_ratings AS (
    SELECT o.id AS order_id, o.rating::numeric AS rating
      FROM public.orders o
     WHERE o.rating IS NOT NULL
       AND o.id IN (SELECT id FROM customer_order_ids)
       AND NOT EXISTS (
         SELECT 1
           FROM public.reviews_table r
          WHERE r.order_id = o.id
       )
  ),
  customer_ratings AS (
    SELECT rating FROM review_ratings
    UNION ALL
    SELECT rating FROM fallback_order_ratings
  ),
  global_ratings AS (
    SELECT r.rating::numeric AS rating
      FROM public.reviews_table r
     WHERE r.rating IS NOT NULL
    UNION ALL
    SELECT o.rating::numeric AS rating
      FROM public.orders o
     WHERE o.rating IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
           FROM public.reviews_table r
          WHERE r.order_id = o.id
       )
  )
  SELECT
    AVG(cr.rating),
    COUNT(cr.rating),
    COALESCE((SELECT AVG(gr.rating) FROM global_ratings gr), 0)
  INTO v_customer_avg, v_customer_count, v_global_avg
  FROM customer_ratings cr;

  IF COALESCE(v_customer_count, 0) = 0 THEN
    RETURN NULL;
  END IF;

  v_result := ROUND((((v_customer_avg * v_customer_count) + (v_global_avg * 5)) / (v_customer_count + 5))::numeric, 2);
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_customer_rating(p_customer_id text)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_rating numeric;
BEGIN
  IF p_customer_id IS NULL OR btrim(p_customer_id) = '' THEN
    RETURN NULL;
  END IF;

  v_rating := public.calculate_customer_rating_value(p_customer_id);

  UPDATE public.customers
     SET customer_rating = v_rating
   WHERE id = p_customer_id;

  RETURN v_rating;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_customer_rating_from_reviews()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_customer_id text;
  v_old_customer_id text;
BEGIN
  IF TG_OP <> 'DELETE' THEN
    v_new_customer_id := COALESCE(NEW.customer_id, public.resolve_customer_id_for_order(NEW.order_id));
  END IF;

  IF TG_OP <> 'INSERT' THEN
    v_old_customer_id := COALESCE(OLD.customer_id, public.resolve_customer_id_for_order(OLD.order_id));
  END IF;

  IF v_new_customer_id IS NOT NULL THEN
    PERFORM public.refresh_customer_rating(v_new_customer_id);
  END IF;

  IF v_old_customer_id IS NOT NULL AND v_old_customer_id IS DISTINCT FROM v_new_customer_id THEN
    PERFORM public.refresh_customer_rating(v_old_customer_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_customer_rating_from_orders()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_customer_id text;
  v_old_customer_id text;
BEGIN
  IF TG_OP <> 'DELETE' THEN
    v_new_customer_id := COALESCE(NEW.customer_id, public.resolve_customer_id_for_order(NEW.id));
  END IF;

  IF TG_OP <> 'INSERT' THEN
    v_old_customer_id := COALESCE(OLD.customer_id, public.resolve_customer_id_for_order(OLD.id));
  END IF;

  IF v_new_customer_id IS NOT NULL THEN
    PERFORM public.refresh_customer_rating(v_new_customer_id);
  END IF;

  IF v_old_customer_id IS NOT NULL AND v_old_customer_id IS DISTINCT FROM v_new_customer_id THEN
    PERFORM public.refresh_customer_rating(v_old_customer_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_refresh_customer_rating ON public.reviews_table;
CREATE TRIGGER trg_reviews_refresh_customer_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews_table
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_customer_rating_from_reviews();

DROP TRIGGER IF EXISTS trg_orders_refresh_customer_rating ON public.orders;
CREATE TRIGGER trg_orders_refresh_customer_rating
AFTER INSERT OR UPDATE OF rating, customer_id, customer_phone OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_customer_rating_from_orders();

UPDATE public.customers c
   SET customer_rating = public.calculate_customer_rating_value(c.id);

COMMIT;
