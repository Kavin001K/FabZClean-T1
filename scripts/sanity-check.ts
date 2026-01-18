
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    console.log('Running Database Sanity Check...');

    // 1. Delete test orders
    console.log('Deleting test orders...');
    const { error: deleteError, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .ilike('customerName', '%test%');

    if (deleteError) {
        console.error('Error deleting test orders:', deleteError);
    } else {
        console.log(`Deleted ${count} test orders.`);
    }

    // 2. Run Storage Setup SQL (if possible via RPC or just logging instructions)
    // Supabase JS client doesn't support running raw SQL directly unless via RPC.
    // We will assume the user has run the storage setup or we can try to use the storage API to verify.

    console.log('Verifying Storage Bucket...');
    const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
    } else {
        const pdfsBucket = buckets.find(b => b.name === 'pdfs');
        if (pdfsBucket) {
            console.log('✅ "pdfs" bucket exists.');
            if (pdfsBucket.public) {
                console.log('✅ "pdfs" bucket is public.');
            } else {
                console.warn('⚠️ "pdfs" bucket exists but is NOT public. Please run SUPABASE_STORAGE_SETUP.sql');
            }
        } else {
            console.warn('❌ "pdfs" bucket does NOT exist. Please run SUPABASE_STORAGE_SETUP.sql');

            // Try to create it if it doesn't exist (requires admin rights usually handled by service key)
            console.log('Attempting to create "pdfs" bucket...');
            const { data, error: createError } = await supabase
                .storage
                .createBucket('pdfs', {
                    public: true
                });

            if (createError) {
                console.error('Failed to create bucket:', createError);
            } else {
                console.log('✅ Created "pdfs" bucket.');
            }
        }
    }

    console.log('Database Sanity Check Complete.');
}

runSql().catch(console.error);
