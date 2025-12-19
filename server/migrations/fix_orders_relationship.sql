-- Fix relationships between orders and customers to prevent 400 Bad Request on joins
-- Run this script in the Supabase SQL Editor

BEGIN;

-- 1. Ensure columns exist and have correct types
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Drop potential conflicting or malformed constraints (ignoring if not exists)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_customer;

-- 3. Re-establish the Foreign Key
ALTER TABLE orders
ADD CONSTRAINT orders_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE SET NULL;

-- 4. Enable RLS (just in case)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 5. Refresh schema cache (Supabase specific trick: usually restarting or notifying helps, 
-- but altering constraints usually forces cache refresh on PostgREST)
NOTIFY pgrst, 'reload config';

COMMIT;
