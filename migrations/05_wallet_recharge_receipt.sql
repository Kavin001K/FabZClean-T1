-- Wallet recharge receipt payload + manual wallet debit

CREATE OR REPLACE FUNCTION public.process_wallet_recharge_v2(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_payment_method text,
  p_recorded_by text,
  p_recorded_by_name text,
  p_reference_id text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.wallet_transactions%ROWTYPE;
  v_tx_code text;
  v_payment_method text;
  v_note text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  PERFORM 1
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  v_payment_method := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
  IF v_payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER', 'WALLET_REFUND', 'WALLET_ADJUSTMENT') THEN
    v_payment_method := 'OTHER';
  END IF;

  v_tx_code := 'WLT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);
  v_note := '[' || v_tx_code || '] Wallet recharge | by=' || coalesce(p_recorded_by_name, 'system');

  IF p_reference_id IS NOT NULL AND btrim(p_reference_id) <> '' THEN
    v_note := v_note || ' | ref=' || btrim(p_reference_id);
  END IF;

  IF p_note IS NOT NULL AND btrim(p_note) <> '' THEN
    v_note := v_note || ' | ' || btrim(p_note);
  END IF;

  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  VALUES (
    p_customer_id,
    'CREDIT',
    p_amount,
    v_payment_method,
    p_recorded_by,
    'PAYMENT',
    NULLIF(btrim(p_reference_id), ''),
    v_note,
    p_recorded_by
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'balance_after', coalesce(v_row.balance_after, 0),
    'balance_before', coalesce(v_row.balance_before, 0),
    'transaction_id', v_row.transaction_id,
    'id', v_row.id,
    'entry_no', v_row.entry_no,
    'payment_method', v_row.payment_method,
    'amount', v_row.amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_wallet_debit(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_note text,
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.wallet_transactions%ROWTYPE;
  v_tx_code text;
  v_balance_before numeric(10, 2);
  v_note text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be greater than zero';
  END IF;

  SELECT coalesce(c.wallet_balance_cache, 0)
  INTO v_balance_before
  FROM public.customers c
  WHERE c.id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Available: %', v_balance_before;
  END IF;

  v_tx_code := 'WDB-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);
  v_note := '[' || v_tx_code || '] Wallet debit | by=' || coalesce(p_recorded_by_name, 'system');

  IF p_note IS NOT NULL AND btrim(p_note) <> '' THEN
    v_note := v_note || ' | ' || btrim(p_note);
  END IF;

  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  VALUES (
    p_customer_id,
    'DEBIT',
    -p_amount,
    NULL,
    p_recorded_by,
    'ADJUSTMENT',
    NULL,
    v_note,
    p_recorded_by
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'balance_after', coalesce(v_row.balance_after, 0),
    'balance_before', coalesce(v_row.balance_before, 0),
    'transaction_id', v_row.transaction_id,
    'id', v_row.id,
    'entry_no', v_row.entry_no,
    'payment_method', v_row.payment_method,
    'amount', abs(v_row.amount)
  );
END;
$$;

-- Backward-compatible wrapper (legacy callers expecting numeric balance)
CREATE OR REPLACE FUNCTION public.process_wallet_recharge(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_payment_method text,
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS numeric(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  v_result := public.process_wallet_recharge_v2(
    p_customer_id,
    p_amount,
    p_payment_method,
    p_recorded_by,
    p_recorded_by_name,
    NULL,
    NULL
  );
  RETURN coalesce((v_result->>'balance_after')::numeric(10, 2), 0);
END;
$$;

ALTER FUNCTION public.process_wallet_recharge_v2(text, numeric, text, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_wallet_debit(text, numeric, text, text, text) SET search_path = public;
