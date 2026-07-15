-- Migration: Add status_timestamps JSONB column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_timestamps JSONB DEFAULT '{}'::jsonb;
