-- Drop tracking related tables
-- User requested to RESTORE transit order functionality, so we DO NOT DROP these tables.
-- DROP TABLE IF EXISTS "transit_status_history";
-- DROP TABLE IF EXISTS "transit_order_items";
-- DROP TABLE IF EXISTS "transit_orders";

-- Drop shipments if not needed (implied tracking)
-- DROP TABLE IF EXISTS "shipments"; 

-- Drop drivers if purely for live tracking.
-- DROP TABLE IF EXISTS "drivers"; 

-- Add settings column to employees table
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';
