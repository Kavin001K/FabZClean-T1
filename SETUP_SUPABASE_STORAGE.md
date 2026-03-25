# Supabase Storage Setup for Profile Images

The app requires an **avatars** bucket in Supabase Storage to upload profile images.

## Option 1: Create Bucket via Supabase Dashboard (Recommended for Testing)

1. Go to your **Supabase Project Dashboard**
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Fill in:
   - **Bucket name:** `avatars`
   - **Make it public:** Toggle **ON** ✓
   - **File size limit:** 5 MB (recommended)
5. Click **Create bucket**

Done! Profile uploads will now work.

---

## Option 2: Create via SQL (For Automation)

Run this SQL in Supabase **SQL Editor**:

```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set public read access for all files
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars')
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "User upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
)
ON CONFLICT DO NOTHING;

-- Allow users to delete their own files
CREATE POLICY "User delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
)
ON CONFLICT DO NOTHING;
```

---

## Verify Installation

After creating the bucket:

1. Refresh the FabzClean app in your browser
2. Go to **Profile > Account Settings**
3. Click the camera icon on your avatar
4. Upload an image — it should now work! ✅

If it still doesn't work, check the browser console for errors or contact support.
