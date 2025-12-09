-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Franchises Table
CREATE TABLE IF NOT EXISTS franchises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  franchise_id TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address JSONB NOT NULL,
  legal_entity_name TEXT,
  tax_id TEXT,
  status TEXT DEFAULT 'active',
  documents JSONB,
  agreement_start_date TIMESTAMP WITH TIME ZONE,
  agreement_end_date TIMESTAMP WITH TIME ZONE,
  royalty_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  franchise_id TEXT REFERENCES franchises(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  order_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB,
  pickup_date TIMESTAMP WITH TIME ZONE,
  advance_paid DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  discount_type TEXT,
  discount_value DECIMAL(10, 2),
  coupon_code TEXT,
  extra_charges DECIMAL(10, 2),
  gst_enabled BOOLEAN DEFAULT false,
  gst_rate DECIMAL(5, 2) DEFAULT 18.00,
  gst_amount DECIMAL(10, 2) DEFAULT 0.00,
  pan_number TEXT,
  gst_number TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT REFERENCES orders(id),
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  location JSONB,
  route JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Transactions Table
CREATE TABLE IF NOT EXISTS order_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id TEXT REFERENCES franchises(id),
  transaction_number VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  cashier_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  shipment_number TEXT NOT NULL,
  order_ids JSONB NOT NULL,
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcodes Table
CREATE TABLE IF NOT EXISTS barcodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data JSONB,
  image_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  employee_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  hire_date TIMESTAMP WITH TIME ZONE NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(8, 2),
  status TEXT NOT NULL DEFAULT 'active',
  manager_id TEXT REFERENCES employees(id),
  address JSONB,
  emergency_contact JSONB,
  skills JSONB,
  performance_rating DECIMAL(3, 2) DEFAULT 0.00,
  last_review_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Attendance Table
CREATE TABLE IF NOT EXISTS employee_attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  employee_id TEXT REFERENCES employees(id) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4, 2),
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  location_check_in JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Tasks Table
CREATE TABLE IF NOT EXISTS employee_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  employee_id TEXT REFERENCES employees(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_hours DECIMAL(4, 2),
  actual_hours DECIMAL(4, 2),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  assigned_by TEXT REFERENCES employees(id),
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Performance Table
CREATE TABLE IF NOT EXISTS employee_performance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  employee_id TEXT REFERENCES employees(id) NOT NULL,
  review_period TEXT NOT NULL,
  rating DECIMAL(3, 2) NOT NULL,
  goals JSONB,
  feedback TEXT,
  reviewed_by TEXT REFERENCES employees(id),
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  franchise_id TEXT REFERENCES franchises(id),
  type TEXT NOT NULL DEFAULT 'invoice',
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  amount DECIMAL(10, 2),
  customer_name TEXT,
  order_number TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table (for app configuration)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  category TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers Table (implied by SupabaseStorage)
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  status TEXT DEFAULT 'active',
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  vehicle_type TEXT DEFAULT 'Bike',
  vehicle_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Transactions Table (implied by SupabaseStorage if different from order_transactions, but likely the same. SupabaseStorage uses 'posTransactions' table name)
-- If SupabaseStorage uses 'posTransactions', we should alias or create it.
-- Looking at SupabaseStorage.ts: .from('posTransactions')
CREATE TABLE IF NOT EXISTS "posTransactions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_number TEXT NOT NULL,
  items JSONB,
  total_amount DECIMAL(10, 2),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth Employees Table (for authentication)
CREATE TABLE IF NOT EXISTS auth_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- admin, franchise_manager, factory_manager, employee, driver
  franchise_id TEXT REFERENCES franchises(id),
  factory_id TEXT, -- Assuming factory table might exist or just an ID
  full_name TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT,
  department TEXT,
  hire_date TIMESTAMP WITH TIME ZONE,
  salary_type TEXT,
  base_salary DECIMAL(10, 2),
  hourly_rate DECIMAL(8, 2),
  working_hours DECIMAL(4, 2),
  emergency_contact TEXT,
  qualifications TEXT,
  notes TEXT,
  address TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  employee_username TEXT NOT NULL,
  action TEXT NOT NULL, -- login, create_order, update_order, payment_update, print_bill, etc.
  entity_type TEXT, -- order, customer, product, etc.
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posTransactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for now (since we are using anon key and want it to work easily)
-- WARNING: This is for development only. In production, you should restrict access.

DROP POLICY IF EXISTS "Allow public access to franchises" ON franchises;
CREATE POLICY "Allow public access to franchises" ON franchises FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to users" ON users;
CREATE POLICY "Allow public access to users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to products" ON products;
CREATE POLICY "Allow public access to products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to customers" ON customers;
CREATE POLICY "Allow public access to customers" ON customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to services" ON services;
CREATE POLICY "Allow public access to services" ON services FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to orders" ON orders;
CREATE POLICY "Allow public access to orders" ON orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to deliveries" ON deliveries;
CREATE POLICY "Allow public access to deliveries" ON deliveries FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to order_transactions" ON order_transactions;
CREATE POLICY "Allow public access to order_transactions" ON order_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to shipments" ON shipments;
CREATE POLICY "Allow public access to shipments" ON shipments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to barcodes" ON barcodes;
CREATE POLICY "Allow public access to barcodes" ON barcodes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to employees" ON employees;
CREATE POLICY "Allow public access to employees" ON employees FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to employee_attendance" ON employee_attendance;
CREATE POLICY "Allow public access to employee_attendance" ON employee_attendance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to employee_tasks" ON employee_tasks;
CREATE POLICY "Allow public access to employee_tasks" ON employee_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to employee_performance" ON employee_performance;
CREATE POLICY "Allow public access to employee_performance" ON employee_performance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to documents" ON documents;
CREATE POLICY "Allow public access to documents" ON documents FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to settings" ON settings;
CREATE POLICY "Allow public access to settings" ON settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to drivers" ON drivers;
CREATE POLICY "Allow public access to drivers" ON drivers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to posTransactions" ON "posTransactions";
CREATE POLICY "Allow public access to posTransactions" ON "posTransactions" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to auth_employees" ON auth_employees;
CREATE POLICY "Allow public access to auth_employees" ON auth_employees FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to audit_logs" ON audit_logs;
CREATE POLICY "Allow public access to audit_logs" ON audit_logs FOR ALL USING (true);
