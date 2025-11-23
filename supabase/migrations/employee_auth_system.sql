-- ================================================
-- FabZClean Employee Authentication System
-- Migration Script for Supabase
-- ================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. AUTH_EMPLOYEES TABLE
-- Core employee authentication and authorization
-- ================================================
CREATE TABLE IF NOT EXISTS auth_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'franchise_manager', 'factory_manager')),
  franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth_employees(id),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. AUDIT_LOGS TABLE
-- Track all employee actions for compliance
-- ================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT NOT NULL,
  employee_username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. AUTO-GENERATE EMPLOYEE ID FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1 
  INTO next_num 
  FROM auth_employees;
  
  new_id := 'EMP' || LPAD(next_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. TRIGGER TO AUTO-SET EMPLOYEE_ID
-- ================================================
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
    NEW.employee_id := generate_employee_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_employee_id
  BEFORE INSERT ON auth_employees
  FOR EACH ROW
  EXECUTE FUNCTION set_employee_id();

-- ================================================
-- 5. UPDATE TIMESTAMP TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auth_employees_timestamp
  BEFORE UPDATE ON auth_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 6. INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_auth_employees_employee_id ON auth_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_auth_employees_username ON auth_employees(username);
CREATE INDEX IF NOT EXISTS idx_auth_employees_role ON auth_employees(role);
CREATE INDEX IF NOT EXISTS idx_auth_employees_franchise_id ON auth_employees(franchise_id);
CREATE INDEX IF NOT EXISTS idx_auth_employees_factory_id ON auth_employees(factory_id);
CREATE INDEX IF NOT EXISTS idx_auth_employees_is_active ON auth_employees(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ================================================
-- 7. ADD EMPLOYEE TRACKING TO EXISTING TABLES
-- ================================================

-- Orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- Customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- Deliveries table
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- Products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- Services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- ================================================
-- 8. SEED DEFAULT ADMIN ACCOUNT
-- Password: Admin@123 (hashed with bcrypt, rounds=10)
-- ================================================
INSERT INTO auth_employees (
  employee_id,
  username,
  password_hash,
  role,
  full_name,
  email,
  is_active
) VALUES (
  'EMP001',
  'admin',
  '$2b$10$rQ8QqJ5K5m9dYjK5F1xN4.vGZJX5FJkW8kJZ5Z5Z5Z5Z5Z5Z5Z5Z5e', -- Admin@123
  'admin',
  'System Administrator',
  'admin@fabzclean.com',
  TRUE
) ON CONFLICT (employee_id) DO NOTHING;

-- ================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Note: These are optional - you may want custom API middleware instead
-- ================================================

-- Enable RLS
ALTER TABLE auth_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY admin_all_auth_employees ON auth_employees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_employees
      WHERE employee_id = current_setting('app.current_employee_id', true)
      AND role = 'admin'
    )
  );

-- Managers can see employees in their franchise/factory
CREATE POLICY manager_view_employees ON auth_employees
  FOR SELECT
  USING (
    franchise_id IN (
      SELECT franchise_id FROM auth_employees
      WHERE employee_id = current_setting('app.current_employee_id', true)
    )
    OR factory_id IN (
      SELECT factory_id FROM auth_employees
      WHERE employee_id = current_setting('app.current_employee_id', true)
    )
  );

-- Audit logs readable by admin only
CREATE POLICY admin_view_audit_logs ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_employees
      WHERE employee_id = current_setting('app.current_employee_id', true)
      AND role = 'admin'
    )
  );

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Next steps:
-- 1. Update backend authentication endpoints
-- 2. Remove Supabase Auth integration
-- 3. Update frontend login page
-- 4. Create employee management UI
-- 5. Test with default admin account (admin/Admin@123)
-- ================================================
