-- =====================================================================
-- FabZClean QUICK FIX: Order Creation Error
-- Run this IMMEDIATELY in Supabase SQL Editor to fix order creation
-- For: EC2 / Production / Cloud Supabase
-- =====================================================================

-- Step 1: Add missing columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_express_order" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal';

-- Step 2: Create order_sequences table for proper order number generation
CREATE TABLE IF NOT EXISTS "order_sequences" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "branch_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "letter_suffix" CHAR(1) NOT NULL DEFAULT 'A',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("branch_code", "year")
);

-- Step 3: Enable RLS and create policy
ALTER TABLE "order_sequences" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON "order_sequences";
CREATE POLICY "Allow public access" ON "order_sequences" FOR ALL USING (true);

-- Step 4: Create the order number generation function
CREATE OR REPLACE FUNCTION get_next_order_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    v_sequence INTEGER;
    v_letter CHAR(1);
BEGIN
    -- Try to update existing sequence, if not exists insert new one
    INSERT INTO order_sequences (branch_code, year, current_sequence, letter_suffix)
    VALUES (p_branch_code, v_year, 1, 'A')
    ON CONFLICT (branch_code, year) 
    DO UPDATE SET 
        current_sequence = order_sequences.current_sequence + 1,
        updated_at = NOW()
    RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    
    -- Handle overflow (>9999)
    IF v_sequence > 9999 THEN
        UPDATE order_sequences 
        SET current_sequence = 1, 
            letter_suffix = CHR(ASCII(letter_suffix) + 1)
        WHERE branch_code = p_branch_code AND year = v_year
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    END IF;
    
    RETURN 'FZC-' || v_year::TEXT || p_branch_code || LPAD(v_sequence::TEXT, 4, '0') || v_letter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create transit number function
CREATE OR REPLACE FUNCTION get_next_transit_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count FROM transit_orders 
    WHERE transit_id LIKE 'TRN-' || v_year::TEXT || p_branch_code || '%';
    RETURN v_year::TEXT || p_branch_code || LPAD(v_count::TEXT, 3, '0') || 'A';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Test by creating an order.
