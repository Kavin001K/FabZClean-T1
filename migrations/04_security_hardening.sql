BEGIN;

ALTER FUNCTION public.get_next_order_number(text) SET search_path = public;
ALTER FUNCTION public.process_wallet_recharge(text, numeric, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_payment_checkout_v2(text, text, numeric, boolean, numeric, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_payment_checkout(text, text, numeric, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.process_credit_repayment(text, numeric, text, text, text) SET search_path = public;

DO $$
DECLARE
  t_name text;
  target_tables text[] := ARRAY[
    'customers',
    'employees',
    'franchises',
    'order_sequences',
    'orders',
    'products',
    'services',
    'wallet_transactions'
  ];
BEGIN
  FOREACH t_name IN ARRAY target_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public access" ON public.%I', t_name);
    EXECUTE format('DROP POLICY IF EXISTS public_read ON public.%I', t_name);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I', t_name);
    EXECUTE format(
      'CREATE POLICY public_read ON public.%I FOR SELECT USING (auth.role() IN (''anon'', ''authenticated'', ''service_role''))',
      t_name
    );
    EXECUTE format(
      'CREATE POLICY service_role_all ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      t_name
    );
  END LOOP;
END
$$;

COMMIT;
