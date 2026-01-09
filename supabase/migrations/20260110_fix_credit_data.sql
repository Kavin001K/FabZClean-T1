-- DATA CORRECTION SCRIPT
-- Fixes missing credit transactions for orders marked as 'credit'
-- Run this in your Supabase SQL Editor

DO $$ 
DECLARE 
    r RECORD;
    cust_record RECORD;
    new_balance DECIMAL;
    current_balance DECIMAL;
BEGIN
    RAISE NOTICE 'Starting Credit Correction...';

    -- Iterate through orders that are 'credit' but have no corresponding credit transaction
    FOR r IN 
        SELECT o.id, o.order_number, o.customer_id, o.total_amount, o.franchise_id, o.created_at
        FROM orders o
        WHERE o.payment_status = 'credit'
        AND o.customer_id IS NOT NULL -- Only valid customers
        AND NOT EXISTS (
            SELECT 1 FROM credit_transactions ct 
            WHERE ct.order_id = o.id AND ct.type = 'credit'
        )
    LOOP
        -- Get current customer balance
        SELECT credit_balance INTO current_balance FROM customers WHERE id = r.customer_id;
        
        -- Calculate new balance
        new_balance := COALESCE(current_balance, 0) + r.total_amount;
        
        -- Insert missing transaction
        INSERT INTO credit_transactions (
            franchise_id, 
            customer_id, 
            order_id, 
            type, 
            amount, 
            balance_after, 
            notes, 
            reason,
            created_at,
            recorded_by,
            transaction_date
        ) VALUES (
            r.franchise_id, 
            r.customer_id, 
            r.id, 
            'credit', 
            r.total_amount, 
            new_balance, 
            'System Correction: Backfilling missing credit for Order ' || r.order_number,
            'Order placed on credit (Backfill)',
            r.created_at,
            'SYSTEM',
            r.created_at
        );
        
        -- Update customer balance
        UPDATE customers 
        SET credit_balance = new_balance
        WHERE id = r.customer_id;
        
        RAISE NOTICE 'Fixed credit for Order % - Added % to Customer %', r.order_number, r.total_amount, r.customer_id;
    END LOOP;
    
    RAISE NOTICE 'Credit Correction Completed.';
END $$;
