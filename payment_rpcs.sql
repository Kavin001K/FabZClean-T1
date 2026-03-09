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
    WHERE id = p_order_id;
    
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
