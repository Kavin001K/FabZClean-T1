-- ================================================
-- Check if drivers table exists and create if needed
-- ================================================

-- First, check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'drivers'
);

-- If it doesn't exist, let's create it with the correct schema
-- (Run this only if the above query returns false)

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  "licenseNumber" TEXT NOT NULL,
  "vehicleNumber" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "vehicleModel" TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  rating DECIMAL DEFAULT 5.0,
  "totalDeliveries" INTEGER DEFAULT 0,
  "totalEarnings" DECIMAL DEFAULT 0,
  "currentLatitude" DECIMAL,
  "currentLongitude" DECIMAL,
  "lastActive" TIMESTAMPTZ,
  experience INTEGER DEFAULT 0,
  specialties TEXT[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for development
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
