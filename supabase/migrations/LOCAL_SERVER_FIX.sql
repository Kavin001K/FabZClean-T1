-- =====================================================================
-- FabZClean LOCAL SERVER FIX: Order Creation Error
-- Run this on your LOCAL PostgreSQL server (non-Supabase)
-- Compatible with standard PostgreSQL 12+
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Add Missing Columns (if not exist)
-- =====================================================================

-- Check and add is_express_order column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'is_express_order'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "is_express_order" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_express_order column';
    ELSE
        RAISE NOTICE 'is_express_order column already exists';
    END IF;
END $$;

-- Check and add priority column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'priority'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "priority" TEXT DEFAULT 'normal';
        RAISE NOTICE 'Added priority column';
    ELSE
        RAISE NOTICE 'priority column already exists';
    END IF;
END $$;

-- =====================================================================
-- PART 2: Create Order Sequences Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS "order_sequences" (
    "id" SERIAL PRIMARY KEY,
    "branch_code" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "letter_suffix" CHAR(1) NOT NULL DEFAULT 'A',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_branch_year" UNIQUE ("branch_code", "year")
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_order_seq_lookup" 
ON "order_sequences"("branch_code", "year");

-- =====================================================================
-- PART 3: Order Number Generation Function (PostgreSQL compatible)
-- =====================================================================

CREATE OR REPLACE FUNCTION get_next_order_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_letter CHAR(1);
    v_result TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Lock the table to prevent race conditions
    LOCK TABLE order_sequences IN ROW EXCLUSIVE MODE;
    
    -- Try to get and increment existing sequence
    UPDATE order_sequences 
    SET current_sequence = current_sequence + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE branch_code = p_branch_code AND year = v_year
    RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    
    -- If no row was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO order_sequences (branch_code, year, current_sequence, letter_suffix)
        VALUES (p_branch_code, v_year, 1, 'A')
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    END IF;
    
    -- Handle sequence overflow (roll to next letter after 9999)
    IF v_sequence > 9999 THEN
        UPDATE order_sequences 
        SET current_sequence = 1,
            letter_suffix = CHR(ASCII(letter_suffix) + 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE branch_code = p_branch_code AND year = v_year
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    END IF;
    
    -- Format: FZC-2026POL0001A
    v_result := 'FZC-' || v_year::TEXT || p_branch_code || 
                LPAD(v_sequence::TEXT, 4, '0') || v_letter;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 4: Transit Number Generation Function
-- =====================================================================

CREATE OR REPLACE FUNCTION get_next_transit_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_count INTEGER;
    v_result TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Count existing transit orders for this branch/year
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_count
    FROM transit_orders 
    WHERE transit_id LIKE 'TRN-' || v_year::TEXT || p_branch_code || '%';
    
    -- Format: 2026POL001A (caller adds TRN- prefix and direction suffix)
    v_result := v_year::TEXT || p_branch_code || LPAD(v_count::TEXT, 3, '0') || 'A';
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 5: Performance Indexes
-- =====================================================================

-- Index for express order filtering
CREATE INDEX IF NOT EXISTS "idx_orders_express_filter" 
ON "orders"("is_express_order") WHERE "is_express_order" = true;

-- Index for priority sorting
CREATE INDEX IF NOT EXISTS "idx_orders_priority_sort" 
ON "orders"("priority");

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS "idx_orders_dashboard" 
ON "orders"("status", "priority", "created_at" DESC);

-- Index for customer phone lookups (common in laundry apps)
CREATE INDEX IF NOT EXISTS "idx_orders_customer_phone" 
ON "orders"("customer_phone");

-- =====================================================================
-- PART 6: Update Existing Data
-- =====================================================================

-- Set defaults for any NULL values
UPDATE "orders" SET "is_express_order" = false WHERE "is_express_order" IS NULL;
UPDATE "orders" SET "priority" = 'normal' WHERE "priority" IS NULL;

-- =====================================================================
-- VERIFICATION
-- =====================================================================

DO $$
DECLARE
    v_col_count INTEGER;
    v_func_exists BOOLEAN;
    v_seq_exists BOOLEAN;
BEGIN
    -- Verify columns
    SELECT COUNT(*) INTO v_col_count FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name IN ('is_express_order', 'priority');
    
    -- Verify function
    SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_next_order_number') INTO v_func_exists;
    
    -- Verify sequence table
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'order_sequences') INTO v_seq_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FabZClean Local Server Migration Report';
    RAISE NOTICE '========================================';
    
    IF v_col_count = 2 THEN
        RAISE NOTICE '[OK] Order columns: is_express_order, priority';
    ELSE
        RAISE NOTICE '[FAIL] Missing order columns!';
    END IF;
    
    IF v_func_exists THEN
        RAISE NOTICE '[OK] Function: get_next_order_number';
    ELSE
        RAISE NOTICE '[FAIL] Missing get_next_order_number function!';
    END IF;
    
    IF v_seq_exists THEN
        RAISE NOTICE '[OK] Table: order_sequences';
    ELSE
        RAISE NOTICE '[FAIL] Missing order_sequences table!';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration complete! Try creating an order.';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
