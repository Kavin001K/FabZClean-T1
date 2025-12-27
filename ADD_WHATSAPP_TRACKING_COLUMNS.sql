-- Migration: Add WhatsApp notification tracking columns to orders table
-- Run this on your Supabase database to enable WhatsApp message tracking

-- Add WhatsApp notification tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_whatsapp_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_whatsapp_sent_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message_count INTEGER DEFAULT 0;

-- Add an index for faster querying of recent WhatsApp notifications
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_sent_at ON orders (last_whatsapp_sent_at DESC)
WHERE last_whatsapp_sent_at IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('last_whatsapp_status', 'last_whatsapp_sent_at', 'whatsapp_message_count');
