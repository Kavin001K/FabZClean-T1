-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE,
  password TEXT,
  email TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  sku TEXT,
  category TEXT,
  description TEXT,
  price TEXT,
  "stockQuantity" INTEGER,
  "reorderLevel" INTEGER,
  supplier TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  "totalOrders" INTEGER DEFAULT 0,
  "totalSpent" TEXT DEFAULT '0',
  "lastOrder" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "customerId" UUID REFERENCES customers(id),
  status TEXT,
  "totalAmount" TEXT,
  items JSONB,
  "orderNumber" TEXT,
  "customerName" TEXT,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "paymentStatus" TEXT,
  "shippingAddress" JSONB,
  "pickupDate" TIMESTAMPTZ,
  "deliveryDate" TIMESTAMPTZ,
  "baseAmount" TEXT,
  cgst TEXT,
  sgst TEXT,
  igst TEXT,
  "totalGst" TEXT,
  "gstNumber" TEXT,
  "isInterState" BOOLEAN DEFAULT FALSE,
  "invoiceNumber" TEXT,
  "invoiceDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID REFERENCES orders(id),
  status TEXT,
  "deliveredAt" TIMESTAMPTZ,
  "driverName" TEXT,
  "vehicleId" TEXT,
  "estimatedDelivery" TIMESTAMPTZ,
  "actualDelivery" TIMESTAMPTZ,
  location JSONB,
  route JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- POS Transactions Table
CREATE TABLE IF NOT EXISTS "posTransactions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID REFERENCES orders(id),
  amount TEXT,
  "paymentMethod" TEXT,
  "transactionNumber" TEXT,
  items JSONB,
  "cashierId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  description TEXT,
  price TEXT,
  category TEXT,
  duration TEXT,
  status TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID REFERENCES orders(id),
  "trackingNumber" TEXT,
  carrier TEXT,
  status TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Barcodes Table
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  "productId" UUID REFERENCES products(id),
  type TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  data TEXT,
  "imagePath" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  role TEXT,
  email TEXT UNIQUE,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedBy" TEXT
);

-- GST Config Table
CREATE TABLE IF NOT EXISTS gst_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "businessName" TEXT NOT NULL,
  gstin TEXT UNIQUE NOT NULL,
  pan TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  "stateCode" TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  "bankName" TEXT,
  "bankAccountNumber" TEXT,
  "bankIfsc" TEXT,
  "sacCode" TEXT,
  "logoPath" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Transit Orders Table
CREATE TABLE IF NOT EXISTS transit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transitId" TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  "createdBy" TEXT,
  "vehicleNumber" TEXT,
  "vehicleType" TEXT,
  "driverName" TEXT,
  "driverPhone" TEXT,
  "driverLicense" TEXT,
  "employeeName" TEXT,
  "employeeId" TEXT,
  designation TEXT,
  "employeePhone" TEXT,
  "totalOrders" INTEGER DEFAULT 0,
  "totalItems" INTEGER DEFAULT 0,
  "totalWeight" DECIMAL DEFAULT 0,
  orders JSONB,
  "storeDetails" JSONB,
  "factoryDetails" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "dispatchedAt" TIMESTAMPTZ,
  "receivedAt" TIMESTAMPTZ
);

-- Transit Order Items Table
CREATE TABLE IF NOT EXISTS transit_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transitOrderId" UUID REFERENCES transit_orders(id) ON DELETE CASCADE,
  "orderId" UUID REFERENCES orders(id),
  "orderNumber" TEXT,
  "customerId" UUID,
  "customerName" TEXT,
  "itemCount" INTEGER DEFAULT 0,
  weight DECIMAL DEFAULT 0,
  "serviceType" TEXT,
  status TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Transit Status History Table
CREATE TABLE IF NOT EXISTS transit_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transitOrderId" UUID REFERENCES transit_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  "updatedBy" TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  "licenseNumber" TEXT NOT NULL,
  "vehicleNumber" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "vehicleModel" TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  rating DECIMAL DEFAULT 5.0,
  "totalDeliveries" INTEGER DEFAULT 0,
  "totalEarnings" DECIMAL DEFAULT 0,
  "currentLatitude" DECIMAL,
  "currentLongitude" DECIMAL,
  "lastActive" TIMESTAMPTZ,
  experience INTEGER DEFAULT 0,
  specialties TEXT[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Auth Users Table (Supabase handles auth, but keeping for compatibility if needed)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auth Sessions Table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries("orderId");
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments("orderId");
CREATE INDEX IF NOT EXISTS idx_barcodes_product ON barcodes("productId");
CREATE INDEX IF NOT EXISTS idx_barcodes_code ON barcodes(code);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_transit_orders_transitId ON transit_orders("transitId");
CREATE INDEX IF NOT EXISTS idx_transit_orders_status ON transit_orders(status);
CREATE INDEX IF NOT EXISTS idx_transit_orders_type ON transit_orders(type);
CREATE INDEX IF NOT EXISTS idx_transit_order_items_transitOrderId ON transit_order_items("transitOrderId");
CREATE INDEX IF NOT EXISTS idx_transit_order_items_orderId ON transit_order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_transit_status_history_transitOrderId ON transit_status_history("transitOrderId");
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicleNumber ON drivers("vehicleNumber");
CREATE INDEX IF NOT EXISTS idx_drivers_licenseNumber ON drivers("licenseNumber");
