-- Create the settings table for storing application configuration and user preferences
-- This table stores all application settings in a key-value format

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category VARCHAR(100),
  updated_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all settings
CREATE POLICY "Users can read settings" ON public.settings
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update settings (for their own preferences)
CREATE POLICY "Users can update settings" ON public.settings
FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Allow service role to insert/manage settings
CREATE POLICY "Admin can manage settings" ON public.settings
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
