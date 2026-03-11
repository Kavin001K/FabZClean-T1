-- =====================================================================
-- SUPABASE LINTER FIXES
-- (Run this in the Supabase SQL Editor to resolve security warnings)
-- =====================================================================

BEGIN;

-- 1. Fix: function_search_path_mutable
-- Securing functions by explicitly setting the search_path

ALTER FUNCTION public.process_order_checkout SET search_path = '';
ALTER FUNCTION public.process_credit_repayment SET search_path = '';
ALTER FUNCTION public.enforce_max_admins SET search_path = '';
ALTER FUNCTION public.auto_map_role_fields SET search_path = '';
ALTER FUNCTION public.wallet_set_updated_at SET search_path = '';
ALTER FUNCTION public.is_staff_employee SET search_path = '';
ALTER FUNCTION public.prevent_wallet_transaction_mutation SET search_path = '';
ALTER FUNCTION public.prevent_manual_wallet_customer_updates SET search_path = '';
ALTER FUNCTION public.is_admin_employee SET search_path = '';
ALTER FUNCTION public.process_payment_checkout SET search_path = '';
ALTER FUNCTION public.process_payment_checkout_v2 SET search_path = '';
ALTER FUNCTION public.process_wallet_recharge SET search_path = '';
ALTER FUNCTION public.get_next_order_number SET search_path = '';

-- 2. Fix: rls_policy_always_true
-- Removing overly permissive "ALL" policies and restricting to "SELECT" only

DO $$
DECLARE
    t_name TEXT;
    target_tables TEXT[] := ARRAY[
        'audit_logs', 'credit_accounts', 'credit_ledger', 'credit_transactions', 
        'customers', 'employees', 'franchises', 'order_sequences', 'orders', 
        'products', 'services', 'users', 'wallet_transactions', 'wallets'
    ];
BEGIN
    FOREACH t_name IN ARRAY target_tables LOOP
        -- Drop the overly permissive unrestricted ALL access policy
        EXECUTE format('DROP POLICY IF EXISTS "Allow public access" ON public.%I', t_name);
        
        -- Create a read-only public access policy for SELECT operations
        EXECUTE format('CREATE POLICY "Allow public access" ON public.%I FOR SELECT USING (true)', t_name);
    END LOOP;
END;
$$;

COMMIT;
