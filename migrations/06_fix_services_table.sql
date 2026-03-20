-- ================================================
-- FabZClean: Fix services table missing columns
-- Run this in Supabase SQL Editor
-- ================================================

-- The services table is missing: description, duration, updated_at
-- Current columns: id, name, category, price, created_at, status

-- Add 'description' column (optional text field)
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;

-- Add 'duration' column (required, default '24 hrs')
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration text NOT NULL DEFAULT '24 hrs';

-- Add 'updated_at' column with auto-update trigger
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at_trigger ON services;
CREATE TRIGGER services_updated_at_trigger
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

-- Verify: show all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;
