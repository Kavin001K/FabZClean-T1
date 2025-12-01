-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix for missing role column in users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Create settings table
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

-- Create transit_orders table
CREATE TABLE IF NOT EXISTS transit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transit_id TEXT UNIQUE NOT NULL DEFAULT ('TR-' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '-' || substring(md5(random()::text) from 1 for 4)),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_transit_orders_transit_id ON transit_orders(transit_id);
CREATE INDEX IF NOT EXISTS idx_transit_orders_status ON transit_orders(status);
CREATE INDEX IF NOT EXISTS idx_transit_orders_type ON transit_orders(type);

-- Create transit_order_items table
CREATE TABLE IF NOT EXISTS transit_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transit_order_id UUID REFERENCES transit_orders(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id),
  order_number TEXT,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  item_count INTEGER DEFAULT 0,
  weight DECIMAL(10, 2) DEFAULT 0,
  service_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transit_order_items_transit_order_id ON transit_order_items(transit_order_id);
CREATE INDEX IF NOT EXISTS idx_transit_order_items_order_id ON transit_order_items(order_id);

-- Create transit_status_history table
CREATE TABLE IF NOT EXISTS transit_status_history (
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

CREATE INDEX IF NOT EXISTS idx_transit_status_history_transit_order_id ON transit_status_history(transit_order_id);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for settings
CREATE POLICY "Authenticated users can view settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role::text = 'admin'
    )
  );

-- Policies for transit_orders
CREATE POLICY "Authenticated users can view transit orders" ON transit_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit orders" ON transit_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role::text IN ('admin', 'employee', 'franchise_manager', 'factory_manager')
    )
  );

-- Policies for transit_order_items
CREATE POLICY "Authenticated users can view transit order items" ON transit_order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit order items" ON transit_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role::text IN ('admin', 'employee', 'franchise_manager', 'factory_manager')
    )
  );

-- Policies for transit_status_history
CREATE POLICY "Authenticated users can view transit status history" ON transit_status_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage transit status history" ON transit_status_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role::text IN ('admin', 'employee', 'franchise_manager', 'factory_manager')
    )
  );
