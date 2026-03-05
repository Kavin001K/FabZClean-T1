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
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

UPDATE public.orders
SET tags_printed = false
WHERE tags_printed IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_print_queue
  ON public.orders (tags_printed, status, created_at DESC);

-- Ask PostgREST (used by Supabase APIs) to refresh its schema cache immediately.
NOTIFY pgrst, 'reload schema';
