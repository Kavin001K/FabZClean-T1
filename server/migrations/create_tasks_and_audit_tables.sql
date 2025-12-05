-- Create employee_tasks table
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

-- index for performance
CREATE INDEX IF NOT EXISTS idx_employee_tasks_franchise_id ON employee_tasks(franchise_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_employee_id ON employee_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_assigned_by ON employee_tasks(assigned_by);

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    franchise_id TEXT REFERENCES franchises(id),
    employee_id TEXT REFERENCES employees(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise_id ON audit_logs(franchise_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
