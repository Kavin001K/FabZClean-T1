-- =====================================================================
-- PAYMENT ENGINE RPC FUNCTIONS
-- =====================================================================

-- 1. Wallet Recharge (Top-Up)
-- Adds money to the user's wallet and creates a wallet transaction log.
CREATE OR REPLACE FUNCTION process_wallet_recharge(
    p_customer_id TEXT,
    p_amount NUMERIC(10, 2),
    p_payment_method TEXT,
    p_recorded_by TEXT,
    p_recorded_by_name TEXT
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
    v_balance_before NUMERIC(10, 2);
    v_balance_after NUMERIC(10, 2);
    v_wallet_id TEXT;
    v_transaction_id TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    -- Ensure wallet exists or create it
    SELECT id, balance INTO v_wallet_id, v_balance_before 
    FROM wallets 
    WHERE customer_id = p_customer_id FOR UPDATE;

    IF NOT FOUND THEN
        v_balance_before := 0;
        INSERT INTO wallets (customer_id, balance, status)
        VALUES (p_customer_id, 0, 'active')
        RETURNING id INTO v_wallet_id;
    END IF;

    v_balance_after := v_balance_before + p_amount;

    -- Update wallet balance
    UPDATE wallets SET balance = v_balance_after WHERE id = v_wallet_id;

    -- Generate transaction ID
    v_transaction_id := 'TRX-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(ROUND(RANDOM() * 999999)::TEXT, 6, '0');

    -- Insert wallet transaction
    INSERT INTO wallet_transactions (
        transaction_id, 
        customer_id, 
        type, 
        amount, 
        balance_before, 
        balance_after, 
        verified_by_staff
    ) VALUES (
        v_transaction_id,
        p_customer_id,
        'credit',
        p_amount,
        v_balance_before,
        v_balance_after,
        p_recorded_by
    );

    RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Canonical Checkout Engine (v2)
-- Uses immutable wallet ledger model and supports idempotent retries.
CREATE OR REPLACE FUNCTION process_payment_checkout_v2(
    p_order_id TEXT,
    p_customer_id TEXT,
    p_cash_amount NUMERIC(10, 2) DEFAULT 0,
    p_use_wallet BOOLEAN DEFAULT TRUE,
    p_wallet_debit_requested NUMERIC(10, 2) DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'CASH',
    p_recorded_by TEXT DEFAULT NULL,
    p_recorded_by_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_order_total NUMERIC(10, 2);
    v_advance_paid NUMERIC(10, 2);
    v_remaining_amount NUMERIC(10, 2);
    v_order_payment_status TEXT;
    v_order_customer_id TEXT;

    v_wallet_balance_before NUMERIC(10, 2) := 0;
    v_wallet_balance_after NUMERIC(10, 2) := 0;
    v_credit_balance_after NUMERIC(10, 2) := 0;

    v_wallet_debited NUMERIC(10, 2) := 0;
    v_cash_applied NUMERIC(10, 2) := 0;
    v_credit_assigned NUMERIC(10, 2) := 0;

    v_new_advance_paid NUMERIC(10, 2) := 0;
    v_new_payment_status TEXT;

    v_wallet_tx_code TEXT := NULL;
    v_credit_tx_code TEXT := NULL;
    v_payment_method_normalized TEXT := NULL;
    v_request_key TEXT;

    v_existing_order_id TEXT;
BEGIN
    -- 1) Lock order and get current payment context.
    SELECT
        id,
        total_amount,
        COALESCE(advance_paid, 0),
        COALESCE(payment_status, 'pending'),
        customer_id
    INTO
        v_existing_order_id,
        v_order_total,
        v_advance_paid,
        v_order_payment_status,
        v_order_customer_id
    FROM orders
    WHERE id = p_order_id::UUID
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

    SELECT COALESCE(wallet_balance_cache, 0)
    INTO v_wallet_balance_before
    FROM customers
    WHERE id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;

    v_remaining_amount := GREATEST(v_order_total - v_advance_paid, 0);

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

    -- 2) Short idempotency guard for duplicate submissions.
    v_request_key := md5(
        concat_ws(
            '|',
            p_order_id,
            COALESCE(p_cash_amount, 0)::TEXT,
            COALESCE(p_use_wallet, FALSE)::TEXT,
            COALESCE(p_wallet_debit_requested, -1)::TEXT,
            COALESCE(p_payment_method, '')
        )
    );

    IF EXISTS (
        SELECT 1
        FROM wallet_transactions wt
        WHERE wt.reference_id = p_order_id
          AND wt.note ILIKE '%' || v_request_key || '%'
          AND wt.created_at > (NOW() - INTERVAL '30 seconds')
    ) THEN
        v_credit_assigned := GREATEST(v_order_total - v_advance_paid, 0);

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

    -- 3) Compute deterministic split: wallet first, then cash, rest as credit.
    IF COALESCE(p_use_wallet, FALSE) THEN
        IF COALESCE(p_wallet_debit_requested, 0) > 0 THEN
            v_wallet_debited := LEAST(
                v_remaining_amount,
                GREATEST(v_wallet_balance_before, 0),
                p_wallet_debit_requested
            );
        ELSE
            v_wallet_debited := LEAST(
                v_remaining_amount,
                GREATEST(v_wallet_balance_before, 0)
            );
        END IF;
    END IF;

    v_cash_applied := LEAST(
        GREATEST(v_remaining_amount - v_wallet_debited, 0),
        GREATEST(COALESCE(p_cash_amount, 0), 0)
    );

    -- 4) Persist ledger entries (single source of truth).
    -- For first posting, create one ORDER debit for current remainder.
    IF v_order_payment_status <> 'credit' THEN
        v_credit_tx_code := 'CRD-' || TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS') || '-' || SUBSTRING(md5(random()::TEXT), 1, 6);

        INSERT INTO wallet_transactions (
            customer_id,
            transaction_type,
            amount,
            verified_by_staff,
            reference_type,
            reference_id,
            note,
            created_by
        ) VALUES (
            p_customer_id,
            'DEBIT',
            -v_remaining_amount,
            p_recorded_by,
            'ORDER',
            p_order_id::UUID,
            '[' || v_credit_tx_code || '] Auto order debit | req=' || v_request_key || ' | by=' || COALESCE(p_recorded_by_name, 'system'),
            p_recorded_by
        );
    END IF;

    -- Apply current payment as a PAYMENT credit entry.
    IF v_cash_applied > 0 THEN
        v_payment_method_normalized := UPPER(REPLACE(COALESCE(p_payment_method, 'CASH'), ' ', '_'));
        IF v_payment_method_normalized NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE') THEN
            v_payment_method_normalized := 'CASH';
        END IF;

        v_wallet_tx_code := 'WLT-' || TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS') || '-' || SUBSTRING(md5(random()::TEXT), 1, 6);

        INSERT INTO wallet_transactions (
            customer_id,
            transaction_type,
            amount,
            payment_method,
            verified_by_staff,
            reference_type,
            reference_id,
            note,
            created_by
        ) VALUES (
            p_customer_id,
            'CREDIT',
            v_cash_applied,
            v_payment_method_normalized,
            p_recorded_by,
            'PAYMENT',
            p_order_id::UUID,
            '[' || v_wallet_tx_code || '] Order payment received | req=' || v_request_key || ' | by=' || COALESCE(p_recorded_by_name, 'system'),
            p_recorded_by
        );
    END IF;

    -- 5) Derive post-state from ledger-updated customer balances.
    SELECT
        COALESCE(wallet_balance_cache, 0),
        COALESCE(credit_balance, 0)
    INTO
        v_wallet_balance_after,
        v_credit_balance_after
    FROM customers
    WHERE id = p_customer_id;

    v_new_advance_paid := LEAST(v_order_total, v_advance_paid + v_wallet_debited + v_cash_applied);
    v_credit_assigned := GREATEST(v_order_total - v_new_advance_paid, 0);
    v_new_payment_status := CASE WHEN v_credit_assigned > 0 THEN 'credit' ELSE 'paid' END;

    UPDATE orders
    SET
        customer_id = COALESCE(customer_id, p_customer_id),
        advance_paid = v_new_advance_paid,
        wallet_used = LEAST(v_order_total, COALESCE(wallet_used, 0) + v_wallet_debited),
        credit_used = v_credit_assigned,
        payment_status = v_new_payment_status,
        payment_method = CASE
            WHEN v_wallet_debited > 0 AND v_cash_applied > 0 THEN 'SPLIT'
            WHEN v_wallet_debited > 0 THEN 'CREDIT_WALLET'
            WHEN v_cash_applied > 0 THEN COALESCE(v_payment_method_normalized, 'CASH')
            ELSE payment_method
        END,
        updated_at = NOW()
    WHERE id = p_order_id::UUID;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Process Payment Checkout (Wallet + Cash Split + Credit Allocation)
-- Handles the automated split logic.
CREATE OR REPLACE FUNCTION process_payment_checkout(
    p_order_id TEXT,
    p_customer_id TEXT,
    p_cash_amount NUMERIC(10, 2),
    p_wallet_amount NUMERIC(10, 2),
    p_recorded_by TEXT,
    p_recorded_by_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_order_total NUMERIC(10, 2);
    v_advance_paid NUMERIC(10, 2);
    v_remaining_amount NUMERIC(10, 2);
    
    v_wallet_balance_before NUMERIC(10, 2);
    v_wallet_balance_after NUMERIC(10, 2);
    v_wallet_id TEXT;
    
    v_credit_to_assign NUMERIC(10, 2) := 0;
    
    v_credit_account_id TEXT;
    v_credit_balance_before NUMERIC(10, 2);
    v_credit_balance_after NUMERIC(10, 2);

    v_transaction_id TEXT;
    v_payment_status TEXT;
    
    v_total_paid NUMERIC(10, 2);
    v_wallet_used NUMERIC(10, 2) := 0;
    v_credit_used NUMERIC(10, 2) := 0;
BEGIN
    -- 1. Get Order Details
    SELECT total_amount, COALESCE(advance_paid, 0)
    INTO v_order_total, v_advance_paid
    FROM orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    v_remaining_amount := v_order_total - v_advance_paid;

    IF v_remaining_amount <= 0 THEN
        RAISE EXCEPTION 'Order is already fully paid';
    END IF;
    
    v_total_paid := p_cash_amount + p_wallet_amount;

    -- 2. Validate and Process Wallet Deduction
    IF p_wallet_amount > 0 THEN
        SELECT id, balance INTO v_wallet_id, v_wallet_balance_before 
        FROM wallets 
        WHERE customer_id = p_customer_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Wallet not found for customer';
        END IF;

        IF v_wallet_balance_before < p_wallet_amount THEN
            RAISE EXCEPTION 'Insufficient wallet balance. Has: %, Trying to use: %', v_wallet_balance_before, p_wallet_amount;
        END IF;

        v_wallet_balance_after := v_wallet_balance_before - p_wallet_amount;
        v_wallet_used := p_wallet_amount;

        UPDATE wallets SET balance = v_wallet_balance_after, updated_at = NOW() WHERE id = v_wallet_id;

        v_transaction_id := 'TRX-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(ROUND(RANDOM() * 999999)::TEXT, 6, '0');

        INSERT INTO wallet_transactions (
            transaction_id, customer_id, type, amount, balance_before, balance_after, reference_order_id, verified_by_staff
        ) VALUES (
            v_transaction_id, p_customer_id, 'debit', p_wallet_amount, v_wallet_balance_before, v_wallet_balance_after, p_order_id, p_recorded_by
        );
    END IF;

    -- 3. Calculate if Credit is needed (If Total Paid < Remaining Amount)
    IF v_total_paid < v_remaining_amount THEN
        v_credit_to_assign := v_remaining_amount - v_total_paid;
        v_credit_used := v_credit_to_assign;

        -- Get or create credit account
        SELECT id, total_credit INTO v_credit_account_id, v_credit_balance_before 
        FROM credit_accounts 
        WHERE customer_id = p_customer_id FOR UPDATE;

        IF NOT FOUND THEN
            v_credit_balance_before := 0;
            INSERT INTO credit_accounts (customer_id, total_credit, credit_limit, status)
            VALUES (p_customer_id, 0, 500, 'active')
            RETURNING id INTO v_credit_account_id;
        END IF;

        v_credit_balance_after := v_credit_balance_before + v_credit_to_assign;

        UPDATE credit_accounts SET total_credit = v_credit_balance_after, updated_at = NOW() WHERE id = v_credit_account_id;

        v_transaction_id := 'TRX-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(ROUND(RANDOM() * 999999)::TEXT, 6, '0');

        INSERT INTO credit_ledger (
            transaction_id, customer_id, order_id, type, amount, balance_after
        ) VALUES (
            v_transaction_id, p_customer_id, p_order_id, 'credit', v_credit_to_assign, v_credit_balance_after
        );
        
        v_payment_status := 'credit';
    ELSE
        IF v_advance_paid + v_total_paid >= v_order_total THEN
            v_payment_status := 'paid';
        ELSE
            v_payment_status := 'partial';
        END IF;
    END IF;


    -- 4. Update the Order
    UPDATE orders 
    SET 
        advance_paid = COALESCE(advance_paid, 0) + v_total_paid,
        wallet_used = COALESCE(wallet_used, 0) + v_wallet_used,
        credit_used = COALESCE(credit_used, 0) + v_credit_used,
        payment_status = v_payment_status,
        updated_at = NOW()
    WHERE id = p_order_id::UUID;
    
    RETURN json_build_object(
        'success', true, 
        'payment_status', v_payment_status,
        'wallet_used', v_wallet_used,
        'credit_used', v_credit_used
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Process Credit Repayment
CREATE OR REPLACE FUNCTION process_credit_repayment(
    p_customer_id TEXT,
    p_amount NUMERIC(10, 2),
    p_payment_method TEXT,
    p_recorded_by TEXT,
    p_recorded_by_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_credit_account_id TEXT;
    v_credit_balance_before NUMERIC(10, 2);
    v_credit_balance_after NUMERIC(10, 2);
    v_transaction_id TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Repayment amount must be strictly positive';
    END IF;

    SELECT id, total_credit INTO v_credit_account_id, v_credit_balance_before 
    FROM credit_accounts 
    WHERE customer_id = p_customer_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Credit account not found for customer';
    END IF;

    v_credit_balance_after := v_credit_balance_before - p_amount;

    UPDATE credit_accounts 
    SET total_credit = v_credit_balance_after, updated_at = NOW() 
    WHERE id = v_credit_account_id;

    v_transaction_id := 'TRX-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(ROUND(RANDOM() * 999999)::TEXT, 6, '0');

    INSERT INTO credit_ledger (
        transaction_id, customer_id, type, amount, balance_after
    ) VALUES (
        v_transaction_id, p_customer_id, 'debit', p_amount, v_credit_balance_after
    );

    RETURN json_build_object(
        'success', true, 
        'balance_after', v_credit_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
