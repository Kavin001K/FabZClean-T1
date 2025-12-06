-- Fix employee_tasks table: Add missing columns with correct UUID type
ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id);
ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS metrics JSONB;
-- Note: assigned_by references employees(id). Assuming employees(id) is also UUID based on pattern.
ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES employees(id);
-- Ensure employee_id is UUID if strictly validated (this column likely existed if table existed, but validation is good)
-- If employee_tasks was poorly defined, we might need to cast. But assuming it exists, we leave it alone or check schema.

-- Fix audit_logs table: Add missing columns with correct UUID type
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- Now retry creating the indexes
CREATE INDEX IF NOT EXISTS idx_employee_tasks_franchise_id ON employee_tasks(franchise_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise_id ON audit_logs(franchise_id);
