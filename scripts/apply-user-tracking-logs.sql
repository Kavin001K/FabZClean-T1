-- Supabase SQL Script: Apply User Tracking Logs & Sequences

-- 1. Create a sequence for Employees (Format: FZCEM001)
CREATE SEQUENCE IF NOT EXISTS fabz_employee_seq START 1;

-- Note: The format FZCEM + 3-digit sequence is currently handled dynamically in the application logic
-- by counting existing records and appending the formatted logic. 
-- For a strict DB-level trigger generation, you could use the sequence:
-- 
-- CREATE OR REPLACE FUNCTION generate_employee_id()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW."employeeId" := 'FZCEM' || LPAD(NEXTVAL('fabz_employee_seq')::TEXT, 3, '0');
--    RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER before_employee_insert
-- BEFORE INSERT ON employees
-- FOR EACH ROW
-- EXECUTE FUNCTION generate_employee_id();

-- 2. Create a sequence for Customers (Format: FZCMY0001)
CREATE SEQUENCE IF NOT EXISTS fabz_customer_seq START 1;

-- 3. Ensure the Audit Logs Table Exists and is optimized
-- The application code uses Drizzle to interact with this, this is the explicit PGSQL

CREATE TABLE IF NOT EXISTS "auditLogs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB DEFAULT '{}'::jsonb,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Optimize queries for the Data Table
CREATE INDEX IF NOT EXISTS "idx_auditLogs_employeeId" ON "auditLogs" ("employeeId");
CREATE INDEX IF NOT EXISTS "idx_auditLogs_action" ON "auditLogs" ("action");
CREATE INDEX IF NOT EXISTS "idx_auditLogs_createdAt" ON "auditLogs" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_auditLogs_franchiseId" ON "auditLogs" ("franchiseId");
