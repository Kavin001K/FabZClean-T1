-- Migration: Add user_settings and avatar_url
-- Date: 2026-03-19

-- Add avatar_url to employees
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "landing_page" TEXT NOT NULL DEFAULT '/dashboard',
    "compact_mode" BOOLEAN NOT NULL DEFAULT false,
    "quick_actions" JSONB NOT NULL DEFAULT '["new-order", "active-orders", "customer-search", "print-queue"]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure theme enum if needed (Postgres text with check is safer for migrations)
-- ALTER TABLE "user_settings" ADD CONSTRAINT "check_theme" CHECK ("theme" IN ('light', 'dark', 'system'));
