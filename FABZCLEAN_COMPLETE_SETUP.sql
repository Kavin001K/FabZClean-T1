-- =====================================================================
-- FABZCLEAN COMPLETE DATABASE SETUP
-- Single consolidated SQL script - Run ONCE in Supabase SQL Editor
-- Generated: 2026-01-06
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- PART 2: DROP EXISTING TABLES (Clean Slate)
-- =====================================================================
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "employee_performance" CASCADE;
DROP TABLE IF EXISTS "employee_tasks" CASCADE;
DROP TABLE IF EXISTS "employee_attendance" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "barcodes" CASCADE;
DROP TABLE IF EXISTS "shipments" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "order_transactions" CASCADE;
DROP TABLE IF EXISTS "posTransactions" CASCADE;
DROP TABLE IF EXISTS "deliveries" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
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
DROP TABLE IF EXISTS "auth_employees" CASCADE;
DROP TABLE IF EXISTS "auth_users" CASCADE;

-- =====================================================================
-- PART 3: CREATE CORE TABLES
-- =====================================================================

-- Franchises Table
CREATE TABLE "franchises" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "agreement_start_date" TIMESTAMP WITH TIME ZONE,
    "agreement_end_date" TIMESTAMP WITH TIME ZONE,
    "royalty_percentage" NUMERIC(5, 2) DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE "products" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10, 2) NOT NULL,
    "stock_quantity" INTEGER DEFAULT 0 NOT NULL,
    "reorder_level" INTEGER DEFAULT 10 NOT NULL,
    "supplier" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_sku_per_franchise" UNIQUE ("franchise_id", "sku")
);

-- Customers Table
CREATE TABLE "customers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "total_orders" INTEGER DEFAULT 0,
    "total_spent" NUMERIC(10, 2) DEFAULT 0,
    "credit_balance" NUMERIC(10, 2) DEFAULT 0,
    "last_order" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Table
CREATE TABLE "services" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10, 2) NOT NULL,
    "duration" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Active' NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE "orders" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT REFERENCES "customers"("id") ON DELETE SET NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "status" TEXT NOT NULL,
    "payment_status" TEXT DEFAULT 'pending' NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "items" JSONB NOT NULL,
    "shipping_address" JSONB,
    "pickup_date" TIMESTAMP WITH TIME ZONE,
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
    "fulfillment_type" TEXT DEFAULT 'pickup',
    "delivery_charges" NUMERIC(10, 2) DEFAULT 0,
    "delivery_address" JSONB,
    "last_whatsapp_status" TEXT,
    "last_whatsapp_sent_at" TIMESTAMP WITH TIME ZONE,
    "whatsapp_message_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_order_number_per_franchise" UNIQUE ("franchise_id", "order_number")
);

-- Deliveries Table
CREATE TABLE "deliveries" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "order_id" TEXT REFERENCES "orders"("id") ON DELETE CASCADE,
    "driver_name" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_delivery" TIMESTAMP WITH TIME ZONE,
    "actual_delivery" TIMESTAMP WITH TIME ZONE,
    "location" JSONB,
    "route" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Transactions Table
CREATE TABLE "order_transactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "transaction_number" VARCHAR(255) NOT NULL,
    "items" JSONB NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "cashier_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- POS Transactions Table
CREATE TABLE "posTransactions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "transaction_number" TEXT NOT NULL,
    "items" JSONB,
    "total_amount" NUMERIC(10, 2),
    "payment_method" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments Table
CREATE TABLE "shipments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "shipment_number" TEXT NOT NULL,
    "order_ids" JSONB NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_delivery" TIMESTAMP WITH TIME ZONE,
    "actual_delivery" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcodes Table
CREATE TABLE "barcodes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "code" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "data" JSONB,
    "image_data" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees Table
CREATE TABLE "employees" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "employee_id" TEXT NOT NULL UNIQUE,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hire_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "salary" NUMERIC(10, 2) NOT NULL,
    "hourly_rate" NUMERIC(8, 2),
    "status" TEXT DEFAULT 'active' NOT NULL,
    "manager_id" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
    "address" JSONB,
    "emergency_contact" JSONB,
    "skills" JSONB,
    "performance_rating" NUMERIC(3, 2) DEFAULT 0.00,
    "last_review_date" TIMESTAMP WITH TIME ZONE,
    "role" TEXT DEFAULT 'staff',
    "password" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "check_employee_status" CHECK ("status" IN ('active', 'inactive', 'terminated'))
);

-- Auth Employees Table
CREATE TABLE "auth_employees" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employee_id" TEXT NOT NULL UNIQUE,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "franchise_id" TEXT REFERENCES "franchises"("id"),
    "factory_id" TEXT,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "position" TEXT,
    "department" TEXT,
    "hire_date" TIMESTAMP WITH TIME ZONE,
    "salary_type" TEXT,
    "base_salary" NUMERIC(10, 2),
    "hourly_rate" NUMERIC(8, 2),
    "working_hours" NUMERIC(4, 2),
    "emergency_contact" TEXT,
    "qualifications" TEXT,
    "notes" TEXT,
    "address" TEXT,
    "last_login" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Attendance Table
CREATE TABLE "employee_attendance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "employee_id" TEXT REFERENCES "employees"("id") ON DELETE CASCADE NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "clock_in" TIMESTAMP WITH TIME ZONE,
    "clock_out" TIMESTAMP WITH TIME ZONE,
    "break_start" TIMESTAMP WITH TIME ZONE,
    "break_end" TIMESTAMP WITH TIME ZONE,
    "total_hours" NUMERIC(4, 2),
    "status" TEXT DEFAULT 'present' NOT NULL,
    "notes" TEXT,
    "location_check_in" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_attendance_per_employee_date" UNIQUE ("employee_id", "date"),
    CONSTRAINT "check_attendance_status" CHECK ("status" IN ('present', 'absent', 'late', 'half_day', 'leave'))
);

-- Employee Tasks Table
CREATE TABLE "employee_tasks" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "employee_id" TEXT REFERENCES "employees"("id") ON DELETE CASCADE NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT DEFAULT 'medium' NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "estimated_hours" NUMERIC(4, 2),
    "actual_hours" NUMERIC(4, 2),
    "due_date" TIMESTAMP WITH TIME ZONE,
    "completed_date" TIMESTAMP WITH TIME ZONE,
    "assigned_by" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
    "metrics" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Performance Table
CREATE TABLE "employee_performance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "employee_id" TEXT REFERENCES "employees"("id") ON DELETE CASCADE NOT NULL,
    "review_period" TEXT NOT NULL,
    "rating" NUMERIC(3, 2) NOT NULL,
    "goals" JSONB,
    "feedback" TEXT,
    "reviewed_by" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
    "review_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE "documents" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "type" TEXT DEFAULT 'invoice' NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_data" TEXT,
    "file_url" TEXT,
    "status" TEXT DEFAULT 'draft',
    "amount" NUMERIC(10, 2),
    "customer_name" TEXT,
    "order_number" TEXT,
    "order_id" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "employee_id" TEXT,
    "employee_username" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE "settings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "key" TEXT UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_by" TEXT
);

-- GST Configuration Table
CREATE TABLE "gst_config" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE "drivers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "last_active" TIMESTAMP WITH TIME ZONE,
    "experience" INTEGER DEFAULT 0,
    "specialties" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transit Orders Table
CREATE TABLE "transit_orders" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "dispatched_at" TIMESTAMP WITH TIME ZONE,
    "received_at" TIMESTAMP WITH TIME ZONE
);

-- Transit Order Items Table
CREATE TABLE "transit_order_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "transit_order_id" TEXT REFERENCES "transit_orders"("id") ON DELETE CASCADE,
    "order_id" TEXT REFERENCES "orders"("id") ON DELETE CASCADE,
    "order_number" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "item_count" INTEGER DEFAULT 0,
    "weight" NUMERIC DEFAULT 0,
    "service_type" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transit Status History Table
CREATE TABLE "transit_status_history" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "transit_order_id" TEXT REFERENCES "transit_orders"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "updated_by" TEXT,
    "latitude" NUMERIC,
    "longitude" NUMERIC,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- PART 4: INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS "idx_orders_franchise" ON "orders"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders"("created_at");
CREATE INDEX IF NOT EXISTS "idx_orders_whatsapp_sent_at" ON "orders"("last_whatsapp_sent_at" DESC) WHERE "last_whatsapp_sent_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_customers_franchise" ON "customers"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_customers_phone" ON "customers"("phone");
CREATE INDEX IF NOT EXISTS "idx_customers_email" ON "customers"("email");

CREATE INDEX IF NOT EXISTS "idx_products_franchise" ON "products"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products"("sku");

CREATE INDEX IF NOT EXISTS "idx_employees_franchise" ON "employees"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_employees_email" ON "employees"("email");
CREATE INDEX IF NOT EXISTS "idx_employees_employee_id" ON "employees"("employee_id");
CREATE INDEX IF NOT EXISTS "idx_employees_status" ON "employees"("status");

CREATE INDEX IF NOT EXISTS "idx_attendance_franchise" ON "employee_attendance"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_employee" ON "employee_attendance"("employee_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "employee_attendance"("date");

CREATE INDEX IF NOT EXISTS "idx_tasks_franchise" ON "employee_tasks"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_employee" ON "employee_tasks"("employee_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "employee_tasks"("status");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_franchise" ON "audit_logs"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "idx_documents_franchise" ON "documents"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_documents_order" ON "documents"("order_id");
CREATE INDEX IF NOT EXISTS "idx_documents_type" ON "documents"("type");

CREATE INDEX IF NOT EXISTS "idx_barcodes_franchise" ON "barcodes"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_barcodes_code" ON "barcodes"("code");
CREATE INDEX IF NOT EXISTS "idx_barcodes_entity" ON "barcodes"("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "idx_transit_orders_status" ON "transit_orders"("status");
CREATE INDEX IF NOT EXISTS "idx_drivers_status" ON "drivers"("status");

-- =====================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) - Public Access for Development
-- =====================================================================
ALTER TABLE "franchises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posTransactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "barcodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_performance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gst_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transit_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transit_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transit_status_history" ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for development)
DROP POLICY IF EXISTS "Allow public access" ON "franchises";
CREATE POLICY "Allow public access" ON "franchises" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "users";
CREATE POLICY "Allow public access" ON "users" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "products";
CREATE POLICY "Allow public access" ON "products" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "customers";
CREATE POLICY "Allow public access" ON "customers" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "services";
CREATE POLICY "Allow public access" ON "services" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "orders";
CREATE POLICY "Allow public access" ON "orders" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "deliveries";
CREATE POLICY "Allow public access" ON "deliveries" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "order_transactions";
CREATE POLICY "Allow public access" ON "order_transactions" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "posTransactions";
CREATE POLICY "Allow public access" ON "posTransactions" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "shipments";
CREATE POLICY "Allow public access" ON "shipments" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "barcodes";
CREATE POLICY "Allow public access" ON "barcodes" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "employees";
CREATE POLICY "Allow public access" ON "employees" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "auth_employees";
CREATE POLICY "Allow public access" ON "auth_employees" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "employee_attendance";
CREATE POLICY "Allow public access" ON "employee_attendance" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "employee_tasks";
CREATE POLICY "Allow public access" ON "employee_tasks" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "employee_performance";
CREATE POLICY "Allow public access" ON "employee_performance" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "documents";
CREATE POLICY "Allow public access" ON "documents" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "audit_logs";
CREATE POLICY "Allow public access" ON "audit_logs" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "settings";
CREATE POLICY "Allow public access" ON "settings" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "gst_config";
CREATE POLICY "Allow public access" ON "gst_config" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "drivers";
CREATE POLICY "Allow public access" ON "drivers" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "transit_orders";
CREATE POLICY "Allow public access" ON "transit_orders" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "transit_order_items";
CREATE POLICY "Allow public access" ON "transit_order_items" FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access" ON "transit_status_history";
CREATE POLICY "Allow public access" ON "transit_status_history" FOR ALL USING (true);

-- =====================================================================
-- PART 6: STORAGE SETUP (for PDFs/Bills)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT TO authenticated, service_role WITH CHECK (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
CREATE POLICY "Service Role Full Access" ON storage.objects TO service_role USING (bucket_id = 'pdfs') WITH CHECK (bucket_id = 'pdfs');

COMMIT;

-- =====================================================================
-- PART 7: SEED DATA (Run separately after tables are created)
-- =====================================================================

-- Seed Franchises
INSERT INTO "franchises" ("id", "name", "franchise_id", "owner_name", "email", "phone", "address", "status") VALUES 
('franchise-pollachi', 'Fab Clean Pollachi', 'FAB-POLLACHI', 'Manager Pollachi', 'pollachi@fabzclean.com', '9363059595', '{"street": "#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram", "city": "Pollachi", "state": "Tamil Nadu", "zip": "642002"}', 'active'),
('franchise-kinathukadavu', 'Fab Clean Kinathukadavu', 'FAB-KIN', 'Manager Kinathukadavu', 'kinathukadavu@fabzclean.com', '9363719595', '{"street": "#442/11, Opp MlA Office, Krishnasamypuram", "city": "Kinathukadavu", "state": "Tamil Nadu", "zip": "642109"}', 'active')
ON CONFLICT DO NOTHING;

-- Seed Admin Employee
INSERT INTO "employees" ("id", "franchise_id", "first_name", "last_name", "role", "email", "password", "employee_id", "phone", "position", "department", "hire_date", "salary", "status") VALUES 
('admin-user-id', 'franchise-pollachi', 'System', 'Admin', 'admin', 'admin@myfabclean.com', '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', 'myfabclean', '9999999999', 'Administrator', 'Management', NOW(), 100000.00, 'active')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SETUP COMPLETE! 
-- Admin Login: employee_id = myfabclean, password = Durai@2025
-- =====================================================================
