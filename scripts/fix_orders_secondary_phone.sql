-- Add missing secondary_phone column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS secondary_phone text;

-- Reload PostgREST schema cache to recognize the new column
NOTIFY pgrst, 'reload schema';
