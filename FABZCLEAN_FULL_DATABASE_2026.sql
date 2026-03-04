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

COMMIT;
-- =====================================================================
-- SETUP COMPLETE! 
-- =====================================================================
