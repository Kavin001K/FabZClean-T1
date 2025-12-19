-- =====================================================
-- ORDER SEQUENCES TABLE
-- For generating unique order numbers: FZC-2025POL0001A
-- =====================================================

-- Create sequence table for order numbers
CREATE TABLE IF NOT EXISTS order_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    suffix_letter CHAR(1) NOT NULL DEFAULT 'A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_code, year)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_order_sequences_lookup 
ON order_sequences(branch_code, year);

-- Initialize sequences for existing branches
INSERT INTO order_sequences (branch_code, year, sequence_number, suffix_letter)
VALUES 
    ('POL', 2025, 1, 'A'),
    ('KIN', 2025, 1, 'A')
ON CONFLICT (branch_code, year) DO NOTHING;

-- Function to get next order number atomically
CREATE OR REPLACE FUNCTION get_next_order_number(p_branch_code VARCHAR)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_suffix CHAR(1);
    v_result TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    
    -- Lock row for update to prevent race conditions
    SELECT sequence_number, suffix_letter INTO v_sequence, v_suffix
    FROM order_sequences
    WHERE branch_code = p_branch_code AND year = v_year
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Create new sequence for this branch/year
        INSERT INTO order_sequences (branch_code, year, sequence_number, suffix_letter)
        VALUES (p_branch_code, v_year, 1, 'A')
        RETURNING sequence_number, suffix_letter INTO v_sequence, v_suffix;
    ELSE
        -- Increment sequence
        v_sequence := v_sequence + 1;
        
        -- Check for rollover
        IF v_sequence > 9999 THEN
            v_sequence := 1;
            v_suffix := CHR(ASCII(v_suffix) + 1);
            
            -- If we exceeded Z, start from A (should rarely happen)
            IF v_suffix > 'Z' THEN
                v_suffix := 'A';
            END IF;
        END IF;
        
        -- Update sequence
        UPDATE order_sequences 
        SET sequence_number = v_sequence, 
            suffix_letter = v_suffix,
            updated_at = NOW()
        WHERE branch_code = p_branch_code AND year = v_year;
    END IF;
    
    -- Format: FZC-2025POL0001A
    v_result := 'FZC-' || v_year || p_branch_code || LPAD(v_sequence::TEXT, 4, '0') || v_suffix;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_order_number(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_number(VARCHAR) TO service_role;

-- Verify the function works
SELECT get_next_order_number('POL') as sample_order_number;

-- Enable RLS
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_order_sequences" ON order_sequences
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notify schema refresh
NOTIFY pgrst, 'reload schema';
