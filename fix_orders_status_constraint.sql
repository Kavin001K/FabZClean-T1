-- FIX: Update orders_status_check constraint to include missing values
-- Statuses: ready_for_pickup, ready_for_delivery, out_for_delivery, delivered, etc.

BEGIN;

-- 1. Identify and drop the existing check constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
    END IF;
END
$$;

-- 2. Add the new comprehensive check constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending', 
    'processing', 
    'completed', 
    'cancelled', 
    'assigned', 
    'in_transit', 
    'shipped', 
    'out_for_delivery', 
    'delivered', 
    'in_store', 
    'ready_for_transit', 
    'ready_for_pickup', 
    'ready_for_delivery'
));

-- 3. Notify schema refresh
NOTIFY pgrst, 'reload schema';

COMMIT;
