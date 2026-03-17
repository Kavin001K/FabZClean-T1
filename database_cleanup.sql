-- =====================================================================
-- COMPLETE DATABASE CLEANUP SCRIPT (FIXED)
-- =====================================================================

BEGIN;

-- 1. Disable wallet mutation trigger
DROP TRIGGER IF EXISTS trg_wallet_transactions_block_mutation 
ON public.wallet_transactions;

-- 2. Delete transaction data
DELETE FROM public.wallet_transactions;
DELETE FROM public.credit_ledger;
DELETE FROM public.credit_accounts;
DELETE FROM public.credit_transactions;
DELETE FROM public.audit_logs;
DELETE FROM public."auditLogs";
DELETE FROM public.barcodes;
DELETE FROM public.documents;
DELETE FROM public.deliveries;
DELETE FROM public.transit_order_items;
DELETE FROM public.transit_status_history;
DELETE FROM public.transit_orders;
DELETE FROM public.order_transactions;
DELETE FROM public.orders;
DELETE FROM public.wallets;

-- 3. Delete customers except Walk-in
DELETE FROM public.customers
WHERE name NOT ILIKE '%Walk%in%'
AND email NOT ILIKE '%walkin%';

-- 4. Delete non-admin employees
DELETE FROM public.employees
WHERE email <> 'admin@myfabclean.com';

-- 5. Delete non-admin users
DELETE FROM public.users
WHERE email <> 'admin@myfabclean.com'
AND username <> 'admin';

-- =====================================================================
-- FIX: Ensure employee_id column exists in users table
-- =====================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- =====================================================================
-- Update admin employee
-- =====================================================================

UPDATE public.employees
SET employee_id = 'FZCEM001'
WHERE email = 'admin@myfabclean.com';

-- Update admin user
UPDATE public.users
SET employee_id = 'FZCEM001'
WHERE email = 'admin@myfabclean.com';

-- =====================================================================
-- Reset order sequences
-- =====================================================================

DELETE FROM public.order_sequences;

ALTER SEQUENCE IF EXISTS public.fabz_employee_seq RESTART WITH 2;
ALTER SEQUENCE IF EXISTS public.fabz_customer_seq RESTART WITH 1;

-- =====================================================================
-- Recreate wallet immutability trigger
-- =====================================================================

CREATE OR REPLACE TRIGGER trg_wallet_transactions_block_mutation
BEFORE UPDATE OR DELETE 
ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_wallet_transaction_mutation();

COMMIT;

-- =====================================================================
-- DATABASE CLEANED SUCCESSFULLY
-- Login:
-- Username: FZCEM001
-- Password: existing admin password
-- =====================================================================