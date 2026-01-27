-- Migration: Add missing order columns for POS functionality
-- Description: Adds isExpress, garmentCount, and other missing columns

-- Add is_express column if not exists
ALTER TABLE orders ADD COLUMN is_express INTEGER DEFAULT 0;

-- Add garment_count column if not exists  
ALTER TABLE orders ADD COLUMN garment_count INTEGER DEFAULT 0;

-- Add rack_location column if not exists
ALTER TABLE orders ADD COLUMN rack_location TEXT;

-- Add handover_otp column if not exists
ALTER TABLE orders ADD COLUMN handover_otp TEXT;

-- Add item_verification column if not exists
ALTER TABLE orders ADD COLUMN item_verification TEXT DEFAULT 'unverified';

-- Add order_notes column if not exists
ALTER TABLE orders ADD COLUMN order_notes TEXT;

-- Add customer_instructions column if not exists
ALTER TABLE orders ADD COLUMN customer_instructions TEXT;

-- Add photo_urls column if not exists
ALTER TABLE orders ADD COLUMN photo_urls TEXT;

-- Add amount_paid column if not exists
ALTER TABLE orders ADD COLUMN amount_paid TEXT DEFAULT '0.00';

-- Add last_payment_method column if not exists
ALTER TABLE orders ADD COLUMN last_payment_method TEXT;
