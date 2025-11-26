-- 1. Fix address column type conversion
-- We convert existing text addresses into a JSON object format: {"line1": "original address"}
-- This handles special characters like '/' correctly and prevents the "invalid input syntax" error.
ALTER TABLE public.customers 
ALTER COLUMN address TYPE jsonb 
USING CASE 
    WHEN address IS NULL THEN NULL 
    ELSE jsonb_build_object('line1', address) 
END;

-- 2. Add loyaltyPoints column if it's missing
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "loyaltyPoints" text DEFAULT '0';

-- 3. Ensure other columns exist and have correct types
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "totalOrders" integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "totalSpent" decimal(10,2) DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "lastOrder" timestamp with time zone;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "segments" jsonb;

-- 4. Verify the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY column_name;
