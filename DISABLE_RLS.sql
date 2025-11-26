-- Run this in Supabase SQL Editor to fix ALL RLS issues

-- Disable RLS on all critical tables (for development)
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON customers;
DROP POLICY IF EXISTS "Allow anon to select" ON customers;
DROP POLICY IF EXISTS "Allow anon to insert" ON customers;
DROP POLICY IF EXISTS "Allow anon to update" ON customers;
DROP POLICY IF EXISTS "Allow anon to delete" ON customers;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('customers', 'orders', 'services', 'products', 'auth_employees', 'employees');

-- Expected output: All should show rowsecurity = false
