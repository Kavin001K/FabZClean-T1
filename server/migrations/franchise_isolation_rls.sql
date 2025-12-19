-- =====================================================
-- FRANCHISE ISOLATION - Row Level Security Policies
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "orders_franchise_isolation" ON orders;
DROP POLICY IF EXISTS "orders_admin_access" ON orders;
DROP POLICY IF EXISTS "orders_factory_manager_access" ON orders;
DROP POLICY IF EXISTS "service_role_full_access" ON orders;
DROP POLICY IF EXISTS "authenticated_franchise_isolation" ON orders;
DROP POLICY IF EXISTS "authenticated_franchise_insert" ON orders;
DROP POLICY IF EXISTS "authenticated_franchise_update" ON orders;

-- Policy 1: Allow authenticated users to see orders from their franchise only
-- This uses the auth.jwt() function to get the user's claims
-- Note: This requires setting franchise_id in the JWT claims

-- For now, create a permissive policy that allows service role full access
-- The API handles isolation, this is a backup layer

-- Create policy for service role (API access) - full access
CREATE POLICY "service_role_full_access" ON orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users based on franchise_id
-- This requires the user's JWT to contain franchise_id claim
CREATE POLICY "authenticated_franchise_isolation" ON orders
FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin (no franchise restriction)
  auth.jwt()->>'role' = 'admin'
  OR
  -- Allow if user is factory_manager (can see all orders)
  auth.jwt()->>'role' = 'factory_manager'
  OR
  -- Allow if order's franchise_id matches user's franchise_id
  franchise_id = auth.jwt()->>'franchise_id'
  OR
  -- Allow if franchise_id is null (legacy data)
  franchise_id IS NULL
);

-- Same for INSERT
CREATE POLICY "authenticated_franchise_insert" ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'role' = 'admin'
  OR
  franchise_id = auth.jwt()->>'franchise_id'
);

-- Same for UPDATE
CREATE POLICY "authenticated_franchise_update" ON orders
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'role' = 'admin'
  OR
  auth.jwt()->>'role' = 'factory_manager'
  OR
  franchise_id = auth.jwt()->>'franchise_id'
);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'orders';

-- =====================================================
-- INDEX for faster franchise filtering
-- =====================================================

-- Create index for faster franchise_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_franchise_id ON orders(franchise_id);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS idx_orders_franchise_status ON orders(franchise_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_franchise_created ON orders(franchise_id, created_at DESC);

-- =====================================================
-- VERIFICATION: Check current franchise distribution
-- =====================================================

-- See how orders are distributed across franchises
SELECT 
  franchise_id,
  COUNT(*) as order_count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
GROUP BY franchise_id
ORDER BY order_count DESC;

-- Check for orders without franchise_id (potential issues)
SELECT COUNT(*) as orders_without_franchise
FROM orders
WHERE franchise_id IS NULL;

-- IMPORTANT: Notify to refresh schema cache
NOTIFY pgrst, 'reload schema';
