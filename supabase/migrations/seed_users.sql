-- ================================================
-- SEED USERS AND FIX ROLES
-- ================================================

-- 1. Update auth_employees role check constraint to include 'employee'
ALTER TABLE auth_employees DROP CONSTRAINT IF EXISTS auth_employees_role_check;
ALTER TABLE auth_employees ADD CONSTRAINT auth_employees_role_check
  CHECK (role IN ('admin', 'franchise_manager', 'factory_manager', 'employee'));

-- 2. Create Franchises table if it doesn't exist (it should be in schema.sql but just in case)
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_active column exists (in case table existed but column didn't)
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Insert Dummy Franchise
INSERT INTO franchises (id, name, address, city, state, phone, email, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'FabZClean Downtown',
  '123 Main St',
  'Metropolis',
  'NY',
  '555-0100',
  'downtown@fabzclean.com',
  true
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Franchise Manager
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

-- 5. Insert Employee
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
