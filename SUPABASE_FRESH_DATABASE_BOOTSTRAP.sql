-- =====================================================================
-- FABZCLEAN SUPABASE FRESH DATABASE BOOTSTRAP
-- Generated from the repo's stable schema + migration set on 2026-04-09.
--
-- Purpose:
--   One SQL file for provisioning a fresh Supabase/Postgres database for
--   the current FabZClean ERP app.
--
-- Included sources:
--   - FABZCLEAN_FULL_DATABASE_2026.sql
--   - supabase/wallet_credit_ledger_migration.sql
--   - migrations/02_wallet_credit_unification.sql
--   - migrations/03_credit_limit_normalization.sql
--   - migrations/01_rpc_schema_repair.sql
--   - migrations/04_security_hardening.sql
--   - supabase_orders_wallet_hardening.sql
--   - migrations/07_add_order_store_code.sql
--   - migrations/08_settings_driven_store_invoice_tag.sql
--   - compatibility patches for user_settings, documents.filepath,
--     customers.status, customers.customer_rating, and wallet defaults.
--
-- Intentionally excluded from this fresh-install bootstrap:
--   - bulk/live-data scripts such as database_cleanup.sql,
--     fix_order_creation_and_cleanup.sql, migrate_customer_ids.sql,
--     migrations/05_import_customers.sql, and other one-off repair packs.
--   - website/customer-auth review scripts that currently assume a
--     different order-id type than this ERP schema.
--
-- Safe expectations:
--   - This script is designed for a NEW database.
--   - The base schema section drops core tables first.
-- =====================================================================

-- Extra cleanup for post-2026 schema additions that are not covered by the
-- older monolithic base file below.
DROP VIEW IF EXISTS public.customer_wallet_balances CASCADE;
DROP TABLE IF EXISTS public.tag_templates CASCADE;
DROP TABLE IF EXISTS public.invoice_templates CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.business_profiles CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallet_settings CASCADE;

-- =====================================================================
-- FABZCLEAN FULL DATABASE SETUP (2026 VERSION)
-- Single consolidated SQL script - Compatible with Supabase & PostgreSQL
-- Generated: 2026-03-04
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
DROP TABLE IF EXISTS "credit_transactions" CASCADE;
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
DROP TABLE IF EXISTS "order_sequences" CASCADE;

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
    "is_express_order" BOOLEAN DEFAULT false,
    "priority" TEXT DEFAULT 'normal',
    "last_whatsapp_status" TEXT,
    "last_whatsapp_sent_at" TIMESTAMP WITH TIME ZONE,
    "whatsapp_message_count" INTEGER DEFAULT 0,
    "invoice_url" TEXT,
    "tags_printed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_order_number_per_franchise" UNIQUE ("franchise_id", "order_number")
);

-- Credit Transactions Table (New Addition)
CREATE TABLE "credit_transactions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
    "customer_id" TEXT REFERENCES "customers"("id") ON DELETE CASCADE NOT NULL,
    "order_id" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('credit', 'payment', 'adjustment', 'refund', 'deposit', 'usage')),
    "amount" NUMERIC(10, 2) NOT NULL,
    "balance_after" NUMERIC(10, 2) NOT NULL,
    "payment_method" TEXT,
    "reference_number" TEXT,
    "notes" TEXT,
    "reason" TEXT,
    "recorded_by" TEXT,
    "recorded_by_name" TEXT,
    "transaction_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- POS Transactions Table (Legacy/Compatible)
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
    "status" TEXT DEFAULT 'available',
    "rating" NUMERIC(3, 2) DEFAULT 5.0,
    "total_deliveries" INTEGER DEFAULT 0,
    "total_earnings" NUMERIC(10, 2) DEFAULT 0,
    "current_latitude" NUMERIC,
    "current_longitude" NUMERIC,
    "last_active" TIMESTAMP WITH TIME ZONE,
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

-- Order Sequences Table
CREATE TABLE "order_sequences" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "branch_code" TEXT NOT NULL UNIQUE,
    "year" INTEGER NOT NULL,
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "letter_suffix" CHAR(1) NOT NULL DEFAULT 'A',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- PART 4: INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS "idx_orders_franchise" ON "orders"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders"("created_at");
CREATE INDEX IF NOT EXISTS "idx_orders_express" ON "orders"("is_express_order") WHERE "is_express_order" = true;
CREATE INDEX IF NOT EXISTS "idx_orders_priority" ON "orders"("priority");

CREATE INDEX IF NOT EXISTS "idx_customers_franchise" ON "customers"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_customers_phone" ON "customers"("phone");

CREATE INDEX IF NOT EXISTS "idx_credit_transactions_customer" ON "credit_transactions"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_date" ON "credit_transactions"("transaction_date");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_franchise" ON "audit_logs"("franchise_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- =====================================================================
-- PART 5: RPC FUNCTIONS
-- =====================================================================

-- Function to generate next order number atomically
CREATE OR REPLACE FUNCTION get_next_order_number(p_branch_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_letter CHAR(1);
    v_order_number TEXT;
    v_row_exists BOOLEAN;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    SELECT EXISTS(
        SELECT 1 FROM order_sequences 
        WHERE branch_code = p_branch_code AND year = v_year
        FOR UPDATE
    ) INTO v_row_exists;
    
    IF v_row_exists THEN
        UPDATE order_sequences 
        SET current_sequence = current_sequence + 1, updated_at = NOW()
        WHERE branch_code = p_branch_code AND year = v_year
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
        
        IF v_sequence > 9999 THEN
            UPDATE order_sequences 
            SET current_sequence = 1, letter_suffix = CHR(ASCII(letter_suffix) + 1), updated_at = NOW()
            WHERE branch_code = p_branch_code AND year = v_year
            RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
        END IF;
    ELSE
        INSERT INTO order_sequences (branch_code, year, current_sequence, letter_suffix)
        VALUES (p_branch_code, v_year, 1, 'A')
        RETURNING current_sequence, letter_suffix INTO v_sequence, v_letter;
    END IF;
    
    v_order_number := 'FZC-' || v_year::TEXT || p_branch_code || LPAD(v_sequence::TEXT, 4, '0') || v_letter;
    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 6: ROW LEVEL SECURITY (RLS) - PUBLIC ACCESS
-- =====================================================================
ALTER TABLE "franchises" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "franchises" FOR ALL USING (true);
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "users" FOR ALL USING (true);
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "products" FOR ALL USING (true);
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "customers" FOR ALL USING (true);
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "services" FOR ALL USING (true);
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "orders" FOR ALL USING (true);
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "credit_transactions" FOR ALL USING (true);
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "employees" FOR ALL USING (true);
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "audit_logs" FOR ALL USING (true);
ALTER TABLE "order_sequences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "order_sequences" FOR ALL USING (true);

-- =====================================================================
-- PART 7: SEED DATA
-- =====================================================================

-- Seed Franchises
INSERT INTO "franchises" ("id", "name", "franchise_id", "owner_name", "email", "phone", "address", "status") VALUES 
('franchise-pollachi', 'Fab Clean Pollachi', 'FAB-POLLACHI', 'Manager Pollachi', 'pollachi@fabzclean.com', '9363059595', '{"street": "#16, Venkatramana Round Road, Mahalingapuram", "city": "Pollachi", "state": "Tamil Nadu", "zip": "642002"}', 'active'),
('franchise-kinathukadavu', 'Fab Clean Kinathukadavu', 'FAB-KIN', 'Manager Kinathukadavu', 'kinathukadavu@fabzclean.com', '9363719595', '{"street": "#442/11, Opp MlA Office", "city": "Kinathukadavu", "state": "Tamil Nadu", "zip": "642109"}', 'active')
ON CONFLICT DO NOTHING;

-- Seed Admin Employee (Password: Durai@2025)
INSERT INTO "employees" ("id", "franchise_id", "first_name", "last_name", "role", "email", "password", "employee_id", "phone", "position", "department", "hire_date", "salary", "status") VALUES 
('admin-user-id', 'franchise-pollachi', 'System', 'Admin', 'admin', 'admin@myfabclean.com', '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', 'myfabclean', '9999999999', 'Administrator', 'Management', NOW(), 100000.00, 'active')
ON CONFLICT DO NOTHING;

-- Seed Services (FabZClean Catalog)
INSERT INTO "services" ("name", "category", "description", "price", "duration", "status") VALUES
-- Wash Service
('Shirt (Wash + Starch)',       'Wash Service',      'WS001 | White/Color | Wash + Starch',  45.00,  '2 hours', 'Active'),
('Pant (Wash + Starch)',        'Wash Service',      'WS002 | White/Color | Wash + Starch',  50.00,  '2 hours', 'Active'),
('Dhoti (Wash + Starch)',       'Wash Service',      'WS003 | White/Color | Wash + Starch',  50.00,  '2 hours', 'Active'),
('Shirt (Wash + Iron)',         'Wash Service',      'WS004 | Wash + Iron',                  45.00,  '2 hours', 'Active'),
('Pant (Wash + Iron)',          'Wash Service',      'WS005 | Wash + Iron',                  45.00,  '2 hours', 'Active'),
('Jeans (Wash + Iron)',         'Wash Service',      'WS006 | Wash + Iron',                  45.00,  '2 hours', 'Active'),
-- Premium Clothing
('Shirt / T-Shirt (Premium)',   'Premium Clothing',  'PC001 | Premium dry clean',             90.00,  '2 hours', 'Active'),
('Dhoti (Premium)',             'Premium Clothing',  'PC002 | Premium dry clean',             90.00,  '2 hours', 'Active'),
('Silk Shirt / Silk Dhoti',     'Premium Clothing',  'PC003 | Premium silk care',            120.00,  '2 hours', 'Active'),
('Coat / Blazer',               'Premium Clothing',  'PC004 | Premium dry clean',            255.00,  '2 hours', 'Active'),
('Sherwani',                    'Premium Clothing',  'PC005 | Premium dry clean',            400.00,  '2 hours', 'Active'),
-- Regular Clothing
('Shirt / T-Shirt (Regular)',   'Regular Clothing',  'RC001 | Regular dry clean',             75.00,  '2 hours', 'Active'),
('Pant / Shorts',               'Regular Clothing',  'RC002 | Regular dry clean',             75.00,  '2 hours', 'Active'),
('Dhoti (Regular)',             'Regular Clothing',  'RC003 | Regular dry clean',             75.00,  '2 hours', 'Active'),
-- Household Items
('Bed Sheet (Single)',          'Household Items',   'HH001 | Household cleaning',            90.00,  '2 hours', 'Active'),
('Bed Sheet (Double)',          'Household Items',   'HH002 | Household cleaning',           140.00,  '2 hours', 'Active'),
('Sports Shoes / Sneakers',     'Household Items',   'HH003 | Shoe cleaning',                300.00,  '2 hours', 'Active'),
('Leather Shoe',                'Household Items',   'HH004 | Premium shoe cleaning',        400.00,  '2 hours', 'Active')
ON CONFLICT DO NOTHING;

COMMIT;
-- =====================================================================
-- SETUP COMPLETE! 
-- =====================================================================

-- =====================================================================
-- COMPATIBILITY PATCHES FOR CURRENT APP SCHEMA
-- =====================================================================
BEGIN;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS customer_rating numeric(4,2);

CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS public.user_settings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL UNIQUE,
  theme text NOT NULL DEFAULT 'system',
  landing_page text NOT NULL DEFAULT '/dashboard',
  compact_mode boolean NOT NULL DEFAULT false,
  quick_actions jsonb NOT NULL DEFAULT '["new-order", "active-orders", "customer-search", "print-queue"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_settings_read_all ON public.user_settings;
DROP POLICY IF EXISTS user_settings_insert_all ON public.user_settings;
DROP POLICY IF EXISTS user_settings_update_all ON public.user_settings;
CREATE POLICY user_settings_read_all ON public.user_settings FOR SELECT USING (true);
CREATE POLICY user_settings_insert_all ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY user_settings_update_all ON public.user_settings FOR UPDATE USING (true);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS filepath text;

UPDATE public.documents
SET filepath = COALESCE(filepath, metadata->>'filepath', file_url, filename)
WHERE filepath IS NULL;

ALTER TABLE public.documents
  ALTER COLUMN filepath SET DEFAULT '';

UPDATE public.documents
SET filepath = ''
WHERE filepath IS NULL;

ALTER TABLE public.documents
  ALTER COLUMN filepath SET NOT NULL;

ALTER TABLE public.documents
  ALTER COLUMN file_url SET DEFAULT '';

ALTER TABLE public.order_sequences
  DROP CONSTRAINT IF EXISTS order_sequences_branch_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_sequences_branch_year
  ON public.order_sequences(branch_code, year);

COMMIT;

-- =====================================================================
-- FabZClean Wallet Ledger Migration (TEXT-ID Compatible)
-- Safe for existing schemas where customers.id is TEXT/VARCHAR
-- =====================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) Customer wallet fields
-- ---------------------------------------------------------------------
alter table public.customers
  add column if not exists credit_limit numeric(10,2);

alter table public.customers
  add column if not exists wallet_balance_cache numeric(10,2);

alter table public.customers
  alter column credit_limit set default -500;

alter table public.customers
  alter column wallet_balance_cache set default 0;

update public.customers
set credit_limit = -500
where credit_limit is null;

update public.customers
set wallet_balance_cache = coalesce(wallet_balance_cache, -coalesce(credit_balance, 0), 0)
where wallet_balance_cache is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_credit_limit_non_positive_chk'
      and conrelid = 'public.customers'::regclass
  ) then
    alter table public.customers
      add constraint customers_credit_limit_non_positive_chk
      check (credit_limit <= 0);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Wallet default settings
-- ---------------------------------------------------------------------
create table if not exists public.wallet_settings (
  id smallint primary key check (id = 1),
  default_credit_limit numeric(10,2) not null check (default_credit_limit <= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.wallet_settings (id, default_credit_limit)
values (1, -500)
on conflict (id) do nothing;

create or replace function public.wallet_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wallet_settings_updated_at on public.wallet_settings;
create trigger trg_wallet_settings_updated_at
before update on public.wallet_settings
for each row execute function public.wallet_set_updated_at();

create or replace function public.customers_set_default_credit_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.credit_limit is null then
    select ws.default_credit_limit
    into new.credit_limit
    from public.wallet_settings ws
    where ws.id = 1;

    if new.credit_limit is null then
      new.credit_limit := -500;
    end if;
  end if;

  if new.wallet_balance_cache is null then
    new.wallet_balance_cache := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customers_default_credit_limit on public.customers;
create trigger trg_customers_default_credit_limit
before insert on public.customers
for each row execute function public.customers_set_default_credit_limit();

-- ---------------------------------------------------------------------
-- 3) Wallet ledger table (TEXT IDs to match current app schema)
-- ---------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id text primary key default gen_random_uuid()::text,
  entry_no bigint generated always as identity,
  franchise_id text references public.franchises(id) on delete cascade,
  customer_id text not null,
  transaction_type text not null,
  amount numeric(10,2) not null,
  balance_after numeric(10,2) not null,
  payment_method text,
  verified_by_staff text references public.employees(id) on delete set null,
  reference_type text not null,
  reference_id text,
  note text,
  created_by text references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

-- If the table already exists with UUID columns, cast to TEXT to avoid FK mismatch.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallet_transactions'
      and column_name = 'customer_id'
      and udt_name = 'uuid'
  ) then
    alter table public.wallet_transactions
      drop constraint if exists wallet_transactions_customer_id_fkey;

    alter table public.wallet_transactions
      alter column customer_id type text using customer_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallet_transactions'
      and column_name = 'reference_id'
      and udt_name = 'uuid'
  ) then
    alter table public.wallet_transactions
      alter column reference_id type text using reference_id::text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_customer_fk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_customer_fk
      foreign key (customer_id)
      references public.customers(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_transaction_type_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_transaction_type_chk
      check (transaction_type in ('CREDIT', 'DEBIT', 'ADJUSTMENT'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_reference_type_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_reference_type_chk
      check (reference_type in ('PAYMENT', 'ORDER', 'ADJUSTMENT', 'MANUAL'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_amount_non_zero_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_amount_non_zero_chk
      check (amount <> 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_payment_method_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_payment_method_chk
      check (
        payment_method is null
        or payment_method in ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE')
      );
  end if;
end $$;

create unique index if not exists idx_wallet_transactions_entry_no_unique
  on public.wallet_transactions(entry_no);

create index if not exists idx_wallet_transactions_customer_entry
  on public.wallet_transactions(customer_id, entry_no desc);

create index if not exists idx_wallet_transactions_reference
  on public.wallet_transactions(reference_type, reference_id)
  where reference_id is not null;

create index if not exists idx_wallet_transactions_created_at
  on public.wallet_transactions(created_at desc);

create unique index if not exists idx_wallet_transactions_order_reference_unique
  on public.wallet_transactions(reference_id)
  where reference_type = 'ORDER';

-- ---------------------------------------------------------------------
-- 4) Staff role helpers
-- ---------------------------------------------------------------------
create or replace function public.is_staff_employee(p_employee_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = p_employee_id
      and coalesce(e.status, 'active') = 'active'
      and e.role in ('admin', 'franchise_manager', 'employee', 'staff')
  );
$$;

create or replace function public.is_admin_employee(p_employee_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = p_employee_id
      and coalesce(e.status, 'active') = 'active'
      and e.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 5) Ledger validation + balance derivation
-- ---------------------------------------------------------------------
create or replace function public.wallet_transactions_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric(10,2);
  v_credit_limit numeric(10,2);
  v_customer_franchise_id text;
begin
  perform 1
  from public.customers c
  where c.id = new.customer_id
  for update;

  if not found then
    raise exception 'Customer % not found', new.customer_id;
  end if;

  select c.credit_limit, c.franchise_id
  into v_credit_limit, v_customer_franchise_id
  from public.customers c
  where c.id = new.customer_id;

  select wt.balance_after
  into v_current_balance
  from public.wallet_transactions wt
  where wt.customer_id = new.customer_id
  order by wt.entry_no desc
  limit 1;

  if v_current_balance is null then
    -- bootstrap from current outstanding credit if ledger is empty
    select -coalesce(c.credit_balance, 0)
    into v_current_balance
    from public.customers c
    where c.id = new.customer_id;
  end if;

  v_current_balance := coalesce(v_current_balance, 0);

  if new.franchise_id is null then
    new.franchise_id := v_customer_franchise_id;
  end if;

  if new.transaction_type = 'CREDIT' then
    if new.amount <= 0 then
      raise exception 'CREDIT amount must be > 0';
    end if;
    if new.reference_type not in ('PAYMENT', 'MANUAL', 'ADJUSTMENT') then
      raise exception 'CREDIT reference_type must be PAYMENT, MANUAL, or ADJUSTMENT';
    end if;

  elsif new.transaction_type = 'DEBIT' then
    if new.amount >= 0 then
      raise exception 'DEBIT amount must be < 0';
    end if;
    if new.reference_type not in ('ORDER', 'MANUAL') then
      raise exception 'DEBIT reference_type must be ORDER or MANUAL';
    end if;

    if v_current_balance + new.amount < v_credit_limit then
      raise exception 'Credit limit exceeded. current=%, debit=%, limit=%',
        v_current_balance, new.amount, v_credit_limit;
    end if;

  elsif new.transaction_type = 'ADJUSTMENT' then
    if new.amount = 0 then
      raise exception 'ADJUSTMENT amount cannot be 0';
    end if;
    if new.reference_type not in ('ADJUSTMENT', 'MANUAL') then
      raise exception 'ADJUSTMENT reference_type must be ADJUSTMENT or MANUAL';
    end if;

    if new.amount < 0
       and coalesce(new.note, '') not ilike 'Opening balance migration%'
       and (v_current_balance + new.amount < v_credit_limit) then
      raise exception 'Credit limit exceeded by adjustment. current=%, adjustment=%, limit=%',
        v_current_balance, new.amount, v_credit_limit;
    end if;
  else
    raise exception 'Unsupported transaction_type: %', new.transaction_type;
  end if;

  if new.verified_by_staff is not null and not public.is_staff_employee(new.verified_by_staff) then
    raise exception 'verified_by_staff must be an active staff/admin employee';
  end if;

  new.balance_after := v_current_balance + new.amount;
  return new;
end;
$$;

drop trigger if exists trg_wallet_transactions_before_insert on public.wallet_transactions;
create trigger trg_wallet_transactions_before_insert
before insert on public.wallet_transactions
for each row execute function public.wallet_transactions_before_insert();

create or replace function public.wallet_transactions_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.wallet_sync', 'on', true);

  update public.customers c
  set wallet_balance_cache = new.balance_after,
      credit_balance = case when new.balance_after < 0 then abs(new.balance_after) else 0 end,
      updated_at = now()
  where c.id = new.customer_id;

  return new;
end;
$$;

drop trigger if exists trg_wallet_transactions_after_insert on public.wallet_transactions;
create trigger trg_wallet_transactions_after_insert
after insert on public.wallet_transactions
for each row execute function public.wallet_transactions_after_insert();

create or replace function public.prevent_wallet_transaction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'wallet_transactions is immutable. Use ADJUSTMENT entries instead.';
end;
$$;

drop trigger if exists trg_wallet_transactions_block_mutation on public.wallet_transactions;
create trigger trg_wallet_transactions_block_mutation
before update or delete on public.wallet_transactions
for each row execute function public.prevent_wallet_transaction_mutation();

create or replace function public.prevent_manual_wallet_customer_updates()
returns trigger
language plpgsql
as $$
begin
  if (new.wallet_balance_cache is distinct from old.wallet_balance_cache
      or new.credit_balance is distinct from old.credit_balance)
     and coalesce(current_setting('app.wallet_sync', true), 'off') <> 'on' then
    raise exception 'Wallet/credit balances are ledger-derived and cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customers_block_manual_wallet_update on public.customers;
create trigger trg_customers_block_manual_wallet_update
before update on public.customers
for each row execute function public.prevent_manual_wallet_customer_updates();

-- ---------------------------------------------------------------------
-- 6) RPC functions for app/service use
-- ---------------------------------------------------------------------
create or replace function public.add_wallet_credit(
  p_customer_id text,
  p_amount numeric,
  p_payment_method text,
  p_verified_by_staff text,
  p_reference_id text default null,
  p_note text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit amount must be greater than 0';
  end if;

  if not public.is_staff_employee(p_verified_by_staff) then
    raise exception 'Only active staff/admin can add wallet credits';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'CREDIT',
    p_amount,
    upper(replace(coalesce(p_payment_method, ''), ' ', '_')),
    p_verified_by_staff,
    'PAYMENT',
    p_reference_id,
    p_note,
    p_verified_by_staff
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

create or replace function public.process_order_debit(
  p_customer_id text,
  p_order_amount numeric,
  p_order_id text,
  p_created_by text default null,
  p_note text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_order_amount is null or p_order_amount <= 0 then
    raise exception 'Order amount must be greater than 0';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'DEBIT',
    -p_order_amount,
    p_created_by,
    'ORDER',
    p_order_id,
    coalesce(p_note, 'Order debit'),
    p_created_by
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

create or replace function public.admin_adjust_wallet(
  p_customer_id text,
  p_amount numeric,
  p_admin_id text,
  p_reason text,
  p_reference_id text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_amount is null or p_amount = 0 then
    raise exception 'Adjustment amount cannot be 0';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Adjustment reason is required';
  end if;

  if not public.is_admin_employee(p_admin_id) then
    raise exception 'Only admin can create wallet adjustments';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'ADJUSTMENT',
    p_amount,
    p_admin_id,
    'ADJUSTMENT',
    p_reference_id,
    p_reason,
    p_admin_id
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Opening-balance migration (legacy customers -> wallet ledger)
-- ---------------------------------------------------------------------
insert into public.wallet_transactions (
  customer_id,
  franchise_id,
  transaction_type,
  amount,
  reference_type,
  note,
  created_by
)
select
  c.id,
  c.franchise_id,
  'ADJUSTMENT',
  -coalesce(c.credit_balance, 0),
  'MANUAL',
  'Opening balance migration from customers.credit_balance',
  null
from public.customers c
where coalesce(c.credit_balance, 0) <> 0
  and not exists (
    select 1
    from public.wallet_transactions wt
    where wt.customer_id = c.id
  );

-- ---------------------------------------------------------------------
-- 8) Optional RLS template (for Supabase auth projects)
-- ---------------------------------------------------------------------
alter table public.wallet_transactions enable row level security;

-- These policies assume a public.profiles table with columns: id, role.
-- Safe to execute even if profiles is absent (guarded by dynamic SQL).
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists wallet_tx_staff_read on public.wallet_transactions';
    execute 'create policy wallet_tx_staff_read on public.wallet_transactions for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in (''admin'', ''staff'')))';

    execute 'drop policy if exists wallet_tx_staff_credit_insert on public.wallet_transactions';
    execute 'create policy wallet_tx_staff_credit_insert on public.wallet_transactions for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in (''admin'', ''staff'')) and transaction_type = ''CREDIT'')';

    execute 'drop policy if exists wallet_tx_admin_adjust_insert on public.wallet_transactions';
    execute 'create policy wallet_tx_admin_adjust_insert on public.wallet_transactions for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin'') and transaction_type = ''ADJUSTMENT'')';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 9) Helpful reconciliation view
-- ---------------------------------------------------------------------
create or replace view public.customer_wallet_balances as
select
  c.id as customer_id,
  c.wallet_balance_cache as cached_wallet_balance,
  c.credit_balance as cached_credit_balance,
  coalesce(sum(wt.amount), 0)::numeric(10,2) as derived_wallet_balance,
  case
    when coalesce(sum(wt.amount), 0) < 0 then abs(coalesce(sum(wt.amount), 0))
    else 0
  end::numeric(10,2) as derived_credit_balance,
  max(wt.entry_no) as last_entry_no,
  max(wt.created_at) as last_transaction_at
from public.customers c
left join public.wallet_transactions wt on wt.customer_id = c.id
group by c.id, c.wallet_balance_cache, c.credit_balance;

commit;
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS wallet_balance_cache numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_balance numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(10, 2);

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS entry_no bigint GENERATED BY DEFAULT AS IDENTITY,
  ADD COLUMN IF NOT EXISTS franchise_id text,
  ADD COLUMN IF NOT EXISTS transaction_type text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS reference_type text,
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS created_by text;

UPDATE public.wallet_transactions
SET
  transaction_type = CASE
    WHEN transaction_type IS NOT NULL THEN transaction_type
    WHEN lower(coalesce(type, '')) = 'credit' THEN 'CREDIT'
    WHEN lower(coalesce(type, '')) = 'debit' THEN 'DEBIT'
    WHEN coalesce(amount, 0) >= 0 THEN 'CREDIT'
    ELSE 'DEBIT'
  END,
  payment_method = coalesce(payment_method, 'CASH'),
  reference_type = CASE
    WHEN reference_type IS NOT NULL THEN reference_type
    WHEN reference_order_id IS NOT NULL AND lower(coalesce(type, '')) = 'debit' THEN 'ORDER'
    WHEN reference_order_id IS NOT NULL THEN 'PAYMENT'
    ELSE 'MANUAL'
  END,
  reference_id = coalesce(reference_id, reference_order_id),
  note = coalesce(note, transaction_id),
  created_by = coalesce(created_by, verified_by_staff)
WHERE transaction_type IS NULL
   OR payment_method IS NULL
   OR reference_type IS NULL
   OR reference_id IS NULL
   OR note IS NULL
   OR created_by IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_entry_no_unique
  ON public.wallet_transactions(entry_no);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer_entry
  ON public.wallet_transactions(customer_id, entry_no DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference
  ON public.wallet_transactions(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.wallet_transactions_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_balance numeric(10, 2);
BEGIN
  IF new.customer_id IS NULL OR btrim(new.customer_id) = '' THEN
    RAISE EXCEPTION 'customer_id is required';
  END IF;

  SELECT wt.balance_after
  INTO v_previous_balance
  FROM public.wallet_transactions wt
  WHERE wt.customer_id = new.customer_id
  ORDER BY wt.entry_no DESC NULLS LAST, wt.created_at DESC, wt.id DESC
  LIMIT 1;

  v_previous_balance := coalesce(v_previous_balance, 0);

  IF new.transaction_id IS NULL OR btrim(new.transaction_id) = '' THEN
    new.transaction_id := 'TXN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);
  END IF;

  new.transaction_type := upper(coalesce(new.transaction_type, CASE WHEN coalesce(new.amount, 0) >= 0 THEN 'CREDIT' ELSE 'DEBIT' END));
  IF new.transaction_type NOT IN ('CREDIT', 'DEBIT', 'ADJUSTMENT') THEN
    RAISE EXCEPTION 'Unsupported transaction_type: %', new.transaction_type;
  END IF;

  new.reference_type := upper(coalesce(new.reference_type, 'MANUAL'));
  IF new.reference_type NOT IN ('PAYMENT', 'ORDER', 'ADJUSTMENT', 'MANUAL') THEN
    RAISE EXCEPTION 'Unsupported reference_type: %', new.reference_type;
  END IF;

  new.payment_method := CASE
    WHEN new.payment_method IS NULL OR btrim(new.payment_method) = '' THEN NULL
    ELSE upper(replace(new.payment_method, ' ', '_'))
  END;

  IF new.payment_method IS NOT NULL
     AND new.payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
    new.payment_method := 'OTHER';
  END IF;

  IF new.amount IS NULL OR new.amount = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero';
  END IF;

  new.balance_before := coalesce(new.balance_before, v_previous_balance);
  new.balance_after := coalesce(new.balance_after, v_previous_balance + new.amount);
  new.type := coalesce(new.type, lower(CASE WHEN new.transaction_type = 'DEBIT' THEN 'debit' ELSE 'credit' END));
  new.reference_order_id := coalesce(new.reference_order_id, CASE WHEN new.reference_type = 'ORDER' THEN new.reference_id END);
  new.created_at := coalesce(new.created_at, now());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transactions_before_insert ON public.wallet_transactions;
CREATE TRIGGER trg_wallet_transactions_before_insert
BEFORE INSERT ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.wallet_transactions_before_insert();

CREATE OR REPLACE FUNCTION public.wallet_transactions_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.wallet_sync', 'on', true);

  UPDATE public.customers c
  SET wallet_balance_cache = new.balance_after,
      credit_balance = CASE WHEN new.balance_after < 0 THEN abs(new.balance_after) ELSE 0 END,
      updated_at = now()
  WHERE c.id = new.customer_id;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transactions_after_insert ON public.wallet_transactions;
CREATE TRIGGER trg_wallet_transactions_after_insert
AFTER INSERT ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.wallet_transactions_after_insert();

CREATE OR REPLACE FUNCTION public.prevent_wallet_transaction_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'wallet_transactions is immutable. Use new ledger entries instead.';
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transactions_block_mutation ON public.wallet_transactions;
CREATE TRIGGER trg_wallet_transactions_block_mutation
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_wallet_transaction_mutation();

CREATE OR REPLACE FUNCTION public.prevent_manual_wallet_customer_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (new.wallet_balance_cache IS DISTINCT FROM old.wallet_balance_cache
      OR new.credit_balance IS DISTINCT FROM old.credit_balance)
     AND coalesce(current_setting('app.wallet_sync', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'Wallet/credit balances are ledger-derived and cannot be updated directly';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_block_manual_wallet_update ON public.customers;
CREATE TRIGGER trg_customers_block_manual_wallet_update
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.prevent_manual_wallet_customer_updates();

WITH latest_balances AS (
  SELECT DISTINCT ON (wt.customer_id)
    wt.customer_id,
    wt.balance_after
  FROM public.wallet_transactions wt
  ORDER BY wt.customer_id, wt.entry_no DESC NULLS LAST, wt.created_at DESC, wt.id DESC
)
UPDATE public.customers c
SET wallet_balance_cache = coalesce(lb.balance_after, 0),
    credit_balance = CASE WHEN coalesce(lb.balance_after, 0) < 0 THEN abs(lb.balance_after) ELSE 0 END,
    updated_at = now()
FROM latest_balances lb
WHERE c.id = lb.customer_id;

UPDATE public.customers
SET wallet_balance_cache = coalesce(wallet_balance_cache, 0),
    credit_balance = coalesce(credit_balance, 0)
WHERE wallet_balance_cache IS NULL
   OR credit_balance IS NULL;

COMMIT;
BEGIN;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS credit_limit numeric(10, 2);

UPDATE public.customers
SET credit_limit = 1000
WHERE credit_limit IS DISTINCT FROM 1000;

ALTER TABLE public.customers
  ALTER COLUMN credit_limit SET DEFAULT 1000;

ALTER TABLE public.customers
  ALTER COLUMN credit_limit SET NOT NULL;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_credit_limit_non_positive_chk;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_credit_limit_positive_chk;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_credit_limit_positive_chk
  CHECK (credit_limit >= 0);

COMMIT;

-- =====================================================================
-- POSITIVE CREDIT-LIMIT DEFAULTS (keeps fresh installs on current model)
-- =====================================================================
BEGIN;

ALTER TABLE IF EXISTS public.wallet_settings
  DROP CONSTRAINT IF EXISTS wallet_settings_default_credit_limit_check;

ALTER TABLE IF EXISTS public.wallet_settings
  ALTER COLUMN default_credit_limit SET DEFAULT 1000;

UPDATE public.wallet_settings
SET default_credit_limit = 1000
WHERE default_credit_limit IS DISTINCT FROM 1000;

ALTER TABLE IF EXISTS public.wallet_settings
  ADD CONSTRAINT wallet_settings_default_credit_limit_check
  CHECK (default_credit_limit >= 0);

CREATE OR REPLACE FUNCTION public.customers_set_default_credit_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.credit_limit IS NULL THEN
    SELECT ws.default_credit_limit
      INTO new.credit_limit
      FROM public.wallet_settings ws
     WHERE ws.id = 1;

    IF new.credit_limit IS NULL THEN
      new.credit_limit := 1000;
    END IF;
  END IF;

  IF new.wallet_balance_cache IS NULL THEN
    new.wallet_balance_cache := 0;
  END IF;

  RETURN new;
END;
$$;

COMMIT;

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.order_sequences (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_code text NOT NULL,
  year integer NOT NULL,
  current_sequence integer NOT NULL DEFAULT 0,
  letter_suffix char(1) NOT NULL DEFAULT 'A',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_sequences_branch_year
  ON public.order_sequences(branch_code, year);

CREATE OR REPLACE FUNCTION public.get_next_order_number(p_branch_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_sequence integer;
  v_letter char(1);
BEGIN
  INSERT INTO public.order_sequences (branch_code, year, current_sequence, letter_suffix)
  VALUES (p_branch_code, v_year, 1, 'A')
  ON CONFLICT (branch_code, year)
  DO UPDATE
    SET current_sequence = public.order_sequences.current_sequence + 1,
        updated_at = now()
  RETURNING current_sequence, letter_suffix
  INTO v_sequence, v_letter;

  IF v_sequence > 9999 THEN
    UPDATE public.order_sequences
    SET current_sequence = 1,
        letter_suffix = chr(ascii(letter_suffix) + 1),
        updated_at = now()
    WHERE branch_code = p_branch_code
      AND year = v_year
    RETURNING current_sequence, letter_suffix
    INTO v_sequence, v_letter;
  END IF;

  RETURN 'FZC-' || v_year::text || p_branch_code || lpad(v_sequence::text, 4, '0') || v_letter;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_wallet_recharge(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_payment_method text,
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS numeric(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_after numeric(10, 2);
  v_tx_code text;
  v_payment_method text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  PERFORM 1
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  v_payment_method := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
  IF v_payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
    v_payment_method := 'CASH';
  END IF;

  v_tx_code := 'WLT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  VALUES (
    p_customer_id,
    'CREDIT',
    p_amount,
    v_payment_method,
    p_recorded_by,
    'PAYMENT',
    NULL,
    '[' || v_tx_code || '] Wallet recharge | by=' || coalesce(p_recorded_by_name, 'system'),
    p_recorded_by
  )
  RETURNING balance_after INTO v_balance_after;

  RETURN coalesce(v_balance_after, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_checkout_v2(
  p_order_id text,
  p_customer_id text,
  p_cash_amount numeric(10, 2) DEFAULT 0,
  p_use_wallet boolean DEFAULT true,
  p_wallet_debit_requested numeric(10, 2) DEFAULT NULL,
  p_payment_method text DEFAULT 'CASH',
  p_recorded_by text DEFAULT NULL,
  p_recorded_by_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_order_id text;
  v_order_total numeric(10, 2);
  v_advance_paid numeric(10, 2);
  v_order_payment_status text;
  v_order_customer_id text;
  v_remaining_amount numeric(10, 2);
  v_wallet_balance_before numeric(10, 2);
  v_wallet_balance_after numeric(10, 2);
  v_credit_balance_after numeric(10, 2);
  v_wallet_debited numeric(10, 2) := 0;
  v_cash_applied numeric(10, 2) := 0;
  v_credit_assigned numeric(10, 2) := 0;
  v_new_advance_paid numeric(10, 2) := 0;
  v_new_payment_status text;
  v_wallet_tx_code text := NULL;
  v_credit_tx_code text := NULL;
  v_payment_method_normalized text := NULL;
  v_request_key text;
BEGIN
  SELECT
    id,
    total_amount,
    coalesce(advance_paid, 0),
    coalesce(payment_status, 'pending'),
    customer_id
  INTO
    v_existing_order_id,
    v_order_total,
    v_advance_paid,
    v_order_payment_status,
    v_order_customer_id
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_existing_order_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF p_customer_id IS NULL OR btrim(p_customer_id) = '' THEN
    p_customer_id := v_order_customer_id;
  END IF;

  IF p_customer_id IS NULL OR btrim(p_customer_id) = '' THEN
    RAISE EXCEPTION 'Customer ID is required for checkout';
  END IF;

  IF v_order_customer_id IS NOT NULL AND v_order_customer_id <> p_customer_id THEN
    RAISE EXCEPTION 'Order customer mismatch';
  END IF;

  SELECT coalesce(wallet_balance_cache, 0)
  INTO v_wallet_balance_before
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  v_remaining_amount := greatest(v_order_total - v_advance_paid, 0);

  IF v_remaining_amount <= 0 THEN
    RETURN json_build_object(
      'success', true,
      'payment_status', 'paid',
      'split', json_build_object(
        'cashApplied', 0,
        'walletDebited', 0,
        'creditAssigned', 0
      ),
      'transaction_ids', json_build_object(
        'wallet_transaction_id', NULL,
        'credit_transaction_id', NULL
      ),
      'credit_id', p_customer_id,
      'idempotent', true
    );
  END IF;

  v_request_key := md5(
    concat_ws(
      '|',
      p_order_id,
      coalesce(p_cash_amount, 0)::text,
      coalesce(p_use_wallet, false)::text,
      coalesce(p_wallet_debit_requested, -1)::text,
      coalesce(p_payment_method, '')
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.wallet_transactions wt
    WHERE wt.reference_id = p_order_id
      AND coalesce(wt.note, '') ILIKE '%' || v_request_key || '%'
      AND wt.created_at > (now() - interval '30 seconds')
  ) THEN
    v_credit_assigned := greatest(v_order_total - v_advance_paid, 0);
    RETURN json_build_object(
      'success', true,
      'payment_status', CASE WHEN v_credit_assigned > 0 THEN 'credit' ELSE 'paid' END,
      'split', json_build_object(
        'cashApplied', 0,
        'walletDebited', 0,
        'creditAssigned', v_credit_assigned
      ),
      'transaction_ids', json_build_object(
        'wallet_transaction_id', NULL,
        'credit_transaction_id', NULL
      ),
      'credit_id', p_customer_id,
      'idempotent', true
    );
  END IF;

  IF coalesce(p_use_wallet, false) THEN
    IF coalesce(p_wallet_debit_requested, 0) > 0 THEN
      v_wallet_debited := least(
        v_remaining_amount,
        greatest(v_wallet_balance_before, 0),
        p_wallet_debit_requested
      );
    ELSE
      v_wallet_debited := least(
        v_remaining_amount,
        greatest(v_wallet_balance_before, 0)
      );
    END IF;
  END IF;

  v_cash_applied := least(
    greatest(v_remaining_amount - v_wallet_debited, 0),
    greatest(coalesce(p_cash_amount, 0), 0)
  );

  IF v_order_payment_status <> 'credit' THEN
    v_credit_tx_code := 'CRD-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);
    INSERT INTO public.wallet_transactions (
      customer_id,
      transaction_type,
      amount,
      verified_by_staff,
      reference_type,
      reference_id,
      note,
      created_by
    )
    VALUES (
      p_customer_id,
      'DEBIT',
      -v_remaining_amount,
      p_recorded_by,
      'ORDER',
      p_order_id,
      '[' || v_credit_tx_code || '] Auto order debit | req=' || v_request_key || ' | by=' || coalesce(p_recorded_by_name, 'system'),
      p_recorded_by
    );
  END IF;

  IF v_cash_applied > 0 THEN
    v_payment_method_normalized := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
    IF v_payment_method_normalized NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
      v_payment_method_normalized := 'CASH';
    END IF;

    v_wallet_tx_code := 'WLT-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

    INSERT INTO public.wallet_transactions (
      customer_id,
      transaction_type,
      amount,
      payment_method,
      verified_by_staff,
      reference_type,
      reference_id,
      note,
      created_by
    )
    VALUES (
      p_customer_id,
      'CREDIT',
      v_cash_applied,
      v_payment_method_normalized,
      p_recorded_by,
      'PAYMENT',
      p_order_id,
      '[' || v_wallet_tx_code || '] Order payment received | req=' || v_request_key || ' | by=' || coalesce(p_recorded_by_name, 'system'),
      p_recorded_by
    );
  END IF;

  SELECT
    coalesce(wallet_balance_cache, 0),
    coalesce(credit_balance, 0)
  INTO
    v_wallet_balance_after,
    v_credit_balance_after
  FROM public.customers
  WHERE id = p_customer_id;

  v_new_advance_paid := least(v_order_total, v_advance_paid + v_wallet_debited + v_cash_applied);
  v_credit_assigned := greatest(v_order_total - v_new_advance_paid, 0);
  v_new_payment_status := CASE WHEN v_credit_assigned > 0 THEN 'credit' ELSE 'paid' END;

  UPDATE public.orders
  SET
    customer_id = coalesce(customer_id, p_customer_id),
    advance_paid = v_new_advance_paid,
    wallet_used = least(v_order_total, coalesce(wallet_used, 0) + v_wallet_debited),
    credit_used = v_credit_assigned,
    payment_status = v_new_payment_status,
    payment_method = CASE
      WHEN v_wallet_debited > 0 AND v_cash_applied > 0 THEN 'SPLIT'
      WHEN v_wallet_debited > 0 THEN 'CREDIT_WALLET'
      WHEN v_cash_applied > 0 THEN coalesce(v_payment_method_normalized, 'CASH')
      ELSE payment_method
    END,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'payment_status', v_new_payment_status,
    'split', json_build_object(
      'cashApplied', v_cash_applied,
      'walletDebited', v_wallet_debited,
      'creditAssigned', v_credit_assigned
    ),
    'wallet_used', v_wallet_debited,
    'credit_used', v_credit_assigned,
    'transaction_ids', json_build_object(
      'wallet_transaction_id', v_wallet_tx_code,
      'credit_transaction_id', v_credit_tx_code
    ),
    'credit_id', p_customer_id,
    'idempotent', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_checkout(
  p_order_id text,
  p_customer_id text,
  p_cash_amount numeric(10, 2),
  p_wallet_amount numeric(10, 2),
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.process_payment_checkout_v2(
    p_order_id,
    p_customer_id,
    p_cash_amount,
    coalesce(p_wallet_amount, 0) > 0,
    p_wallet_amount,
    'CASH',
    p_recorded_by,
    p_recorded_by_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_credit_repayment(
  p_customer_id text,
  p_amount numeric(10, 2),
  p_payment_method text,
  p_recorded_by text,
  p_recorded_by_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_after numeric(10, 2);
  v_tx_code text;
  v_payment_method text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Repayment amount must be strictly positive';
  END IF;

  PERFORM 1
  FROM public.customers
  WHERE id = p_customer_id
    AND coalesce(credit_balance, 0) > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found for customer';
  END IF;

  v_payment_method := upper(replace(coalesce(p_payment_method, 'CASH'), ' ', '_'));
  IF v_payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER') THEN
    v_payment_method := 'CASH';
  END IF;

  v_tx_code := 'PAY-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substring(md5(random()::text), 1, 6);

  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  VALUES (
    p_customer_id,
    'CREDIT',
    p_amount,
    v_payment_method,
    p_recorded_by,
    'PAYMENT',
    NULL,
    '[' || v_tx_code || '] Credit repayment | by=' || coalesce(p_recorded_by_name, 'system'),
    p_recorded_by
  )
  RETURNING balance_after INTO v_balance_after;

  RETURN json_build_object(
    'success', true,
    'balance_after', CASE WHEN coalesce(v_balance_after, 0) < 0 THEN abs(v_balance_after) ELSE 0 END
  );
END;
$$;

COMMIT;
BEGIN;

ALTER FUNCTION public.get_next_order_number(text) SET search_path = public;
ALTER FUNCTION public.process_wallet_recharge(text, numeric, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_payment_checkout_v2(text, text, numeric, boolean, numeric, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_payment_checkout(text, text, numeric, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.process_credit_repayment(text, numeric, text, text, text) SET search_path = public;

DO $$
DECLARE
  t_name text;
  target_tables text[] := ARRAY[
    'customers',
    'employees',
    'franchises',
    'order_sequences',
    'orders',
    'products',
    'services',
    'wallet_transactions'
  ];
BEGIN
  FOREACH t_name IN ARRAY target_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public access" ON public.%I', t_name);
    EXECUTE format('DROP POLICY IF EXISTS public_read ON public.%I', t_name);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I', t_name);
    EXECUTE format(
      'CREATE POLICY public_read ON public.%I FOR SELECT USING (auth.role() IN (''anon'', ''authenticated'', ''service_role''))',
      t_name
    );
    EXECUTE format(
      'CREATE POLICY service_role_all ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      t_name
    );
  END LOOP;
END
$$;

COMMIT;
-- Supabase performance + reliability tuning for orders / ledger workloads
-- Safe to run multiple times.

BEGIN;

-- ---------------------------------------------------------------------------
-- ORDERS: common filters/sorts for status boards and order lookup
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at_desc
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at_desc
  ON public.orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at_desc
  ON public.orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders (order_number);

-- ---------------------------------------------------------------------------
-- DOCUMENTS: invoice lookup by order number / filename
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_order_number_created_at_desc
  ON public.documents (order_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_filename
  ON public.documents (filename);

CREATE INDEX IF NOT EXISTS idx_documents_type_status_created_at_desc
  ON public.documents (type, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- WALLET LEDGER: supports customer history and fast recent-entry lookup
-- Handles both old/new wallet_transactions schemas.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'entry_no'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer_entry_no_desc ON public.wallet_transactions (customer_id, entry_no DESC)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer_created_at_desc ON public.wallet_transactions (customer_id, created_at DESC)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'reference_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference_id ON public.wallet_transactions (reference_id)';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Data integrity guardrails
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_valid_chk'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_valid_chk
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'partial', 'credit'));
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Cache sync helper: rebuild customers.credit_balance / wallet_balance_cache
-- from latest wallet ledger entries.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_customer_wallet_cache(p_customer_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH latest AS (
    SELECT DISTINCT ON (wt.customer_id)
      wt.customer_id,
      COALESCE(wt.balance_after::numeric, 0) AS wallet_balance_after
    FROM public.wallet_transactions wt
    WHERE p_customer_id IS NULL OR wt.customer_id::text = p_customer_id
    ORDER BY wt.customer_id, wt.created_at DESC
  )
  UPDATE public.customers c
  SET
    wallet_balance_cache = COALESCE(l.wallet_balance_after, 0),
    credit_balance = CASE
      WHEN COALESCE(l.wallet_balance_after, 0) < 0 THEN ABS(l.wallet_balance_after)
      ELSE 0
    END,
    updated_at = NOW()
  FROM latest l
  WHERE c.id = l.customer_id;
END;
$$;

COMMIT;

-- Optional one-time backfill after deploying:
-- SELECT public.recompute_customer_wallet_cache(NULL);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS store_code TEXT;

ALTER TABLE orders
ALTER COLUMN store_code SET DEFAULT 'POL';

UPDATE orders
SET store_code = CASE
  WHEN store_code IS NOT NULL AND btrim(store_code) <> '' THEN upper(store_code)
  WHEN franchise_id ILIKE '%pollachi%' OR franchise_id ILIKE '%pol%' THEN 'POL'
  WHEN franchise_id ILIKE '%kinathukadavu%' OR franchise_id ILIKE '%kin%' THEN 'KIN'
  WHEN franchise_id ILIKE '%mcet%' THEN 'MCET'
  WHEN franchise_id ILIKE '%udm%' OR franchise_id ILIKE '%udumalpet%' THEN 'UDM'
  ELSE 'POL'
END
WHERE store_code IS NULL OR btrim(store_code) = '';

CREATE INDEX IF NOT EXISTS idx_orders_store_code ON orders(store_code);
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique default 'global',
  company_name text not null,
  legal_name text,
  company_address jsonb not null default '{}'::jsonb,
  contact_details jsonb not null default '{}'::jsonb,
  tax_details jsonb not null default '{}'::jsonb,
  payment_details jsonb not null default '{}'::jsonb,
  invoice_defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  address jsonb not null default '{}'::jsonb,
  contact_details jsonb not null default '{}'::jsonb,
  legal_details jsonb not null default '{}'::jsonb,
  invoice_overrides jsonb not null default '{}'::jsonb,
  tag_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_code_chk check (code ~ '^[A-Z0-9_]{2,10}$')
);

create unique index if not exists idx_stores_single_default
on public.stores (is_default) where is_default = true;

create table if not exists public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  preset_key text not null,
  store_id uuid references public.stores(id) on delete cascade,
  is_ai_optimized boolean not null default false,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_invoice_templates_global_default
on public.invoice_templates (is_default)
where is_default = true and store_id is null;

create unique index if not exists idx_invoice_templates_store_default
on public.invoice_templates (store_id)
where is_default = true and store_id is not null;

create table if not exists public.tag_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  layout_key text not null default 'thermal_compact',
  store_id uuid references public.stores(id) on delete cascade,
  is_ai_optimized boolean not null default false,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tag_templates_global_default
on public.tag_templates (is_default)
where is_default = true and store_id is null;

create unique index if not exists idx_tag_templates_store_default
on public.tag_templates (store_id)
where is_default = true and store_id is not null;

alter table public.orders
  add column if not exists store_id uuid references public.stores(id) on delete set null,
  add column if not exists invoice_template_id uuid references public.invoice_templates(id) on delete set null,
  add column if not exists tag_template_id uuid references public.tag_templates(id) on delete set null,
  add column if not exists applied_template_id uuid references public.invoice_templates(id) on delete set null,
  add column if not exists whatsapp_bill_status text not null default 'pending';

alter table public.orders
  drop constraint if exists orders_whatsapp_bill_status_chk;

alter table public.orders
  add constraint orders_whatsapp_bill_status_chk
  check (whatsapp_bill_status in ('pending', 'sent', 'failed'));

create index if not exists idx_orders_whatsapp_bill_status
on public.orders (whatsapp_bill_status);

create index if not exists idx_orders_applied_template_id
on public.orders (applied_template_id);

alter table public.documents
  add column if not exists store_id uuid references public.stores(id) on delete set null,
  add column if not exists template_key text;

create index if not exists idx_orders_store_id_created_at
on public.orders (store_id, created_at desc);

create index if not exists idx_documents_store_id_created_at
on public.documents (store_id, created_at desc);

drop trigger if exists trg_business_profiles_updated_at on public.business_profiles;
create trigger trg_business_profiles_updated_at before update on public.business_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoice_templates_updated_at on public.invoice_templates;
create trigger trg_invoice_templates_updated_at before update on public.invoice_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_tag_templates_updated_at on public.tag_templates;
create trigger trg_tag_templates_updated_at before update on public.tag_templates
for each row execute function public.set_updated_at();

insert into public.business_profiles
  (scope_key, company_name, legal_name, company_address, contact_details, tax_details, payment_details, invoice_defaults)
values
  ('global', 'FabZClean', 'FabZClean', '{"line1":"#16, Venkatramana Round Road, Mahalingapuram","city":"Pollachi","state":"Tamil Nadu","pincode":"642002","country":"India"}',
   '{"phone":"+91 93630 59595","email":"support@myfabclean.com","website":"https://erp.myfabclean.com"}',
   '{"gstin":"33AITPD3522F1ZK","pan":"AITPD3522F","currency":"INR"}',
   '{"upiId":"9886788858@pz","upiName":"Fab Clean"}',
   '{"defaultDueDays":2,"showPaymentQr":true,"showGstBreakup":true,"showPaymentBreakdown":true,"footerNote":"Thank you for choosing Fab Clean."}')
on conflict (scope_key) do nothing;

insert into public.stores (code, name, short_name, is_default, sort_order, address, contact_details, legal_details)
values
  ('POL', 'Pollachi', 'Pollachi', true, 1, '{"line1":"#16, Venkatramana Round Road, Mahalingapuram","city":"Pollachi","state":"Tamil Nadu","pincode":"642002","country":"India"}', '{"phone":"+91 93630 59595","email":"pollachi@myfabclean.com"}', '{"gstin":"33AITPD3522F1ZK"}'),
  ('KIN', 'Kinathukadavu', 'KIN', false, 2, '{"line1":"#442/11, Opp MLA Office, Krishnasamypuram","city":"Kinathukadavu","state":"Tamil Nadu","pincode":"642109","country":"India"}', '{"phone":"+91 93637 19595","email":"kinathukadavu@myfabclean.com"}', '{"gstin":"33AITPD3522F1ZK"}'),
  ('MCET', 'MCET', 'MCET', false, 3, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
  ('UDM', 'Udumalpet', 'UDM', false, 4, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
on conflict (code) do nothing;

insert into public.invoice_templates (template_key, name, description, preset_key, is_default, sort_order, config)
values
  ('classic-default', 'Classic Invoice', 'Balanced branded invoice', 'classic', true, 1, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true}'),
  ('modern-default', 'Modern Invoice', 'Cleaner modern layout', 'modern', false, 2, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":false,"showTerms":true,"showPaymentQr":true}'),
  ('compact-default', 'Compact Invoice', 'Dense low-ink layout', 'compact', false, 3, '{"showLogo":false,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":false,"showTerms":false,"showPaymentQr":true}'),
  ('express-default', 'Express Bill', 'Priority bill layout for fast-turnaround orders', 'express', false, 4, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true,"showDeliveryBlock":true}'),
  ('edited-default', 'Edited Order Bill', 'Revision bill layout for regenerated invoices', 'edited', false, 5, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true,"showPaymentBreakdown":true}')
on conflict (template_key) do nothing;

insert into public.tag_templates (template_key, name, description, layout_key, is_default, sort_order, config)
values
  ('thermal-default', 'Thermal Default', 'Default garment tag', 'thermal_compact', true, 1, '{"showStoreCode":true,"showCustomerName":true,"showOrderNumber":true,"showServiceName":true,"showDueDate":true,"showQuantity":true,"showTagNote":true,"maxNoteChars":32}')
on conflict (template_key) do nothing;

update public.orders o
set store_id = s.id
from public.stores s
where o.store_id is null
  and upper(coalesce(nullif(trim(o.store_code), ''), 'POL')) = s.code;

-- =====================================================================
-- BILLING MODE DEFAULTS FOR SETTINGS-DRIVEN INVOICES
-- =====================================================================
BEGIN;

UPDATE public.business_profiles
SET invoice_defaults = coalesce(invoice_defaults, '{}'::jsonb) || jsonb_build_object('useTemplateBasedInvoices', false)
WHERE scope_key = 'global'
  AND NOT (coalesce(invoice_defaults, '{}'::jsonb) ? 'useTemplateBasedInvoices');

COMMIT;
