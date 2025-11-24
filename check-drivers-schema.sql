-- ================================================
-- Check Drivers Table Schema
-- Run this to see what columns actually exist
-- ================================================

-- Show all columns in the drivers table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;
