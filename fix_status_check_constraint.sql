-- Fix the orders_status_check constraint to allow all valid order statuses
-- This resolves the "violates check constraint orders_status_check" error when updating order status

-- Step 1: Drop the existing constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add the new constraint with all valid status values
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending',
  'processing',
  'in_store',
  'ready',
  'ready_for_pickup',
  'ready_for_delivery',
  'ready_for_transit',
  'assigned',
  'in_transit',
  'shipped',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
));
