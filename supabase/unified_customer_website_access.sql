BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone_e164(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RETURN NULL;
  END IF;

  v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');

  IF v_digits = '' THEN
    RETURN NULL;
  END IF;

  IF left(v_digits, 2) = '91' AND length(v_digits) = 12 THEN
    RETURN '+' || v_digits;
  END IF;

  IF left(v_digits, 1) = '0' AND length(v_digits) = 11 THEN
    RETURN '+91' || right(v_digits, 10);
  END IF;

  IF length(v_digits) = 10 THEN
    RETURN '+91' || v_digits;
  END IF;

  RETURN '+' || v_digits;
END;
$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS feedback_date date,
  ADD COLUMN IF NOT EXISTS feedback_time time without time zone,
  ADD COLUMN IF NOT EXISTS feedback_source text,
  ADD COLUMN IF NOT EXISTS feedback_status text,
  ADD COLUMN IF NOT EXISTS ai_category text,
  ADD COLUMN IF NOT EXISTS ai_sentiment text,
  ADD COLUMN IF NOT EXISTS ai_score numeric(6,3),
  ADD COLUMN IF NOT EXISTS is_top_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_review boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.customer_auth_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  phone_e164 text NOT NULL,
  link_status text NOT NULL DEFAULT 'pending_unlinked' CHECK (link_status IN ('linked', 'pending_unlinked', 'pending_manual_resolution')),
  link_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.website_customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  phone_e164 text NOT NULL,
  name text,
  email text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_pickup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  request_reference text NOT NULL UNIQUE,
  phone_e164 text NOT NULL,
  customer_name text,
  customer_email text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_date date NOT NULL,
  time_slot text NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  branch text NOT NULL,
  special_instructions text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  source text NOT NULL DEFAULT 'website',
  erp_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating numeric(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ai_category text,
  ai_sentiment text,
  ai_score numeric(6,3),
  is_featured boolean NOT NULL DEFAULT false,
  is_top_10 boolean NOT NULL DEFAULT false,
  feedback_source text NOT NULL DEFAULT 'website',
  feedback_status text NOT NULL DEFAULT 'pending_ai' CHECK (feedback_status IN ('pending_ai', 'reviewed', 'published', 'hidden')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.top_reviews_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE REFERENCES public.reviews_table(id) ON DELETE CASCADE,
  rank integer NOT NULL UNIQUE CHECK (rank >= 1 AND rank <= 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.best_reviews_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE REFERENCES public.reviews_table(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews_table(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'cancelled')),
  attempt_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_customer_auth_links_auth_user_id
  ON public.customer_auth_links (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_customer_auth_links_customer_id
  ON public.customer_auth_links (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_auth_links_phone_e164
  ON public.customer_auth_links (phone_e164);

CREATE INDEX IF NOT EXISTS idx_website_pickup_requests_customer_created
  ON public.website_pickup_requests (customer_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_website_pickup_requests_request_reference
  ON public.website_pickup_requests (request_reference);

CREATE INDEX IF NOT EXISTS idx_reviews_table_order_id
  ON public.reviews_table (order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_table_customer_created
  ON public.reviews_table (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_table_ai_score
  ON public.reviews_table (ai_score DESC);

CREATE INDEX IF NOT EXISTS idx_top_reviews_rank
  ON public.top_reviews_table (rank);

CREATE OR REPLACE FUNCTION public.block_phone_e164_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.phone_e164 IS DISTINCT FROM OLD.phone_e164 THEN
    RAISE EXCEPTION 'phone_e164 is immutable once linked';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_website_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer record;
BEGIN
  SELECT c.id, c.name, c.email, c.address
    INTO v_customer
    FROM public.customers c
   WHERE c.id = NEW.customer_id;

  INSERT INTO public.website_customer_profiles (
    auth_user_id,
    customer_id,
    phone_e164,
    name,
    email,
    address
  )
  VALUES (
    NEW.auth_user_id,
    NEW.customer_id,
    NEW.phone_e164,
    COALESCE(v_customer.name, NULL),
    COALESCE(v_customer.email, NULL),
    COALESCE(v_customer.address, '{}'::jsonb)
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET customer_id = EXCLUDED.customer_id,
        phone_e164 = EXCLUDED.phone_e164,
        updated_at = NOW(),
        name = COALESCE(public.website_customer_profiles.name, EXCLUDED.name),
        email = COALESCE(public.website_customer_profiles.email, EXCLUDED.email),
        address = CASE
          WHEN public.website_customer_profiles.address IS NULL
            OR public.website_customer_profiles.address = '{}'::jsonb
            THEN EXCLUDED.address
          ELSE public.website_customer_profiles.address
        END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_customer_auth_link_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_phone_e164 text;
  v_match_count integer;
  v_customer_id text;
  v_status text;
  v_reason text;
BEGIN
  v_phone_e164 := public.normalize_phone_e164(COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'));

  IF v_phone_e164 IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), MIN(c.id)
    INTO v_match_count, v_customer_id
    FROM public.customers c
   WHERE public.normalize_phone_e164(c.phone) = v_phone_e164;

  IF v_match_count = 1 THEN
    v_status := 'linked';
    v_reason := NULL;
  ELSIF v_match_count = 0 THEN
    v_customer_id := NULL;
    v_status := 'pending_unlinked';
    v_reason := 'No ERP customer matched the authenticated phone number.';
  ELSE
    v_customer_id := NULL;
    v_status := 'pending_manual_resolution';
    v_reason := 'Multiple ERP customers share this phone number.';
  END IF;

  INSERT INTO public.customer_auth_links (
    auth_user_id,
    customer_id,
    phone_e164,
    link_status,
    link_reason,
    resolved_at
  )
  VALUES (
    NEW.id,
    v_customer_id,
    v_phone_e164,
    v_status,
    v_reason,
    CASE WHEN v_status = 'linked' THEN now() ELSE NULL END
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET customer_id = EXCLUDED.customer_id,
        phone_e164 = EXCLUDED.phone_e164,
        link_status = EXCLUDED.link_status,
        link_reason = EXCLUDED.link_reason,
        updated_at = NOW(),
        resolved_at = EXCLUDED.resolved_at;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_review_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews_table r
     SET is_top_10 = EXISTS (
           SELECT 1
             FROM public.top_reviews_table tr
            WHERE tr.review_id = r.id
         ),
         is_featured = EXISTS (
           SELECT 1
             FROM public.best_reviews_table br
            WHERE br.review_id = r.id
         ),
         updated_at = NOW();

  UPDATE public.orders o
     SET is_top_review = EXISTS (
           SELECT 1
             FROM public.reviews_table r
             JOIN public.top_reviews_table tr
               ON tr.review_id = r.id
            WHERE r.order_id = o.id
         ),
         is_best_review = EXISTS (
           SELECT 1
             FROM public.reviews_table r
             JOIN public.best_reviews_table br
               ON br.review_id = r.id
            WHERE r.order_id = o.id
         );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_review_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.top_reviews_table;
  DELETE FROM public.best_reviews_table;

  WITH ranked AS (
    SELECT
      r.id,
      row_number() OVER (
        ORDER BY COALESCE(r.ai_score, 0) DESC, r.rating DESC, r.created_at DESC
      ) AS rank_position
    FROM public.reviews_table r
    WHERE r.ai_sentiment = 'positive'
      AND r.feedback_status IN ('reviewed', 'published')
      AND COALESCE(btrim(r.feedback), '') <> ''
  )
  INSERT INTO public.top_reviews_table (review_id, rank)
  SELECT id, rank_position
    FROM ranked
   WHERE rank_position <= 10;

  INSERT INTO public.best_reviews_table (review_id)
  SELECT r.id
    FROM public.reviews_table r
   WHERE r.ai_sentiment = 'positive'
     AND COALESCE(r.ai_score, 0) >= 0.750
     AND r.rating >= 4
     AND r.feedback_status IN ('reviewed', 'published')
     AND COALESCE(btrim(r.feedback), '') <> ''
   ORDER BY COALESCE(r.ai_score, 0) DESC, r.rating DESC, r.created_at DESC
  ON CONFLICT (review_id) DO NOTHING;

  PERFORM public.refresh_review_flags();
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_refresh_review_flags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_review_flags();
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_customer_link()
RETURNS public.customer_auth_links
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cal.*
    FROM public.customer_auth_links cal
   WHERE cal.auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.require_linked_customer_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_link public.customer_auth_links;
BEGIN
  SELECT *
    INTO v_link
    FROM public.customer_auth_links cal
   WHERE cal.auth_user_id = auth.uid();

  IF v_link.auth_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated customer link found';
  END IF;

  IF v_link.link_status <> 'linked' OR v_link.customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer link is not resolved yet';
  END IF;

  RETURN v_link.customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_link public.customer_auth_links;
  v_profile public.website_customer_profiles;
  v_customer public.customers;
BEGIN
  SELECT * INTO v_link
    FROM public.customer_auth_links cal
   WHERE cal.auth_user_id = auth.uid();

  SELECT * INTO v_profile
    FROM public.website_customer_profiles wcp
   WHERE wcp.auth_user_id = auth.uid();

  IF v_link.customer_id IS NOT NULL THEN
    SELECT * INTO v_customer
      FROM public.customers c
     WHERE c.id = v_link.customer_id;
  END IF;

  RETURN jsonb_build_object(
    'authUserId', auth.uid(),
    'customerId', v_link.customer_id,
    'phone', COALESCE(v_profile.phone_e164, v_link.phone_e164),
    'linkStatus', COALESCE(v_link.link_status, 'pending_unlinked'),
    'linkReason', v_link.link_reason,
    'name', COALESCE(v_profile.name, v_customer.name),
    'email', COALESCE(v_profile.email, v_customer.email),
    'address', COALESCE(v_profile.address, v_customer.address, '{}'::jsonb),
    'erpCustomerName', v_customer.name,
    'erpCustomerEmail', v_customer.email,
    'createdAt', COALESCE(v_profile.created_at, v_link.created_at),
    'updatedAt', COALESCE(v_profile.updated_at, v_link.updated_at)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_address jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.customer_auth_links;
  v_profile public.website_customer_profiles;
BEGIN
  SELECT * INTO v_link
    FROM public.customer_auth_links cal
   WHERE cal.auth_user_id = auth.uid();

  IF v_link.auth_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated customer link found';
  END IF;

  INSERT INTO public.website_customer_profiles (
    auth_user_id,
    customer_id,
    phone_e164,
    name,
    email,
    address
  )
  VALUES (
    auth.uid(),
    v_link.customer_id,
    v_link.phone_e164,
    NULLIF(btrim(p_name), ''),
    NULLIF(btrim(p_email), ''),
    COALESCE(p_address, '{}'::jsonb)
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET customer_id = EXCLUDED.customer_id,
        name = COALESCE(NULLIF(btrim(EXCLUDED.name), ''), public.website_customer_profiles.name),
        email = COALESCE(NULLIF(btrim(EXCLUDED.email), ''), public.website_customer_profiles.email),
        address = COALESCE(EXCLUDED.address, public.website_customer_profiles.address),
        updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN public.get_my_profile();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH linked_customer AS (
    SELECT public.require_linked_customer_id() AS customer_id
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'status', o.status,
        'paymentStatus', o.payment_status,
        'totalAmount', o.total_amount,
        'items', o.items,
        'fulfillmentType', o.fulfillment_type,
        'pickupDate', o.pickup_date,
        'createdAt', o.created_at,
        'updatedAt', o.updated_at,
        'invoiceUrl', o.invoice_url,
        'rating', o.rating,
        'feedback', o.feedback,
        'isTopReview', o.is_top_review,
        'isBestReview', o.is_best_review
      )
      ORDER BY o.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.orders o
  JOIN linked_customer lc
    ON lc.customer_id = o.customer_id;
$$;

CREATE OR REPLACE FUNCTION public.get_my_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_customer_id text;
  v_order record;
BEGIN
  v_customer_id := public.require_linked_customer_id();

  SELECT o.*
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     AND o.customer_id = v_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for this customer';
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'totalAmount', v_order.total_amount,
    'items', v_order.items,
    'fulfillmentType', v_order.fulfillment_type,
    'pickupDate', v_order.pickup_date,
    'createdAt', v_order.created_at,
    'updatedAt', v_order.updated_at,
    'invoiceUrl', v_order.invoice_url,
    'rating', v_order.rating,
    'feedback', v_order.feedback,
    'feedbackStatus', v_order.feedback_status,
    'aiCategory', v_order.ai_category,
    'aiSentiment', v_order.ai_sentiment,
    'aiScore', v_order.ai_score,
    'isTopReview', v_order.is_top_review,
    'isBestReview', v_order.is_best_review
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_wallet_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_customer_id text;
  v_customer record;
BEGIN
  v_customer_id := public.require_linked_customer_id();

  SELECT c.*
    INTO v_customer
    FROM public.customers c
   WHERE c.id = v_customer_id;

  RETURN jsonb_build_object(
    'customerId', v_customer_id,
    'walletBalance', COALESCE((to_jsonb(v_customer) ->> 'wallet_balance_cache')::numeric, 0),
    'creditBalance', COALESCE((to_jsonb(v_customer) ->> 'credit_balance')::numeric, 0),
    'creditLimit', COALESCE((to_jsonb(v_customer) ->> 'credit_limit')::numeric, 0),
    'lastOrderAt', to_jsonb(v_customer) -> 'last_order'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_pickup_request(
  p_customer_name text,
  p_customer_email text,
  p_address jsonb,
  p_services jsonb,
  p_preferred_date date,
  p_time_slot text,
  p_branch text,
  p_special_instructions text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.customer_auth_links;
  v_profile public.website_customer_profiles;
  v_pickup public.website_pickup_requests;
  v_reference text;
BEGIN
  SELECT * INTO v_link
    FROM public.customer_auth_links cal
   WHERE cal.auth_user_id = auth.uid();

  IF v_link.auth_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated customer link found';
  END IF;

  SELECT * INTO v_profile
    FROM public.website_customer_profiles wcp
   WHERE wcp.auth_user_id = auth.uid();

  v_reference := 'FC-PU-' || to_char(current_date, 'YYYY') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');

  INSERT INTO public.website_pickup_requests (
    auth_user_id,
    customer_id,
    request_reference,
    phone_e164,
    customer_name,
    customer_email,
    address,
    services,
    preferred_date,
    time_slot,
    branch,
    special_instructions
  )
  VALUES (
    auth.uid(),
    v_link.customer_id,
    v_reference,
    v_link.phone_e164,
    COALESCE(NULLIF(btrim(p_customer_name), ''), v_profile.name),
    COALESCE(NULLIF(btrim(p_customer_email), ''), v_profile.email),
    COALESCE(p_address, '{}'::jsonb),
    COALESCE(p_services, '[]'::jsonb),
    p_preferred_date,
    p_time_slot,
    p_branch,
    NULLIF(btrim(p_special_instructions), '')
  )
  RETURNING * INTO v_pickup;

  RETURN jsonb_build_object(
    'id', v_pickup.id,
    'requestReference', v_pickup.request_reference,
    'status', v_pickup.status,
    'preferredDate', v_pickup.preferred_date,
    'timeSlot', v_pickup.time_slot,
    'branch', v_pickup.branch,
    'createdAt', v_pickup.created_at,
    'message', 'Pickup request received successfully'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_order_feedback(
  p_order_id uuid,
  p_rating numeric,
  p_feedback text,
  p_source text DEFAULT 'website'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id text;
  v_order public.orders;
  v_review public.reviews_table;
BEGIN
  v_customer_id := public.require_linked_customer_id();

  SELECT *
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     AND o.customer_id = v_customer_id
     AND o.status IN ('completed', 'delivered');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback can only be submitted for your completed or delivered orders';
  END IF;

  UPDATE public.orders
     SET rating = p_rating,
         feedback = NULLIF(btrim(p_feedback), ''),
         feedback_date = current_date,
         feedback_time = localtime,
         feedback_source = COALESCE(NULLIF(btrim(p_source), ''), 'website'),
         feedback_status = 'pending_ai',
         ai_category = NULL,
         ai_sentiment = NULL,
         ai_score = NULL
   WHERE id = p_order_id;

  INSERT INTO public.reviews_table (
    order_id,
    customer_id,
    auth_user_id,
    rating,
    feedback,
    feedback_source,
    feedback_status,
    created_at,
    updated_at
  )
  VALUES (
    p_order_id,
    v_customer_id,
    auth.uid(),
    p_rating,
    NULLIF(btrim(p_feedback), ''),
    COALESCE(NULLIF(btrim(p_source), ''), 'website'),
    'pending_ai',
    now(),
    now()
  )
  ON CONFLICT (order_id) DO UPDATE
    SET rating = EXCLUDED.rating,
        feedback = EXCLUDED.feedback,
        auth_user_id = EXCLUDED.auth_user_id,
        feedback_source = EXCLUDED.feedback_source,
        feedback_status = 'pending_ai',
        ai_category = NULL,
        ai_sentiment = NULL,
        ai_score = NULL,
        updated_at = NOW()
  RETURNING * INTO v_review;

  UPDATE public.review_ai_jobs
     SET status = 'cancelled',
         updated_at = NOW()
   WHERE review_id = v_review.id
     AND status IN ('pending', 'processing', 'error');

  INSERT INTO public.review_ai_jobs (
    review_id,
    status,
    payload
  )
  VALUES (
    v_review.id,
    'pending',
    jsonb_build_object(
      'orderId', p_order_id,
      'customerId', v_customer_id,
      'source', COALESCE(NULLIF(btrim(p_source), ''), 'website')
    )
  );

  RETURN jsonb_build_object(
    'reviewId', v_review.id,
    'orderId', p_order_id,
    'feedbackStatus', 'pending_ai',
    'googleReviewPrompt', p_rating >= 4,
    'googleReviewUrl', current_setting('app.settings.google_review_url', true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_feedback_access_token(
  p_order_id uuid,
  p_expires_at timestamptz DEFAULT (now() + interval '7 days')
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text := current_setting('app.settings.feedback_token_secret', true);
  v_expiry_epoch bigint;
BEGIN
  IF COALESCE(v_secret, '') = '' THEN
    RETURN NULL;
  END IF;

  v_expiry_epoch := EXTRACT(epoch FROM p_expires_at);

  RETURN v_expiry_epoch::text || '.' || encode(
    hmac(p_order_id || '.' || v_expiry_epoch::text, v_secret, 'sha256'),
    'hex'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_feedback_access_token(
  p_order_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text := current_setting('app.settings.feedback_token_secret', true);
  v_expiry_epoch bigint;
  v_expected text;
BEGIN
  IF COALESCE(v_secret, '') = '' OR COALESCE(p_token, '') = '' THEN
    RETURN false;
  END IF;

  v_expiry_epoch := split_part(p_token, '.', 1)::bigint;

  IF to_timestamp(v_expiry_epoch) < now() THEN
    RETURN false;
  END IF;

  v_expected := split_part(p_token, '.', 1) || '.' || encode(
    hmac(p_order_id || '.' || split_part(p_token, '.', 1), v_secret, 'sha256'),
    'hex'
  );

  RETURN v_expected = p_token;
END;
$$;

DROP VIEW IF EXISTS public.website_latest_reviews;
CREATE VIEW public.website_latest_reviews AS
SELECT
  r.id,
  r.order_id,
  r.customer_id,
  COALESCE(wcp.name, c.name, 'Fab Clean Customer') AS customer_name,
  r.rating,
  r.feedback,
  r.ai_category,
  r.ai_sentiment,
  r.ai_score,
  r.created_at
FROM public.reviews_table r
LEFT JOIN public.customers c
  ON c.id = r.customer_id
LEFT JOIN public.customer_auth_links cal
  ON cal.customer_id = r.customer_id
LEFT JOIN public.website_customer_profiles wcp
  ON wcp.auth_user_id = cal.auth_user_id
WHERE r.feedback_status = 'published'
  AND r.ai_sentiment = 'positive'
  AND COALESCE(btrim(r.feedback), '') <> ''
ORDER BY r.created_at DESC
LIMIT 20;

DROP VIEW IF EXISTS public.website_top_reviews;
CREATE VIEW public.website_top_reviews AS
SELECT
  tr.rank,
  r.id,
  r.order_id,
  r.customer_id,
  COALESCE(wcp.name, c.name, 'Fab Clean Customer') AS customer_name,
  r.rating,
  r.feedback,
  r.ai_category,
  r.ai_sentiment,
  r.ai_score,
  r.created_at
FROM public.top_reviews_table tr
JOIN public.reviews_table r
  ON r.id = tr.review_id
LEFT JOIN public.customers c
  ON c.id = r.customer_id
LEFT JOIN public.customer_auth_links cal
  ON cal.customer_id = r.customer_id
LEFT JOIN public.website_customer_profiles wcp
  ON wcp.auth_user_id = cal.auth_user_id
WHERE r.feedback_status = 'published'
  AND r.ai_sentiment = 'positive'
ORDER BY tr.rank ASC;

DROP VIEW IF EXISTS public.website_best_reviews;
CREATE VIEW public.website_best_reviews AS
SELECT
  br.id AS best_review_id,
  r.id,
  r.order_id,
  r.customer_id,
  COALESCE(wcp.name, c.name, 'Fab Clean Customer') AS customer_name,
  r.rating,
  r.feedback,
  r.ai_category,
  r.ai_sentiment,
  r.ai_score,
  r.created_at
FROM public.best_reviews_table br
JOIN public.reviews_table r
  ON r.id = br.review_id
LEFT JOIN public.customers c
  ON c.id = r.customer_id
LEFT JOIN public.customer_auth_links cal
  ON cal.customer_id = r.customer_id
LEFT JOIN public.website_customer_profiles wcp
  ON wcp.auth_user_id = cal.auth_user_id
WHERE r.feedback_status = 'published'
  AND r.ai_sentiment = 'positive'
ORDER BY COALESCE(r.ai_score, 0) DESC, r.rating DESC, r.created_at DESC
LIMIT 20;

DROP TRIGGER IF EXISTS trg_customer_auth_links_updated_at ON public.customer_auth_links;
CREATE TRIGGER trg_customer_auth_links_updated_at
BEFORE UPDATE ON public.customer_auth_links
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_auth_links_block_phone_update ON public.customer_auth_links;
CREATE TRIGGER trg_customer_auth_links_block_phone_update
BEFORE UPDATE ON public.customer_auth_links
FOR EACH ROW
EXECUTE FUNCTION public.block_phone_e164_mutation();

DROP TRIGGER IF EXISTS trg_website_customer_profiles_updated_at ON public.website_customer_profiles;
CREATE TRIGGER trg_website_customer_profiles_updated_at
BEFORE UPDATE ON public.website_customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_website_customer_profiles_block_phone_update ON public.website_customer_profiles;
CREATE TRIGGER trg_website_customer_profiles_block_phone_update
BEFORE UPDATE ON public.website_customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.block_phone_e164_mutation();

DROP TRIGGER IF EXISTS trg_seed_website_customer_profile ON public.customer_auth_links;
CREATE TRIGGER trg_seed_website_customer_profile
AFTER INSERT OR UPDATE ON public.customer_auth_links
FOR EACH ROW
EXECUTE FUNCTION public.seed_website_customer_profile();

DROP TRIGGER IF EXISTS trg_website_pickup_requests_updated_at ON public.website_pickup_requests;
CREATE TRIGGER trg_website_pickup_requests_updated_at
BEFORE UPDATE ON public.website_pickup_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_table_updated_at ON public.reviews_table;
CREATE TRIGGER trg_reviews_table_updated_at
BEFORE UPDATE ON public.reviews_table
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_top_reviews_refresh_flags ON public.top_reviews_table;
CREATE TRIGGER trg_top_reviews_refresh_flags
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.top_reviews_table
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_review_flags();

DROP TRIGGER IF EXISTS trg_best_reviews_refresh_flags ON public.best_reviews_table;
CREATE TRIGGER trg_best_reviews_refresh_flags
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.best_reviews_table
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_review_flags();

DROP TRIGGER IF EXISTS trg_review_ai_jobs_updated_at ON public.review_ai_jobs;
CREATE TRIGGER trg_review_ai_jobs_updated_at
BEFORE UPDATE ON public.review_ai_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sync_customer_auth_link_from_auth_user ON auth.users;
CREATE TRIGGER trg_sync_customer_auth_link_from_auth_user
AFTER INSERT OR UPDATE OF phone, raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_auth_link_from_auth_user();

ALTER TABLE public.customer_auth_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_ai_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_auth_links_select_own ON public.customer_auth_links;
CREATE POLICY customer_auth_links_select_own
ON public.customer_auth_links
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS website_customer_profiles_select_own ON public.website_customer_profiles;
CREATE POLICY website_customer_profiles_select_own
ON public.website_customer_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS website_customer_profiles_update_own ON public.website_customer_profiles;
CREATE POLICY website_customer_profiles_update_own
ON public.website_customer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS website_pickup_requests_select_own ON public.website_pickup_requests;
CREATE POLICY website_pickup_requests_select_own
ON public.website_pickup_requests
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS reviews_table_select_own ON public.reviews_table;
CREATE POLICY reviews_table_select_own
ON public.reviews_table
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

REVOKE ALL ON public.customer_auth_links FROM anon, authenticated;
REVOKE ALL ON public.website_customer_profiles FROM anon, authenticated;
REVOKE ALL ON public.website_pickup_requests FROM anon, authenticated;
REVOKE ALL ON public.reviews_table FROM anon, authenticated;
REVOKE ALL ON public.top_reviews_table FROM anon, authenticated;
REVOKE ALL ON public.best_reviews_table FROM anon, authenticated;
REVOKE ALL ON public.review_ai_jobs FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_order(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_wallet_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pickup_request(text, text, jsonb, jsonb, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_feedback(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_feedback_access_token(uuid, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_feedback_access_token(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_review_rankings() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_review_flags() TO service_role;

GRANT SELECT ON public.website_latest_reviews TO anon, authenticated;
GRANT SELECT ON public.website_top_reviews TO anon, authenticated;
GRANT SELECT ON public.website_best_reviews TO anon, authenticated;

COMMIT;
