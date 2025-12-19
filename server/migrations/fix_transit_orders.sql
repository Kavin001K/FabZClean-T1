-- =====================================================
-- FIX TRANSIT ORDERS TABLE - Add Missing Columns
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add franchise_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'franchise_id'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN franchise_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_transit_orders_franchise_id ON transit_orders(franchise_id);
        RAISE NOTICE 'Added franchise_id column to transit_orders';
    ELSE
        RAISE NOTICE 'franchise_id column already exists in transit_orders';
    END IF;
END $$;

-- Add driver_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'driver_name'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN driver_name TEXT;
        RAISE NOTICE 'Added driver_name column to transit_orders';
    ELSE
        RAISE NOTICE 'driver_name column already exists in transit_orders';
    END IF;
END $$;

-- Add total_orders column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'total_orders'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN total_orders INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_orders column to transit_orders';
    ELSE
        RAISE NOTICE 'total_orders column already exists in transit_orders';
    END IF;
END $$;

-- Add vehicle_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'vehicle_number'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN vehicle_number TEXT;
        RAISE NOTICE 'Added vehicle_number column to transit_orders';
    ELSE
        RAISE NOTICE 'vehicle_number column already exists in transit_orders';
    END IF;
END $$;

-- Add vehicle_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN vehicle_type TEXT;
        RAISE NOTICE 'Added vehicle_type column to transit_orders';
    ELSE
        RAISE NOTICE 'vehicle_type column already exists in transit_orders';
    END IF;
END $$;

-- Add driver_phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'driver_phone'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN driver_phone TEXT;
        RAISE NOTICE 'Added driver_phone column to transit_orders';
    ELSE
        RAISE NOTICE 'driver_phone column already exists in transit_orders';
    END IF;
END $$;

-- Add employee_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN employee_id TEXT;
        RAISE NOTICE 'Added employee_id column to transit_orders';
    ELSE
        RAISE NOTICE 'employee_id column already exists in transit_orders';
    END IF;
END $$;

-- Add employee_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'employee_name'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN employee_name TEXT;
        RAISE NOTICE 'Added employee_name column to transit_orders';
    ELSE
        RAISE NOTICE 'employee_name column already exists in transit_orders';
    END IF;
END $$;

-- Add origin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'origin'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN origin TEXT;
        RAISE NOTICE 'Added origin column to transit_orders';
    ELSE
        RAISE NOTICE 'origin column already exists in transit_orders';
    END IF;
END $$;

-- Add destination column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'destination'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN destination TEXT;
        RAISE NOTICE 'Added destination column to transit_orders';
    ELSE
        RAISE NOTICE 'destination column already exists in transit_orders';
    END IF;
END $$;

-- Add store_details JSONB column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'store_details'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN store_details JSONB;
        RAISE NOTICE 'Added store_details column to transit_orders';
    ELSE
        RAISE NOTICE 'store_details column already exists in transit_orders';
    END IF;
END $$;

-- Add factory_details JSONB column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transit_orders' AND column_name = 'factory_details'
    ) THEN
        ALTER TABLE transit_orders ADD COLUMN factory_details JSONB;
        RAISE NOTICE 'Added factory_details column to transit_orders';
    ELSE
        RAISE NOTICE 'factory_details column already exists in transit_orders';
    END IF;
END $$;

-- =====================================================
-- DONE! Verify the columns exist:
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transit_orders'
ORDER BY ordinal_position;
