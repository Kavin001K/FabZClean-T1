-- =====================================================
-- FIX TRANSIT ORDER ITEMS - Change transit_order_id to TEXT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Check current column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transit_order_items' AND column_name = 'transit_order_id';

-- If transit_order_id is UUID but transit_orders.id is TEXT, we need to fix this
-- First, drop the foreign key constraint if it exists
ALTER TABLE transit_order_items DROP CONSTRAINT IF EXISTS transit_order_items_transit_order_id_fkey;

-- Change column type to TEXT to match transit_orders.id
ALTER TABLE transit_order_items ALTER COLUMN transit_order_id TYPE TEXT;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transit_order_items';
