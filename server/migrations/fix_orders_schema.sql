-- Add missing columns to orders table to fix 500 Internal Server Error
-- Run this in your Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_charges DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 18.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Also ensure settings table has the new columns (just in case)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_by TEXT;
