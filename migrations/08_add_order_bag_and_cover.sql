BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS bag_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cover_type text NOT NULL DEFAULT 'bag';

UPDATE public.orders
SET
  bag_count = COALESCE(NULLIF(bag_count, 0), 1),
  cover_type = CASE
    WHEN cover_type IN ('bag', 'cover', 'coat_cover') THEN cover_type
    ELSE 'bag'
  END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_cover_type_valid_chk'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_cover_type_valid_chk
      CHECK (cover_type IN ('bag', 'cover', 'coat_cover'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_orders_cover_type ON public.orders(cover_type);

COMMIT;
