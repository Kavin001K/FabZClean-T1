-- Add delivery-related fields to orders table
-- This migration adds support for delivery/pickup fulfillment type

-- Add fulfillment_type column (pickup or delivery)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'pickup' 
CHECK (fulfillment_type IN ('pickup', 'delivery'));

-- Add delivery_charges column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(10, 2) DEFAULT 0;

-- Add delivery_address column (JSONB for flexible address storage)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_address JSONB;

-- Update status enum constraint to include ready_for_pickup
-- First drop the old constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all valid statuses including ready_for_pickup
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
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
  'ready_for_pickup'
));

-- Add comment for documentation
COMMENT ON COLUMN orders.fulfillment_type IS 'Whether customer will pickup or order will be delivered (pickup/delivery)';
COMMENT ON COLUMN orders.delivery_charges IS 'Additional charges for delivery if applicable';
COMMENT ON COLUMN orders.delivery_address IS 'Delivery address JSONB object with street, city, zip, country';
