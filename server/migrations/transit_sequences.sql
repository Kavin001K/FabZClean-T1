-- =====================================================
-- TRANSIT SEQUENCES TABLE
-- For generating unique transit IDs: TRN-2025POL001A-F
-- =====================================================

-- Create sequence table for transit IDs
CREATE TABLE IF NOT EXISTS transit_sequences (
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
CREATE INDEX IF NOT EXISTS idx_transit_sequences_lookup 
ON transit_sequences(branch_code, year);

-- Initialize sequences for existing branches
INSERT INTO transit_sequences (branch_code, year, sequence_number, suffix_letter)
VALUES 
    ('POL', 2025, 1, 'A'),
    ('KIN', 2025, 1, 'A'),
    ('CBE', 2025, 1, 'A')
ON CONFLICT (branch_code, year) DO NOTHING;

-- Function to get next transit number atomically
CREATE OR REPLACE FUNCTION get_next_transit_number(p_branch_code VARCHAR)
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
    FROM transit_sequences
    WHERE branch_code = p_branch_code AND year = v_year
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Create new sequence for this branch/year
        INSERT INTO transit_sequences (branch_code, year, sequence_number, suffix_letter)
        VALUES (p_branch_code, v_year, 1, 'A')
        RETURNING sequence_number, suffix_letter INTO v_sequence, v_suffix;
    ELSE
        -- Increment sequence
        v_sequence := v_sequence + 1;
        
        -- Check for rollover (3 digits: 999)
        IF v_sequence > 999 THEN
            v_sequence := 1;
            v_suffix := CHR(ASCII(v_suffix) + 1);
            
            -- If we exceeded Z, start from A (should rarely happen)
            IF v_suffix > 'Z' THEN
                v_suffix := 'A';
            END IF;
        END IF;
        
        -- Update sequence
        UPDATE transit_sequences 
        SET sequence_number = v_sequence, 
            suffix_letter = v_suffix,
            updated_at = NOW()
        WHERE branch_code = p_branch_code AND year = v_year;
    END IF;
    
    -- Format: 2025POL001A (Caller will prepend TRN- and append -F/S)
    v_result := v_year || p_branch_code || LPAD(v_sequence::TEXT, 3, '0') || v_suffix;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_transit_number(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_transit_number(VARCHAR) TO service_role;

-- Verify the function works
SELECT get_next_transit_number('POL') as sample_transit_number;

-- Enable RLS
ALTER TABLE transit_sequences ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "service_role_transit_sequences" ON transit_sequences;
CREATE POLICY "service_role_transit_sequences" ON transit_sequences
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notify schema refresh
NOTIFY pgrst, 'reload schema';
