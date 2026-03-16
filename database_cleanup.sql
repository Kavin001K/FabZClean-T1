-- =====================================================================
-- COMPLETE DATABASE CLEANUP SCRIPT (Preserving Admin & Walk-in)
-- Run this in Supabase SQL Editor
-- Date: 2026-03-16
-- =====================================================================
-- ⚠️ WARNING: This is a DESTRUCTIVE script.
-- It will wipe all transactions, orders, wallets, generic customers,
-- and non-admin users/employees from your database.
-- =====================================================================

BEGIN;

-- 1. Disable triggers that prevent deletion of immutable ledger
DROP TRIGGER IF EXISTS trg_wallet_transactions_block_mutation ON public.wallet_transactions;

-- 2. Delete all transaction logs, documents, and history
DELETE FROM public.wallet_transactions;
DELETE FROM public.credit_ledger;
DELETE FROM public.credit_accounts;
DELETE FROM public.credit_transactions;
DELETE FROM public.audit_logs;
DELETE FROM public."auditLogs"; -- Drizzle-generated capitalized table
DELETE FROM public.barcodes;
DELETE FROM public.documents;
DELETE FROM public.deliveries;
DELETE FROM public.transit_order_items;
DELETE FROM public.transit_status_history;
DELETE FROM public.transit_orders;
DELETE FROM public.order_transactions;
DELETE FROM public.orders;
DELETE FROM public.wallets;

-- 3. Delete all customers EXCEPT the 'Walk-in Customer'
-- We use case-insensitive ILIKE to ensure we catch walkin/walk-in variations
DELETE FROM public.customers
WHERE name NOT ILIKE '%Walk%in%' AND email NOT ILIKE '%walkin%';

-- 4. Delete non-admin employees and users
-- We preserve the system admin account
DELETE FROM public.employees
WHERE email <> 'admin@myfabclean.com';

DELETE FROM public.users
WHERE email <> 'admin@myfabclean.com'
  AND username <> 'admin';

-- 5. Update the admin employee account so they can login using FZCEM001
-- This gives the admin an employee ID just like other employees
UPDATE public.employees
SET employee_id = 'FZCEM001'
WHERE email = 'admin@myfabclean.com';

-- Update the users table as well if it mirrors the employee ID
UPDATE public.users
SET employee_id = 'FZCEM001'
WHERE email = 'admin@myfabclean.com';

-- 6. Reset Sequences so new customers and employees start fresh
DELETE FROM public.order_sequences;

-- Optional: Restart standard PostgreSQL sequences if they are defined
ALTER SEQUENCE IF EXISTS public.fabz_employee_seq RESTART WITH 2;
ALTER SEQUENCE IF EXISTS public.fabz_customer_seq RESTART WITH 1;

-- 7. Re-create the immutability trigger for wallets
CREATE OR REPLACE TRIGGER trg_wallet_transactions_block_mutation
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_wallet_transaction_mutation();

COMMIT;

-- =====================================================================
-- SUCCESS! 
-- Your database is now clean. 
-- You can log in using:
-- Username: FZCEM001
-- Password: (Your existing admin password)
-- =====================================================================
