BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.order_sequences (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_code text NOT NULL,
  year integer NOT NULL,
  current_sequence integer NOT NULL DEFAULT 0,
  letter_suffix char(1) NOT NULL DEFAULT 'A',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_sequences_branch_year
  ON public.order_sequences(branch_code, year);

CREATE OR REPLACE FUNCTION public.get_next_order_number(p_branch_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_sequence integer;
  v_letter char(1);
BEGIN
  INSERT INTO public.order_sequences (branch_code, year, current_sequence, letter_suffix)
  VALUES (p_branch_code, v_year, 1, 'A')
  ON CONFLICT (branch_code, year)
  DO UPDATE
    SET current_sequence = public.order_sequences.current_sequence + 1,
        updated_at = now()
  RETURNING current_sequence, letter_suffix
  INTO v_sequence, v_letter;

  IF v_sequence > 9999 THEN
    UPDATE public.order_sequences
    SET current_sequence = 1,
        letter_suffix = chr(ascii(letter_suffix) + 1),
        updated_at = now()
    WHERE branch_code = p_branch_code
      AND year = v_year
    RETURNING current_sequence, letter_suffix
    INTO v_sequence, v_letter;
  END IF;

  RETURN 'FZC-' || v_year::text || p_branch_code || lpad(v_sequence::text, 4, '0') || v_letter;
END;
$$;

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
  v_balance_after numeric(10, 2);
  v_tx_code text;
  v_payment_method text;
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
  IF v_payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
    v_payment_method := 'CASH';
  END IF;

  v_tx_code := 'WLT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

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
    NULL,
    '[' || v_tx_code || '] Wallet recharge | by=' || coalesce(p_recorded_by_name, 'system'),
    p_recorded_by
  )
  RETURNING balance_after INTO v_balance_after;

  RETURN coalesce(v_balance_after, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_checkout_v2(
  p_order_id text,
  p_customer_id text,
  p_cash_amount numeric(10, 2) DEFAULT 0,
  p_use_wallet boolean DEFAULT true,
  p_wallet_debit_requested numeric(10, 2) DEFAULT NULL,
  p_payment_method text DEFAULT 'CASH',
  p_recorded_by text DEFAULT NULL,
  p_recorded_by_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_order_id text;
  v_order_total numeric(10, 2);
  v_advance_paid numeric(10, 2);
  v_order_payment_status text;
  v_order_customer_id text;
  v_remaining_amount numeric(10, 2);
  v_wallet_balance_before numeric(10, 2);
  v_wallet_balance_after numeric(10, 2);
  v_credit_balance_after numeric(10, 2);
  v_wallet_debited numeric(10, 2) := 0;
  v_cash_applied numeric(10, 2) := 0;
  v_credit_assigned numeric(10, 2) := 0;
  v_new_advance_paid numeric(10, 2) := 0;
  v_new_payment_status text;
  v_wallet_tx_code text := NULL;
  v_credit_tx_code text := NULL;
  v_payment_method_normalized text := NULL;
  v_request_key text;
BEGIN
  SELECT
    id,
    total_amount,
    coalesce(advance_paid, 0),
    coalesce(payment_status, 'pending'),
    customer_id
  INTO
    v_existing_order_id,
    v_order_total,
    v_advance_paid,
    v_order_payment_status,
    v_order_customer_id
  FROM public.orders
  WHERE id = p_order_id::uuid
  FOR UPDATE;

  IF v_existing_order_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF p_customer_id IS NULL OR btrim(p_customer_id) = '' THEN
    p_customer_id := v_order_customer_id;
  END IF;

  IF p_customer_id IS NULL OR btrim(p_customer_id) = '' THEN
    RAISE EXCEPTION 'Customer ID is required for checkout';
  END IF;

  IF v_order_customer_id IS NOT NULL AND v_order_customer_id <> p_customer_id THEN
    RAISE EXCEPTION 'Order customer mismatch';
  END IF;

  SELECT coalesce(wallet_balance_cache, 0)
  INTO v_wallet_balance_before
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  v_remaining_amount := greatest(v_order_total - v_advance_paid, 0);

  IF v_remaining_amount <= 0 THEN
    RETURN json_build_object(
      'success', true,
      'payment_status', 'paid',
      'split', json_build_object(
        'cashApplied', 0,
        'walletDebited', 0,
        'creditAssigned', 0
      ),
      'transaction_ids', json_build_object(
        'wallet_transaction_id', NULL,
        'credit_transaction_id', NULL
      ),
      'credit_id', p_customer_id,
      'idempotent', true
    );
  END IF;

  v_request_key := md5(
    concat_ws(
      '|',
      p_order_id,
      coalesce(p_cash_amount, 0)::text,
      coalesce(p_use_wallet, false)::text,
      coalesce(p_wallet_debit_requested, -1)::text,
      coalesce(p_payment_method, '')
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.wallet_transactions wt
    WHERE wt.reference_id = p_order_id
      AND coalesce(wt.note, '') ILIKE '%' || v_request_key || '%'
      AND wt.created_at > (now() - interval '30 seconds')
  ) THEN
    v_credit_assigned := greatest(v_order_total - v_advance_paid, 0);
    RETURN json_build_object(
      'success', true,
      'payment_status', CASE WHEN v_credit_assigned > 0 THEN 'credit' ELSE 'paid' END,
      'split', json_build_object(
        'cashApplied', 0,
        'walletDebited', 0,
        'creditAssigned', v_credit_assigned
      ),
      'transaction_ids', json_build_object(
        'wallet_transaction_id', NULL,
        'credit_transaction_id', NULL
      ),
      'credit_id', p_customer_id,
      'idempotent', true
    );
  END IF;

  IF coalesce(p_use_wallet, false) THEN
    IF coalesce(p_wallet_debit_requested, 0) > 0 THEN
      v_wallet_debited := least(
        v_remaining_amount,
        greatest(v_wallet_balance_before, 0),
        p_wallet_debit_requested
      );
    ELSE
      v_wallet_debited := least(
        v_remaining_amount,
        greatest(v_wallet_balance_before, 0)
      );
    END IF;
  END IF;

  v_cash_applied := least(
    greatest(v_remaining_amount - v_wallet_debited, 0),
    greatest(coalesce(p_cash_amount, 0), 0)
  );

  IF v_order_payment_status <> 'credit' THEN
    v_credit_tx_code := 'CRD-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);
    INSERT INTO public.wallet_transactions (
      customer_id,
      transaction_type,
      amount,
      verified_by_staff,
      reference_type,
      reference_id,
      note,
      created_by
    )
    VALUES (
      p_customer_id,
      'DEBIT',
      -v_remaining_amount,
      p_recorded_by,
      'ORDER',
      p_order_id,
      '[' || v_credit_tx_code || '] Auto order debit | req=' || v_request_key || ' | by=' || coalesce(p_recorded_by_name, 'system'),
      p_recorded_by
    );
  END IF;

  IF v_cash_applied > 0 THEN
    v_payment_method_normalized := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
    IF v_payment_method_normalized NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
      v_payment_method_normalized := 'CASH';
    END IF;

    v_wallet_tx_code := 'WLT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

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
      v_cash_applied,
      v_payment_method_normalized,
      p_recorded_by,
      'PAYMENT',
      p_order_id,
      '[' || v_wallet_tx_code || '] Order payment received | req=' || v_request_key || ' | by=' || coalesce(p_recorded_by_name, 'system'),
      p_recorded_by
    );
  END IF;

  SELECT
    coalesce(wallet_balance_cache, 0),
    coalesce(credit_balance, 0)
  INTO
    v_wallet_balance_after,
    v_credit_balance_after
  FROM public.customers
  WHERE id = p_customer_id;

  v_new_advance_paid := least(v_order_total, v_advance_paid + v_wallet_debited + v_cash_applied);
  v_credit_assigned := greatest(v_order_total - v_new_advance_paid, 0);
  v_new_payment_status := CASE WHEN v_credit_assigned > 0 THEN 'credit' ELSE 'paid' END;

  UPDATE public.orders
  SET
    customer_id = coalesce(customer_id, p_customer_id),
    advance_paid = v_new_advance_paid,
    wallet_used = least(v_order_total, coalesce(wallet_used, 0) + v_wallet_debited),
    credit_used = v_credit_assigned,
    payment_status = v_new_payment_status,
    payment_method = CASE
      WHEN v_wallet_debited > 0 AND v_cash_applied > 0 THEN 'SPLIT'
      WHEN v_wallet_debited > 0 THEN 'CREDIT_WALLET'
      WHEN v_cash_applied > 0 THEN coalesce(v_payment_method_normalized, 'CASH')
      ELSE payment_method
    END,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'payment_status', v_new_payment_status,
    'split', json_build_object(
      'cashApplied', v_cash_applied,
      'walletDebited', v_wallet_debited,
      'creditAssigned', v_credit_assigned
    ),
    'wallet_used', v_wallet_debited,
    'credit_used', v_credit_assigned,
    'transaction_ids', json_build_object(
      'wallet_transaction_id', v_wallet_tx_code,
      'credit_transaction_id', v_credit_tx_code
    ),
    'credit_id', p_customer_id,
    'idempotent', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_checkout(
  p_order_id text,
  p_customer_id text,
  p_cash_amount numeric(10, 2),
  p_wallet_amount numeric(10, 2),
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.process_payment_checkout_v2(
    p_order_id,
    p_customer_id,
    p_cash_amount,
    coalesce(p_wallet_amount, 0) > 0,
    p_wallet_amount,
    'CASH',
    p_recorded_by,
    p_recorded_by_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_credit_repayment(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_payment_method text,
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_after numeric(10, 2);
  v_tx_code text;
  v_payment_method text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Repayment amount must be strictly positive';
  END IF;

  PERFORM 1
  FROM public.customers
  WHERE id = p_customer_id
    AND coalesce(credit_balance, 0) > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found for customer';
  END IF;

  v_payment_method := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
  IF v_payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
    v_payment_method := 'CASH';
  END IF;

  v_tx_code := 'PAY-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

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
    NULL,
    '[' || v_tx_code || '] Credit repayment | by=' || coalesce(p_recorded_by_name, 'system'),
    p_recorded_by
  )
  RETURNING balance_after INTO v_balance_after;

  RETURN json_build_object(
    'success', true,
    'balance_after', CASE WHEN coalesce(v_balance_after, 0) < 0 THEN abs(v_balance_after) ELSE 0 END
  );
END;
$$;

COMMIT;
