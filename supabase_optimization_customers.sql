-- 1. Create a sequence for Customer ID generation if it doesn't exist
-- Format: FZC + YY + MY + 0000 (e.g., FZC26MY0001)
DO $$
DECLARE
    max_seq INTEGER;
    current_year_prefix TEXT;
BEGIN
    current_year_prefix := 'FZC' || to_char(now(), 'YY') || 'MY';
    
    -- Detect max sequence specifically for CURRENT year/prefix format
    SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '^FZC..MY', '', 'g'), '')::INTEGER), 0) INTO max_seq 
    FROM customers 
    WHERE id LIKE current_year_prefix || '%';
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'customer_id_seq') THEN
        CREATE SEQUENCE customer_id_seq START WITH 1;
    END IF;
    
    -- Sync sequence to max existing or start at 1
    PERFORM setval('customer_id_seq', GREATEST(max_seq, 0) + 1, false);
END $$;

-- 2. Function to get next customer ID efficiently
CREATE OR REPLACE FUNCTION get_next_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_val INTEGER;
    v_year TEXT;
BEGIN
    next_val := nextval('customer_id_seq');
    v_year := to_char(now(), 'YY'); 
    RETURN 'FZC' || v_year || 'MY' || LPAD(next_val::TEXT, 4, '0');
END;
$$;

-- 3. Optimized Bulk Import Function
CREATE OR REPLACE FUNCTION import_customers_bulk(p_customers JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer JSONB;
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_inserted_ids TEXT[] := ARRAY[]::TEXT[];
    v_skipped_phones TEXT[] := ARRAY[]::TEXT[];
    v_phone TEXT;
    v_new_id TEXT;
BEGIN
    FOR v_customer IN SELECT value FROM jsonb_array_elements(p_customers)
    LOOP
        BEGIN
            v_phone := v_customer->>'phone';
            
            -- Basic validation: must have name and phone
            IF (v_customer->>'name') IS NULL OR v_phone IS NULL THEN
                v_errors := v_errors + 1;
                CONTINUE;
            END IF;

            -- Check for existing phone number to avoid duplicates
            IF EXISTS (SELECT 1 FROM customers WHERE phone = v_phone) THEN
                v_skipped_phones := array_append(v_skipped_phones, v_phone);
                CONTINUE;
            END IF;

            -- Insert customer with all supported fields
            INSERT INTO customers (
                id, 
                name, 
                email, 
                phone, 
                address, 
                notes, 
                company_name, 
                tax_id, 
                date_of_birth, 
                credit_limit,
                status,
                total_orders,
                total_spent,
                wallet_balance_cache,
                credit_balance,
                payment_terms,
                franchise_id,
                created_at,
                updated_at
            ) VALUES (
                COALESCE(v_customer->>'id', get_next_customer_id()),
                v_customer->>'name',
                v_customer->>'email',
                v_phone,
                COALESCE(v_customer->'address', '{}'::jsonb),
                v_customer->>'notes',
                v_customer->>'companyName',
                v_customer->>'taxId',
                v_customer->>'dateOfBirth',
                COALESCE(v_customer->>'creditLimit', '1000')::DECIMAL,
                COALESCE(v_customer->>'status', 'active'),
                COALESCE((v_customer->>'totalOrders')::INTEGER, 0),
                COALESCE((v_customer->>'totalSpent')::DECIMAL, 0),
                COALESCE((v_customer->>'walletBalanceCache')::DECIMAL, 0),
                COALESCE((v_customer->>'creditBalance')::DECIMAL, 0),
                v_customer->>'paymentTerms',
                v_customer->>'franchiseId',
                NOW(),
                NOW()
            ) RETURNING id INTO v_new_id;
            
            v_inserted_ids := array_append(v_inserted_ids, v_new_id);
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'inserted_count', v_count,
        'error_count', v_errors,
        'skipped_phones', v_skipped_phones,
        'inserted_ids', v_inserted_ids
    );
END;
$$;

-- 4. Ensure Indexes exist for high performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
