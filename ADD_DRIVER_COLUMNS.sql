-- Add missing columns to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'Bike';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_number TEXT;

-- Verify columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'drivers';
