-- Run this SQL in your Supabase SQL Editor to add missing columns to the orders table

-- Add advancePaid column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "advancePaid" text DEFAULT '0';

-- Add paymentMethod column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "paymentMethod" text;

-- Add discountType column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "discountType" text;

-- Add discountValue column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "discountValue" text;

-- Add couponCode column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "couponCode" text;

-- Add extraCharges column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "extraCharges" text;

-- Add orderNumber column (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "orderNumber" text UNIQUE;

-- Add shippingAddress column (stores JSON data)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "shippingAddress" jsonb;

-- Add items column (stores JSON array of order items)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS "items" jsonb;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY column_name;
