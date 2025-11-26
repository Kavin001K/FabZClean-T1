-- Add UNIQUE constraints to phone and email in customers table

-- First, remove any duplicate entries (keep the latest one)
DELETE FROM customers a USING customers b
WHERE a.id < b.id 
  AND (a.phone = b.phone OR a.email = b.email);

-- Add unique constraints
ALTER TABLE customers 
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

ALTER TABLE customers 
ADD CONSTRAINT customers_email_unique UNIQUE (email);

-- Verify constraints were added
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
  AND conname LIKE '%unique%';

-- Expected output:
-- customers_phone_unique | u
-- customers_email_unique | u
