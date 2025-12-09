-- ================================================
-- SEED USERS - Fixed Version (JSON Compatible)
-- Run AFTER schema.sql and add_missing_tables.sql
-- ================================================

-- 1. Add missing columns to franchises table (if they don't exist)
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Check if address is JSONB and convert if needed
-- If address is JSONB, we need to insert JSON format
-- First, let's try to alter it to TEXT if possible
DO $$
BEGIN
  -- Try to change address to TEXT if it's JSONB
  BEGIN
    ALTER TABLE franchises ALTER COLUMN address TYPE TEXT USING address::TEXT;
  EXCEPTION WHEN OTHERS THEN
    -- Column might already be TEXT or conversion failed, ignore
    NULL;
  END;
END $$;

-- 3. Update auth_employees role check constraint
ALTER TABLE auth_employees DROP CONSTRAINT IF EXISTS auth_employees_role_check;
ALTER TABLE auth_employees ADD CONSTRAINT auth_employees_role_check
  CHECK (role IN ('admin', 'franchise_manager', 'factory_manager', 'employee', 'staff'));

-- 4. Insert Dummy Franchise (using TEXT for address)
INSERT INTO franchises (id, name, address, phone, email, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'FabZClean Downtown',
  '123 Main St, Metropolis, NY',
  '555-0100',
  'downtown@fabzclean.com',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

-- 5. Insert Franchise Manager
-- Password: Manager@123
INSERT INTO auth_employees (
  employee_id,
  username,
  password_hash,
  role,
  full_name,
  email,
  franchise_id,
  is_active
) VALUES (
  'EMP002',
  'manager',
  '$2b$10$dmjpHm9EyIETbfvV4Hvwr.S.GwqeBn6KP/lJXIH5V5GCXRvyqkHgW',
  'franchise_manager',
  'Franchise Manager',
  'manager@fabzclean.com',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  true
) ON CONFLICT (username) DO NOTHING;

-- 6. Insert Employee (Staff)
-- Password: Employee@123
INSERT INTO auth_employees (
  employee_id,
  username,
  password_hash,
  role,
  full_name,
  email,
  franchise_id,
  is_active
) VALUES (
  'EMP003',
  'employee',
  '$2b$10$koSj0YI57vwyqcQnRkA3v.8W0E72kzAVnUM80PAD454CQPEKz4Jeu',
  'employee',
  'John Doe',
  'employee@fabzclean.com',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  true
) ON CONFLICT (username) DO NOTHING;

-- 7. Insert Factory Manager
-- Password: Factory@123
INSERT INTO auth_employees (
  employee_id,
  username,
  password_hash,
  role,
  full_name,
  email,
  is_active
) VALUES (
  'EMP004',
  'factory_manager',
  '$2b$10$dmjpHm9EyIETbfvV4Hvwr.S.GwqeBn6KP/lJXIH5V5GCXRvyqkHgW',
  'factory_manager',
  'Factory Manager',
  'factory@fabzclean.com',
  true
) ON CONFLICT (username) DO NOTHING;
