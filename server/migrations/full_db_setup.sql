-- PART 1: SCHEMA SETUP
-- Run this block first to create all tables.

-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DROP EXISTING TABLES
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "employee_performance" CASCADE;
DROP TABLE IF EXISTS "employee_tasks" CASCADE;
DROP TABLE IF EXISTS "employee_attendance" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "barcodes" CASCADE;
DROP TABLE IF EXISTS "shipments" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP TABLE IF EXISTS "order_transactions" CASCADE;
DROP TABLE IF EXISTS "posTransactions" CASCADE;
DROP TABLE IF EXISTS "deliveries" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "franchises" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "gst_config" CASCADE;
DROP TABLE IF EXISTS "drivers" CASCADE;
DROP TABLE IF EXISTS "transit_status_history" CASCADE;
DROP TABLE IF EXISTS "transit_order_items" CASCADE;
DROP TABLE IF EXISTS "transit_orders" CASCADE;
DROP TABLE IF EXISTS "auth_sessions" CASCADE;
DROP TABLE IF EXISTS "auth_users" CASCADE;

-- 2. CREATE TABLES

CREATE TABLE "franchises" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL UNIQUE,
    "owner_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "legal_entity_name" TEXT,
    "tax_id" TEXT,
    "status" TEXT DEFAULT 'active',
    "documents" JSONB,
    "agreement_start_date" TIMESTAMP,
    "agreement_end_date" TIMESTAMP,
    "royalty_percentage" NUMERIC(5, 2) DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "products" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10, 2) NOT NULL,
    "stock_quantity" INTEGER DEFAULT 0 NOT NULL,
    "reorder_level" INTEGER DEFAULT 10 NOT NULL,
    "supplier" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "customers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "total_orders" INTEGER DEFAULT 0,
    "total_spent" NUMERIC(10, 2) DEFAULT 0,
    "last_order" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "orders" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT REFERENCES "customers"("id"),
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "status" TEXT NOT NULL,
    "payment_status" TEXT DEFAULT 'pending' NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "items" JSONB NOT NULL,
    "shipping_address" JSONB,
    "pickup_date" TIMESTAMP,
    "advance_paid" NUMERIC(10, 2) DEFAULT 0,
    "payment_method" TEXT DEFAULT 'cash',
    "discount_type" TEXT,
    "discount_value" NUMERIC(10, 2),
    "coupon_code" TEXT,
    "extra_charges" NUMERIC(10, 2),
    "gst_enabled" BOOLEAN DEFAULT false,
    "gst_rate" NUMERIC(5, 2) DEFAULT 18.00,
    "gst_amount" NUMERIC(10, 2) DEFAULT 0.00,
    "pan_number" TEXT,
    "gst_number" TEXT,
    "special_instructions" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "deliveries" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" TEXT REFERENCES "orders"("id"),
    "driver_name" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_delivery" TIMESTAMP,
    "actual_delivery" TIMESTAMP,
    "location" JSONB,
    "route" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "order_transactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "transaction_number" VARCHAR(255) NOT NULL,
    "items" JSONB NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "cashier_id" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "services" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10, 2) NOT NULL,
    "duration" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Active' NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "shipments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "shipment_number" TEXT NOT NULL,
    "order_ids" JSONB NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_delivery" TIMESTAMP,
    "actual_delivery" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "barcodes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "code" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "data" JSONB,
    "image_path" TEXT,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "employees" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hire_date" TIMESTAMP NOT NULL,
    "salary" NUMERIC(10, 2) NOT NULL,
    "hourly_rate" NUMERIC(8, 2),
    "status" TEXT DEFAULT 'active' NOT NULL,
    "manager_id" TEXT REFERENCES "employees"("id"),
    "address" JSONB,
    "emergency_contact" JSONB,
    "skills" JSONB,
    "performance_rating" NUMERIC(3, 2) DEFAULT 0.00,
    "last_review_date" TIMESTAMP,
    "role" TEXT DEFAULT 'staff',
    "password" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "employee_attendance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "employee_id" TEXT REFERENCES "employees"("id") NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "clock_in" TIMESTAMP,
    "clock_out" TIMESTAMP,
    "break_start" TIMESTAMP,
    "break_end" TIMESTAMP,
    "total_hours" NUMERIC(4, 2),
    "status" TEXT DEFAULT 'present' NOT NULL,
    "notes" TEXT,
    "location_check_in" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "employee_tasks" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "employee_id" TEXT REFERENCES "employees"("id") NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT DEFAULT 'medium' NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_hours" NUMERIC(4, 2),
    "actual_hours" NUMERIC(4, 2),
    "due_date" TIMESTAMP,
    "completed_date" TIMESTAMP,
    "assigned_by" TEXT REFERENCES "employees"("id"),
    "metrics" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "employee_performance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "employee_id" TEXT REFERENCES "employees"("id") NOT NULL,
    "review_period" TEXT NOT NULL,
    "rating" NUMERIC(3, 2) NOT NULL,
    "goals" JSONB,
    "feedback" TEXT,
    "reviewed_by" TEXT REFERENCES "employees"("id"),
    "review_date" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "documents" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "type" TEXT DEFAULT 'invoice' NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT DEFAULT 'draft',
    "amount" NUMERIC(10, 2),
    "customer_name" TEXT,
    "order_number" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "employee_id" TEXT REFERENCES "employees"("id"),
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "settings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" TEXT UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "updated_by" TEXT
);

CREATE TABLE "gst_config" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_name" TEXT NOT NULL,
    "gstin" TEXT UNIQUE NOT NULL,
    "pan" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "state_code" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_ifsc" TEXT,
    "sac_code" TEXT,
    "logo_path" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "drivers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "license_number" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "vehicle_model" TEXT,
    "status" TEXT DEFAULT 'available',
    "rating" NUMERIC(3, 2) DEFAULT 5.0,
    "total_deliveries" INTEGER DEFAULT 0,
    "total_earnings" NUMERIC(10, 2) DEFAULT 0,
    "current_latitude" NUMERIC,
    "current_longitude" NUMERIC,
    "last_active" TIMESTAMP,
    "experience" INTEGER DEFAULT 0,
    "specialties" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "transit_orders" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "transit_id" TEXT UNIQUE NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "origin" TEXT,
    "destination" TEXT,
    "created_by" TEXT,
    "vehicle_number" TEXT,
    "vehicle_type" TEXT,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "driver_license" TEXT,
    "employee_name" TEXT,
    "employee_id" TEXT,
    "designation" TEXT,
    "employee_phone" TEXT,
    "total_orders" INTEGER DEFAULT 0,
    "total_items" INTEGER DEFAULT 0,
    "total_weight" NUMERIC DEFAULT 0,
    "orders" JSONB,
    "store_details" JSONB,
    "factory_details" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "completed_at" TIMESTAMP,
    "dispatched_at" TIMESTAMP,
    "received_at" TIMESTAMP
);

CREATE TABLE "transit_order_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "transit_order_id" TEXT REFERENCES "transit_orders"("id") ON DELETE CASCADE,
    "order_id" TEXT REFERENCES "orders"("id"),
    "order_number" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "item_count" INTEGER DEFAULT 0,
    "weight" NUMERIC DEFAULT 0,
    "service_type" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "transit_status_history" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "transit_order_id" TEXT REFERENCES "transit_orders"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "updated_by" TEXT,
    "latitude" NUMERIC,
    "longitude" NUMERIC,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_franchise ON "orders"("franchise_id");
CREATE INDEX IF NOT EXISTS idx_orders_customer ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"("status");
CREATE INDEX IF NOT EXISTS idx_customers_franchise ON "customers"("franchise_id");
CREATE INDEX IF NOT EXISTS idx_products_franchise ON "products"("franchise_id");
CREATE INDEX IF NOT EXISTS idx_employees_franchise ON "employees"("franchise_id");
CREATE INDEX IF NOT EXISTS idx_employees_email ON "employees"("email");
CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise ON "audit_logs"("franchise_id");
CREATE INDEX IF NOT EXISTS idx_transit_orders_status ON "transit_orders"("status");

-- PART 2: DATA SEEDING
-- Run this AFTER the tables are created successfully.

-- 1. Seed Franchises
INSERT INTO "franchises" (
    "id", "name", "franchise_id", "owner_name", "email", "phone", "address", "status", "created_at", "updated_at"
) VALUES 
(
    'franchise-pollachi', 
    'Fab Clean Pollachi', 
    'FAB-POLLACHI', 
    'Manager Pollachi', 
    'pollachi@fabzclean.com', 
    '9363059595', 
    '{"street": "#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram", "city": "Pollachi", "state": "Tamil Nadu", "zip": "642002"}',
    'active',
    NOW(),
    NOW()
),
(
    'franchise-kinathukadavu', 
    'Fab Clean Kinathukadavu', 
    'FAB-KIN', 
    'Manager Kinathukadavu', 
    'kinathukadavu@fabzclean.com', 
    '9363719595', 
    '{"street": "#442/11, Opp MlA Office, Krishnasamypuram", "city": "Kinathukadavu", "state": "Tamil Nadu", "zip": "642109"}',
    'active',
    NOW(),
    NOW()
);

-- 2. Seed Services (Full CSV List)
INSERT INTO "services" (
    "id", "franchise_id", "name", "category", "description", "price", "duration", "status"
) VALUES 
-- POLLACHI PRICES
(gen_random_uuid(), 'franchise-pollachi', 'Shirt', 'Ironing', 'Steam Ironing for Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shirt', 'Laundry', 'Wash & Iron for Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shirt', 'Dry Cleaning', 'Dry Cleaning for Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'T-Shirt', 'Ironing', 'Steam Ironing for T-Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'T-Shirt', 'Laundry', 'Wash & Iron for T-Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'T-Shirt', 'Dry Cleaning', 'Dry Cleaning for T-Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pant', 'Ironing', 'Steam Ironing for Pant', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pant', 'Laundry', 'Wash & Iron for Pant', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pant', 'Dry Cleaning', 'Dry Cleaning for Pant', 70.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Jeans', 'Ironing', 'Steam Ironing for Jeans', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Jeans', 'Laundry', 'Wash & Iron for Jeans', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Jeans', 'Dry Cleaning', 'Dry Cleaning for Jeans', 80.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shorts', 'Ironing', 'Steam Ironing for Shorts', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shorts', 'Laundry', 'Wash & Iron for Shorts', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shorts', 'Dry Cleaning', 'Dry Cleaning for Shorts', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Towel', 'Ironing', 'Steam Ironing for Towel', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Towel', 'Laundry', 'Wash & Iron for Towel', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Dhoti', 'Ironing', 'Steam Ironing for Dhoti', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Dhoti', 'Laundry', 'Wash & Iron for Dhoti', 60.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Dhoti', 'Dry Cleaning', 'Dry Cleaning for Dhoti', 120.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Lungi', 'Ironing', 'Steam Ironing for Lungi', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Lungi', 'Laundry', 'Wash & Iron for Lungi', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Lungi', 'Dry Cleaning', 'Dry Cleaning for Lungi', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Cotton)', 'Ironing', 'Steam Ironing for Saree (Cotton)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Cotton)', 'Laundry', 'Wash & Iron for Saree (Cotton)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Cotton)', 'Dry Cleaning', 'Dry Cleaning for Saree (Cotton)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Fancy)', 'Ironing', 'Steam Ironing for Saree (Fancy)', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Fancy)', 'Dry Cleaning', 'Dry Cleaning for Saree (Fancy)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Silk)', 'Ironing', 'Steam Ironing for Saree (Silk)', 80.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Saree (Silk)', 'Dry Cleaning', 'Dry Cleaning for Saree (Silk)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Top', 'Ironing', 'Steam Ironing for Chudithar Top', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Top', 'Laundry', 'Wash & Iron for Chudithar Top', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Top', 'Dry Cleaning', 'Dry Cleaning for Chudithar Top', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Bottom', 'Ironing', 'Steam Ironing for Chudithar Bottom', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Bottom', 'Laundry', 'Wash & Iron for Chudithar Bottom', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Chudithar Bottom', 'Dry Cleaning', 'Dry Cleaning for Chudithar Bottom', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shawl', 'Ironing', 'Steam Ironing for Shawl', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shawl', 'Laundry', 'Wash & Iron for Shawl', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Shawl', 'Dry Cleaning', 'Dry Cleaning for Shawl', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Nighty', 'Ironing', 'Steam Ironing for Nighty', 25.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Nighty', 'Laundry', 'Wash & Iron for Nighty', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Inskirt', 'Ironing', 'Steam Ironing for Inskirt', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Inskirt', 'Laundry', 'Wash & Iron for Inskirt', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blouse', 'Ironing', 'Steam Ironing for Blouse', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blouse', 'Laundry', 'Wash & Iron for Blouse', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blouse', 'Dry Cleaning', 'Dry Cleaning for Blouse', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Coat', 'Ironing', 'Steam Ironing for Coat', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Coat', 'Dry Cleaning', 'Dry Cleaning for Coat', 200.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Safari', 'Ironing', 'Steam Ironing for Safari', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Safari', 'Dry Cleaning', 'Dry Cleaning for Safari', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Kids Frock', 'Ironing', 'Steam Ironing for Kids Frock', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Kids Frock', 'Laundry', 'Wash & Iron for Kids Frock', 80.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Kids Frock', 'Dry Cleaning', 'Dry Cleaning for Kids Frock', 120.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Single)', 'Ironing', 'Steam Ironing for Bed Sheet (Single)', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Single)', 'Laundry', 'Wash & Iron for Bed Sheet (Single)', 80.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Single)', 'Dry Cleaning', 'Dry Cleaning for Bed Sheet (Single)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Double)', 'Ironing', 'Steam Ironing for Bed Sheet (Double)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Double)', 'Laundry', 'Wash & Iron for Bed Sheet (Double)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Bed Sheet (Double)', 'Dry Cleaning', 'Dry Cleaning for Bed Sheet (Double)', 200.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pillow Cover', 'Ironing', 'Steam Ironing for Pillow Cover', 10.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pillow Cover', 'Laundry', 'Wash & Iron for Pillow Cover', 20.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Pillow Cover', 'Dry Cleaning', 'Dry Cleaning for Pillow Cover', 40.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Window)', 'Ironing', 'Steam Ironing for Curtain (Window)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Window)', 'Laundry', 'Wash & Iron for Curtain (Window)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Window)', 'Dry Cleaning', 'Dry Cleaning for Curtain (Window)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Door)', 'Ironing', 'Steam Ironing for Curtain (Door)', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Door)', 'Laundry', 'Wash & Iron for Curtain (Door)', 120.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Curtain (Door)', 'Dry Cleaning', 'Dry Cleaning for Curtain (Door)', 180.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blanket (Single)', 'Laundry', 'Wash & Iron for Blanket (Single)', 150.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blanket (Single)', 'Dry Cleaning', 'Dry Cleaning for Blanket (Single)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blanket (Double)', 'Laundry', 'Wash & Iron for Blanket (Double)', 200.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Blanket (Double)', 'Dry Cleaning', 'Dry Cleaning for Blanket (Double)', 350.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Carpet (Small)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Small)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Carpet (Medium)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Medium)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-pollachi', 'Carpet (Big)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Big)', 350.00, '72 hours', 'Active'),
-- KINATHUKADAVU PRICES
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shirt', 'Ironing', 'Steam Ironing for Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shirt', 'Laundry', 'Wash & Iron for Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shirt', 'Dry Cleaning', 'Dry Cleaning for Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'T-Shirt', 'Ironing', 'Steam Ironing for T-Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'T-Shirt', 'Laundry', 'Wash & Iron for T-Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'T-Shirt', 'Dry Cleaning', 'Dry Cleaning for T-Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pant', 'Ironing', 'Steam Ironing for Pant', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pant', 'Laundry', 'Wash & Iron for Pant', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pant', 'Dry Cleaning', 'Dry Cleaning for Pant', 70.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Jeans', 'Ironing', 'Steam Ironing for Jeans', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Jeans', 'Laundry', 'Wash & Iron for Jeans', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Jeans', 'Dry Cleaning', 'Dry Cleaning for Jeans', 80.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shorts', 'Ironing', 'Steam Ironing for Shorts', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shorts', 'Laundry', 'Wash & Iron for Shorts', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shorts', 'Dry Cleaning', 'Dry Cleaning for Shorts', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Towel', 'Ironing', 'Steam Ironing for Towel', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Towel', 'Laundry', 'Wash & Iron for Towel', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Dhoti', 'Ironing', 'Steam Ironing for Dhoti', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Dhoti', 'Laundry', 'Wash & Iron for Dhoti', 60.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Dhoti', 'Dry Cleaning', 'Dry Cleaning for Dhoti', 120.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Lungi', 'Ironing', 'Steam Ironing for Lungi', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Lungi', 'Laundry', 'Wash & Iron for Lungi', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Lungi', 'Dry Cleaning', 'Dry Cleaning for Lungi', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Cotton)', 'Ironing', 'Steam Ironing for Saree (Cotton)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Cotton)', 'Laundry', 'Wash & Iron for Saree (Cotton)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Cotton)', 'Dry Cleaning', 'Dry Cleaning for Saree (Cotton)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Fancy)', 'Ironing', 'Steam Ironing for Saree (Fancy)', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Fancy)', 'Dry Cleaning', 'Dry Cleaning for Saree (Fancy)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Silk)', 'Ironing', 'Steam Ironing for Saree (Silk)', 80.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Saree (Silk)', 'Dry Cleaning', 'Dry Cleaning for Saree (Silk)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Top', 'Ironing', 'Steam Ironing for Chudithar Top', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Top', 'Laundry', 'Wash & Iron for Chudithar Top', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Top', 'Dry Cleaning', 'Dry Cleaning for Chudithar Top', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Bottom', 'Ironing', 'Steam Ironing for Chudithar Bottom', 20.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Bottom', 'Laundry', 'Wash & Iron for Chudithar Bottom', 30.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Chudithar Bottom', 'Dry Cleaning', 'Dry Cleaning for Chudithar Bottom', 60.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shawl', 'Ironing', 'Steam Ironing for Shawl', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shawl', 'Laundry', 'Wash & Iron for Shawl', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Shawl', 'Dry Cleaning', 'Dry Cleaning for Shawl', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Nighty', 'Ironing', 'Steam Ironing for Nighty', 25.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Nighty', 'Laundry', 'Wash & Iron for Nighty', 40.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Inskirt', 'Ironing', 'Steam Ironing for Inskirt', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Inskirt', 'Laundry', 'Wash & Iron for Inskirt', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blouse', 'Ironing', 'Steam Ironing for Blouse', 15.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blouse', 'Laundry', 'Wash & Iron for Blouse', 25.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blouse', 'Dry Cleaning', 'Dry Cleaning for Blouse', 50.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Coat', 'Ironing', 'Steam Ironing for Coat', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Coat', 'Dry Cleaning', 'Dry Cleaning for Coat', 200.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Safari', 'Ironing', 'Steam Ironing for Safari', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Safari', 'Dry Cleaning', 'Dry Cleaning for Safari', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Kids Frock', 'Ironing', 'Steam Ironing for Kids Frock', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Kids Frock', 'Laundry', 'Wash & Iron for Kids Frock', 80.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Kids Frock', 'Dry Cleaning', 'Dry Cleaning for Kids Frock', 120.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Single)', 'Ironing', 'Steam Ironing for Bed Sheet (Single)', 40.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Single)', 'Laundry', 'Wash & Iron for Bed Sheet (Single)', 80.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Single)', 'Dry Cleaning', 'Dry Cleaning for Bed Sheet (Single)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Double)', 'Ironing', 'Steam Ironing for Bed Sheet (Double)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Double)', 'Laundry', 'Wash & Iron for Bed Sheet (Double)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Bed Sheet (Double)', 'Dry Cleaning', 'Dry Cleaning for Bed Sheet (Double)', 200.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pillow Cover', 'Ironing', 'Steam Ironing for Pillow Cover', 10.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pillow Cover', 'Laundry', 'Wash & Iron for Pillow Cover', 20.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Pillow Cover', 'Dry Cleaning', 'Dry Cleaning for Pillow Cover', 40.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Window)', 'Ironing', 'Steam Ironing for Curtain (Window)', 50.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Window)', 'Laundry', 'Wash & Iron for Curtain (Window)', 100.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Window)', 'Dry Cleaning', 'Dry Cleaning for Curtain (Window)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Door)', 'Ironing', 'Steam Ironing for Curtain (Door)', 60.00, '24 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Door)', 'Laundry', 'Wash & Iron for Curtain (Door)', 120.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Curtain (Door)', 'Dry Cleaning', 'Dry Cleaning for Curtain (Door)', 180.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blanket (Single)', 'Laundry', 'Wash & Iron for Blanket (Single)', 150.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blanket (Single)', 'Dry Cleaning', 'Dry Cleaning for Blanket (Single)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blanket (Double)', 'Laundry', 'Wash & Iron for Blanket (Double)', 200.00, '48 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Blanket (Double)', 'Dry Cleaning', 'Dry Cleaning for Blanket (Double)', 350.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Carpet (Small)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Small)', 150.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Carpet (Medium)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Medium)', 250.00, '72 hours', 'Active'),
(gen_random_uuid(), 'franchise-kinathukadavu', 'Carpet (Big)', 'Dry Cleaning', 'Dry Cleaning for Carpet (Big)', 350.00, '72 hours', 'Active');

-- 3. Seed Employees (Admin & Staff)
INSERT INTO "employees" (
    "id", "franchise_id", "first_name", "last_name", "role", "email", "password", "employee_id", "phone", "position", "department", "hire_date", "salary", "status"
) VALUES 
(
    'admin-user-id',
    'franchise-pollachi',
    'System',
    'Admin',
    'admin',
    'admin@myfabclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Durai@2025
    'myfabclean',
    '9999999999',
    'Administrator',
    'Management',
    NOW(),
    100000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-pollachi',
    'Senthil',
    'Kumar',
    'manager',
    'manager.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'mgr-pol',
    '9876543210',
    'Store Manager',
    'Operations',
    NOW(),
    25000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-pollachi',
    'Ramesh',
    'Driver',
    'driver',
    'driver.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'drv-pol',
    '9876543211',
    'Delivery Driver',
    'Logistics',
    NOW(),
    15000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-pollachi',
    'Priya',
    'Staff',
    'staff',
    'staff.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'staff-pol',
    '9876543214',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-kinathukadavu',
    'Rajesh',
    'Kannan',
    'manager',
    'manager.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'mgr-kin',
    '9876543212',
    'Store Manager',
    'Operations',
    NOW(),
    25000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-kinathukadavu',
    'Suresh',
    'Driver',
    'driver',
    'driver.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'drv-kin',
    '9876543213',
    'Delivery Driver',
    'Logistics',
    NOW(),
    15000.00,
    'active'
),
(
    gen_random_uuid(),
    'franchise-kinathukadavu',
    'Karthik',
    'Staff',
    'staff',
    'staff.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'staff-kin',
    '9876543215',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
);

-- 4. Seed Test Customer
INSERT INTO "customers" (
    "id", "franchise_id", "name", "email", "phone", "address", "total_orders", "total_spent", "created_at"
) VALUES 
(
    gen_random_uuid(),
    'franchise-pollachi',
    'Walk-in Customer',
    'walkin@example.com',
    '0000000000',
    '{"street": "Local", "city": "Pollachi"}',
    0,
    0.00,
    NOW()
);

COMMIT;
