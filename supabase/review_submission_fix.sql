BEGIN;

ALTER TABLE public.reviews_table
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text;

CREATE OR REPLACE FUNCTION public.refresh_review_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  TRUNCATE TABLE public.top_reviews_table;
  TRUNCATE TABLE public.best_reviews_table;

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
         updated_at = NOW()
   WHERE r.id IS NOT NULL;

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
         )
   WHERE o.id IS NOT NULL;
END;
$$;

COMMIT;
