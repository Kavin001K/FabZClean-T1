-- Add missing fields to employees table to support the new UI requirements.
-- This script ensures all the fields used by User Management are present.

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "qualifications" TEXT,
  ADD COLUMN IF NOT EXISTS "salary_type" TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS "bank_name" TEXT,
  ADD COLUMN IF NOT EXISTS "account_number" TEXT,
  ADD COLUMN IF NOT EXISTS "ifsc_code" TEXT,
  ADD COLUMN IF NOT EXISTS "pan_number" TEXT,
  ADD COLUMN IF NOT EXISTS "aadhar_number" TEXT,
  ADD COLUMN IF NOT EXISTS "working_hours" NUMERIC(4,2) DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "blood_group" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Notify Supabase PostgREST to reload its schema cache
-- This ensures the REST API sees the new columns instantly
NOTIFY pgrst, 'reload schema';
