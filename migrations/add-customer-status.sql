-- Migration: Add status column to customers table
-- Run this on your Supabase database

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
