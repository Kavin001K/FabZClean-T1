
-- Add HR fields to auth_employees table
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS hire_date TIMESTAMPTZ;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS salary_type TEXT CHECK (salary_type IN ('hourly', 'monthly'));
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS base_salary NUMERIC;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS working_hours INTEGER DEFAULT 8;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE auth_employees ADD COLUMN IF NOT EXISTS address TEXT;
