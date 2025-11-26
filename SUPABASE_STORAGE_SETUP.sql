-- Create 'pdfs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Allow public access to 'pdfs' bucket (so WhatsApp can download bills)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pdfs' );

-- Allow authenticated users (and service role) to upload PDFs
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK ( bucket_id = 'pdfs' );

-- Allow service role to update/delete (optional, for cleanup)
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
CREATE POLICY "Service Role Full Access"
ON storage.objects
TO service_role
USING ( bucket_id = 'pdfs' )
WITH CHECK ( bucket_id = 'pdfs' );
