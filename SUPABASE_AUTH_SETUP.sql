-- Create auth_employees table
CREATE TABLE IF NOT EXISTS public.auth_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'franchise_manager', 'factory_manager')),
    franchise_id TEXT,
    factory_id TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.auth_employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    employee_username TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO public.auth_employees (
    employee_id, 
    username, 
    password_hash, 
    role, 
    full_name, 
    is_active
) VALUES (
    'EMP-ADMIN-001',
    'admin',
    '$2b$10$SjdH3l5yG.cjnRyWv.SXKO7FBe3qGmv3sREQMUIjuFzZ45wSH6tpu',
    'admin',
    'System Administrator',
    true
) ON CONFLICT (username) DO NOTHING;
