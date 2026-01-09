-- =====================================================================
-- FabZClean Complete Migration: Order Creation Fix
-- Compatible with: Supabase (EC2/Cloud) AND Local PostgreSQL Server
-- Run this script to fix order creation failures
-- Created: 2026-01-09
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Add Missing Columns to Orders Table
-- =====================================================================

-- Add express order support columns
ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "is_express_order" BOOLEAN DEFAULT false;

ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal';

-- =====================================================================
-- PART 2: Create Order Sequence Table (for atomic order number generation)
-- =====================================================================

CREATE TABLE IF NOT EXISTS "order_sequences" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "branch_code" TEXT NOT NULL UNIQUE,
    "year" INTEGER NOT NULL,
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "letter_suffix" CHAR(1) NOT NULL DEFAULT 'A',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security (Supabase requirement)
ALTER TABLE "order_sequences" ENABLE ROW LEVEL SECURITY;

-- Create public access policy (for development/local)
DROP POLICY IF EXISTS "Allow public access" ON "order_sequences";
CREATE POLICY "Allow public access" ON "order_sequences" FOR ALL USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_order_sequences_branch_year" 
ON "order_sequences"("branch_code", "year");

-- =====================================================================
-- PART 3: Create get_next_order_number Function (Atomic Sequence)
-- =====================================================================

CREATE OR REPLACE FUNCTION get_next_order_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_letter CHAR(1);
    v_order_number TEXT;
    v_row_exists BOOLEAN;
BEGIN
    -- Get current year (2-digit format for shorter order numbers)
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Lock the row for this branch/year to prevent race conditions
    SELECT EXISTS(
        SELECT 1 FROM order_sequences 
        WHERE branch_code = p_branch_code AND year = v_year
        FOR UPDATE
    ) INTO v_row_exists;
    
    IF v_row_exists THEN
        -- Update existing sequence
        UPDATE order_sequences 
        SET current_sequence = current_sequence + 1,
            updated_at = NOW()
        WHERE branch_code = p_branch_code AND year = v_year
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
        
        -- Check if we need to roll over to next letter (9999 limit per letter)
        IF v_sequence > 9999 THEN
            UPDATE order_sequences 
            SET current_sequence = 1,
                letter_suffix = CHR(ASCII(letter_suffix) + 1),
                updated_at = NOW()
            WHERE branch_code = p_branch_code AND year = v_year
            RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
        END IF;
    ELSE
        -- Insert new sequence for this branch/year
        INSERT INTO order_sequences (branch_code, year, current_sequence, letter_suffix)
        VALUES (p_branch_code, v_year, 1, 'A')
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    END IF;
    
    -- Format: FZC-2026POL0001A
    v_order_number := 'FZC-' || v_year::TEXT || p_branch_code || 
                      LPAD(v_sequence::TEXT, 4, '0') || v_letter;
    
    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 4: Create get_next_transit_number Function
-- =====================================================================

CREATE OR REPLACE FUNCTION get_next_transit_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_count INTEGER;
    v_transit_id TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Count existing transit orders for this branch/year
    SELECT COUNT(*) + 1 INTO v_count
    FROM transit_orders 
    WHERE transit_id LIKE 'TRN-' || v_year::TEXT || p_branch_code || '%';
    
    -- Format: 2026POL001A (without TRN- prefix and direction, those are added by caller)
    v_transit_id := v_year::TEXT || p_branch_code || LPAD(v_count::TEXT, 3, '0') || 'A';
    
    RETURN v_transit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 5: Create Indexes for Performance
-- =====================================================================

-- Index for express order queries
CREATE INDEX IF NOT EXISTS "idx_orders_express" 
ON "orders"("is_express_order") WHERE "is_express_order" = true;

-- Index for priority-based sorting
CREATE INDEX IF NOT EXISTS "idx_orders_priority" 
ON "orders"("priority");

-- Composite index for common order queries
CREATE INDEX IF NOT EXISTS "idx_orders_status_priority" 
ON "orders"("status", "priority", "created_at" DESC);

-- =====================================================================
-- PART 6: Update Existing Orders (Set Defaults)
-- =====================================================================

-- Set default values for existing orders that have NULL
UPDATE "orders" SET "is_express_order" = false WHERE "is_express_order" IS NULL;
UPDATE "orders" SET "priority" = 'normal' WHERE "priority" IS NULL;

-- =====================================================================
-- VERIFICATION: Check all components are in place
-- =====================================================================

DO $$
DECLARE
    v_column_count INTEGER;
    v_function_exists BOOLEAN;
    v_table_exists BOOLEAN;
BEGIN
    -- Check columns
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name IN ('is_express_order', 'priority');
    
    IF v_column_count = 2 THEN
        RAISE NOTICE '✅ Express order columns added successfully';
    ELSE
        RAISE WARNING '❌ Missing columns in orders table';
    END IF;
    
    -- Check function exists
    SELECT EXISTS(
        SELECT 1 FROM pg_proc WHERE proname = 'get_next_order_number'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✅ get_next_order_number function created';
    ELSE
        RAISE WARNING '❌ get_next_order_number function missing';
    END IF;
    
    -- Check sequence table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_sequences'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        RAISE NOTICE '✅ order_sequences table created';
    ELSE
        RAISE WARNING '❌ order_sequences table missing';
    END IF;
    
    RAISE NOTICE '🎉 Migration complete! Order creation should now work.';
END $$;

COMMIT;
