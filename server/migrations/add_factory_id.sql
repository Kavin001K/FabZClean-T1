-- ==========================================
-- FABZCLEAN DATABASE MIGRATION
-- Add missing columns to employees table
-- Run: sqlite3 fabzclean.db < server/migrations/add_factory_id.sql
-- ==========================================

-- Add factory_id column (for factory assignment)
ALTER TABLE employees ADD COLUMN factory_id INTEGER;

-- Add franchise_code column (for quick lookups)
ALTER TABLE employees ADD COLUMN franchise_code TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_factory_id ON employees(factory_id);
CREATE INDEX IF NOT EXISTS idx_employees_franchise_code ON employees(franchise_code);
