-- =====================================================
-- TRANSIT ORDER SYSTEM - Complete Migration Script
-- Run this ONCE in Supabase SQL Editor
-- Last Updated: 2025-12-10
-- =====================================================

-- Step 1: Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Step 2: SETTINGS TABLE (Create if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- =====================================================
-- Step 3: DROP EXISTING TRANSIT TABLES (Clean Slate)
-- This ensures correct column types are applied
-- =====================================================
DROP TABLE IF EXISTS transit_status_history CASCADE;
DROP TABLE IF EXISTS transit_order_items CASCADE;
DROP TABLE IF EXISTS transit_orders CASCADE;

-- =====================================================
-- Step 4: CREATE TRANSIT_ORDERS TABLE
-- =====================================================
CREATE TABLE transit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transit_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_transit',
  origin TEXT,
  destination TEXT,
  created_by TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_license TEXT,
  employee_name TEXT,
  employee_id TEXT,
  designation TEXT,
  employee_phone TEXT,
  franchise_id TEXT,
  total_orders INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_weight DECIMAL(10, 2) DEFAULT 0,
  orders JSONB,
  store_details JSONB,
  factory_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ
);

-- Indexes for transit_orders
CREATE INDEX idx_transit_orders_transit_id ON transit_orders(transit_id);
CREATE INDEX idx_transit_orders_status ON transit_orders(status);
CREATE INDEX idx_transit_orders_type ON transit_orders(type);
CREATE INDEX idx_transit_orders_franchise_id ON transit_orders(franchise_id);
CREATE INDEX idx_transit_orders_created_at ON transit_orders(created_at DESC);

-- =====================================================
-- Step 5: CREATE TRANSIT_ORDER_ITEMS TABLE
-- Note: order_id and customer_id are TEXT to match existing tables
-- =====================================================
CREATE TABLE transit_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transit_order_id UUID REFERENCES transit_orders(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT,
  order_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  item_count INTEGER DEFAULT 0,
  weight DECIMAL(10, 2) DEFAULT 0,
  service_type TEXT,
  status TEXT,
  franchise_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transit_order_items
CREATE INDEX idx_transit_order_items_transit_order_id ON transit_order_items(transit_order_id);
CREATE INDEX idx_transit_order_items_order_id ON transit_order_items(order_id);
CREATE INDEX idx_transit_order_items_franchise_id ON transit_order_items(franchise_id);

-- =====================================================
-- Step 6: CREATE TRANSIT_STATUS_HISTORY TABLE
-- =====================================================
CREATE TABLE transit_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transit_order_id UUID REFERENCES transit_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location JSONB,
  updated_by TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for transit_status_history
CREATE INDEX idx_transit_status_history_transit_order_id ON transit_status_history(transit_order_id);

-- =====================================================
-- Step 7: ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 8: DROP EXISTING POLICIES (Avoid Conflicts)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can view transit orders" ON transit_orders;
DROP POLICY IF EXISTS "Staff can manage transit orders" ON transit_orders;
DROP POLICY IF EXISTS "Authenticated users can view transit order items" ON transit_order_items;
DROP POLICY IF EXISTS "Staff can manage transit order items" ON transit_order_items;
DROP POLICY IF EXISTS "Authenticated users can view transit status history" ON transit_status_history;
DROP POLICY IF EXISTS "Staff can manage transit status history" ON transit_status_history;

-- =====================================================
-- Step 9: CREATE RLS POLICIES
-- Using id::text = auth.uid()::text for type safety
-- =====================================================

-- Settings Policies
CREATE POLICY "Authenticated users can view settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role::text = 'admin'
    )
  );

-- Transit Orders Policies
CREATE POLICY "Authenticated users can view transit orders" ON transit_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit orders" ON transit_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role::text IN ('admin', 'employee', 'staff', 'franchise_manager', 'factory_manager')
    )
  );

-- Transit Order Items Policies
CREATE POLICY "Authenticated users can view transit order items" ON transit_order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit order items" ON transit_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role::text IN ('admin', 'employee', 'staff', 'franchise_manager', 'factory_manager')
    )
  );

-- Transit Status History Policies
CREATE POLICY "Authenticated users can view transit status history" ON transit_status_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit status history" ON transit_status_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role::text IN ('admin', 'employee', 'staff', 'franchise_manager', 'factory_manager')
    )
  );

-- =====================================================
-- DONE! Transit system tables are ready.
-- =====================================================
