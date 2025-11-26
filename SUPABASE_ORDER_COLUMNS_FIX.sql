-- Run this SQL in your Supabase SQL Editor to ensure all order columns exist
-- This fixes issues where data might not be saved because columns are missing

-- 1. Add missing business logic columns (camelCase to match frontend)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "advancePaid" text DEFAULT '0';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "paymentMethod" text DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "discountType" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "discountValue" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "couponCode" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "extraCharges" text;

-- 2. Ensure critical columns exist (checking both cases just to be safe)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "customerPhone" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "customerName" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "totalAmount" text;

-- 3. Ensure JSON columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "shippingAddress" jsonb;

-- 4. Verify the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY column_name;
