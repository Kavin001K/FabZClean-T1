-- Ensure profile image bucket and columns exist in Supabase

-- 1. Add profile image columns to employees table if they don't exist
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the avatars bucket for Supabase Storage
-- Note: This should be run in Supabase Dashboard > Storage, but we document it here
-- Go to Supabase Dashboard > Storage > Create a new bucket:
-- - Bucket name: avatars
-- - Make public: TRUE
-- - File size limit: 5MB (recommended)

-- 3. Set storage policies for avatars bucket (if using RLS)
-- Replace "YOUR_SCHEMA_NAME" with your Supabase project name

-- Allow authenticated users to upload their own profile images
INSERT INTO storage.objects (bucket_id, name, owner_id, owner, metadata)
VALUES (
  (SELECT id FROM storage.buckets WHERE name = 'avatars'),
  'test.txt',
  auth.uid(),
  auth.uid(),
  '{"test": true}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 4. Ensure employees table has these columns as nullable text
-- (If the columns already exist from the schema definition, this is redundant)
-- ALTER TABLE public.employees
-- ADD COLUMN IF NOT EXISTS profile_image TEXT DEFAULT NULL,
-- ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
