import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';


const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials not found. SupabaseFileStorage will fail if used.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Supabase File Storage Service
 * Handles cloud file storage using Supabase Storage buckets
 */
export const SupabaseFileStorage = {
    async saveBillLogo(entityKey: string, buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
        const fileName = `bill-logo-${entityKey.replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}.webp`;
        const filePath = `logos/${fileName}`;

        let uploadBuffer = buffer;
        let contentType = mimeType;

        try {
            uploadBuffer = await sharp(buffer)
                .resize(720, 240, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .webp({ quality: 92 })
                .toBuffer();
            contentType = 'image/webp';
        } catch (e) {
            console.log('⚠️ Sharp optimization unavailable, uploading original logo image');
        }

        const { error } = await supabase.storage
            .from('branding')
            .upload(filePath, uploadBuffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error('❌ Brand logo upload failed:', error);
            if (error.statusCode === '404' || error.message?.includes('not found')) {
                console.log('📦 Attempting to create "branding" bucket...');
                try {
                    const { error: bucketError } = await supabase.storage.createBucket('branding', { public: true });
                    if (!bucketError) {
                        const { error: retryError } = await supabase.storage
                            .from('branding')
                            .upload(filePath, uploadBuffer, { contentType, upsert: true });
                        if (!retryError) {
                            return this.getPublicUrl('branding', filePath);
                        }
                        console.error('❌ Retry logo upload failed:', retryError?.message);
                    } else {
                        console.warn('⚠️ Could not auto-create branding bucket:', bucketError?.message);
                    }
                } catch (e) {
                    console.error('❌ Error creating branding bucket:', e);
                }
            }
            throw new Error(`Upload failed: ${error.message}`);
        }

        return this.getPublicUrl('branding', filePath);
    },

    /**
     * Upload a profile image to 'avatars' bucket
     */
    async saveProfileImage(userId: string | number, buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
        const fileExt = originalName.split('.').pop() || 'jpg';
        const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        // Try to optimize image using sharp, fallback to raw buffer if sharp unavailable
        let uploadBuffer = buffer;
        let contentType = mimeType;
        
        try {
            uploadBuffer = await sharp(buffer)
                .resize(400, 400, { fit: 'cover' })
                .webp({ quality: 85 })
                .toBuffer();
            contentType = 'image/webp';
        } catch (e) {
            console.log('⚠️ Sharp optimization unavailable, uploading original image');
        }

        // Upload to 'avatars' bucket
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, uploadBuffer, {
                contentType: contentType,
                upsert: true
            });


        if (error) {
            console.error('❌ Supabase upload failed:', error);
            // Bucket doesn't exist - try to create it
            if (error.statusCode === '404' || error.message?.includes('not found')) {
                console.log('📦 Attempting to create "avatars" bucket...');
                try {
                    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', { public: true });
                    if (!bucketError) {
                        console.log('✅ Avatars bucket created successfully');
                        // Retry upload after creation
                        const { data: retryData, error: retryError } = await supabase.storage
                            .from('avatars')
                            .upload(filePath, uploadBuffer, { contentType: contentType, upsert: true });
                        if (!retryError) {
                            console.log('✅ Upload successful after bucket creation');
                            return this.getPublicUrl('avatars', filePath);
                        }
                        console.error('❌ Retry upload failed:', retryError?.message);
                    } else {
                        console.warn('⚠️ Could not auto-create avatars bucket:', bucketError?.message);
                    }
                } catch (e) {
                    console.error('❌ Error creating bucket:', e);
                }
            }
            console.error('⚠️ Profile image upload failed. Please create the "avatars" bucket in Supabase Storage manually.');
            throw new Error(`Upload failed: ${error.message}`);
        }

        return this.getPublicUrl('avatars', filePath);
    },

    /**
     * Get the public URL for a file in a bucket
     */
    getPublicUrl(bucket: string, path: string): string {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    },

    /**
     * Delete a file from a bucket
     */
    async deleteFile(publicUrl: string): Promise<boolean> {
        try {
            // Extract bucket and path from URL
            // Format is usually: https://.../storage/v1/object/public/BUCKET/PATH
            const urlObj = new URL(publicUrl);
            const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
            if (pathParts.length < 2) return false;

            const fullPath = pathParts[1];
            const bucket = fullPath.split('/')[0];
            const filePath = fullPath.substring(bucket.length + 1);

            const { error } = await supabase.storage.from(bucket).remove([filePath]);
            if (error) {
                console.error(`❌ Failed to delete from Supabase: ${error.message}`);
                return false;
            }
            return true;
        } catch (err) {
            console.error('❌ Error parsing URL for deletion:', err);
            return false;
        }
    }
};
