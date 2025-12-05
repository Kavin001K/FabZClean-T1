-- Add core columns that might be missing or named differently
-- Run this in your Supabase SQL Editor to fix the "Could not find column" errors

-- 1. Add core columns (snake_case) if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS franchise_id TEXT;

-- 2. Add GST/Payment columns (snake_case) if they don't exist
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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 3. CRITICAL: Reload the schema cache
-- This tells Supabase/PostgREST to recognize the new columns immediately
NOTIFY pgrst, 'reload config';
