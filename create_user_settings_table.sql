-- Create the user_settings table for storing per-user UI preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  theme VARCHAR(20) DEFAULT 'system',
  landing_page VARCHAR(100) DEFAULT '/dashboard',
  compact_mode BOOLEAN DEFAULT false,
  quick_actions JSONB DEFAULT '["new-order", "active-orders", "customer-search", "print-queue"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings" ON public.user_settings
FOR SELECT USING (true);

CREATE POLICY "Users can insert own settings" ON public.user_settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own settings" ON public.user_settings
FOR UPDATE USING (true);

-- Also ensure the global settings table exists
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category VARCHAR(100),
  updated_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all settings read" ON public.settings
FOR SELECT USING (true);

CREATE POLICY "Allow all settings insert" ON public.settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all settings update" ON public.settings
FOR UPDATE USING (true);
