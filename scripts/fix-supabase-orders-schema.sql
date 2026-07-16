-- Idempotent schema patch for Supabase orders table.
-- Run this once in Supabase SQL Editor if you see errors like:
-- "Could not find the 'created_by' column of 'orders' in the schema cache"
-- or print tags not updating due to missing tags_printed.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tags_printed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS tag_note text,
  ADD COLUMN IF NOT EXISTS barcode_id text,
  ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS delivery_charges numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,
  ADD COLUMN IF NOT EXISTS is_express_order boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_partner_id text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS express_charge numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instant_charge numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_timestamps jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bag_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cover_type text NOT NULL DEFAULT 'bag';

UPDATE public.orders
SET
  tags_printed = COALESCE(tags_printed, false),
  bag_count = COALESCE(NULLIF(bag_count, 0), 1),
  cover_type = CASE
    WHEN cover_type IN ('bag', 'cover', 'coat_cover') THEN cover_type
    ELSE 'bag'
  END
WHERE tags_printed IS NULL
  OR bag_count IS NULL
  OR bag_count = 0
  OR cover_type IS NULL
  OR cover_type NOT IN ('bag', 'cover', 'coat_cover');

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

CREATE INDEX IF NOT EXISTS idx_orders_print_queue
  ON public.orders (tags_printed, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_cover_type
  ON public.orders (cover_type);

-- Ask PostgREST (used by Supabase APIs) to refresh its schema cache immediately.
NOTIFY pgrst, 'reload schema';
