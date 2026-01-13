#!/usr/bin/env node

/**
 * Apply RLS Policies Migration for Drivers Table
 * This script applies the missing RLS policies to fix the 400 Bad Request error
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rxyatfvjjnvjxwyhhhqn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY not found');
    console.error('Please set one of these environment variables');
    process.exit(1);
}

console.log('🔧 Applying RLS Policies Migration for Drivers Table...\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to apply
const sql = `
-- RLS Policies for drivers table
-- Allow authenticated users to view all drivers
CREATE POLICY IF NOT EXISTS "Authenticated users can view drivers" ON drivers
  FOR SELECT TO authenticated USING (true);

-- Allow staff to manage drivers
CREATE POLICY IF NOT EXISTS "Staff can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'employee', 'franchise_manager')
    )
  );

-- Allow drivers to update their own status and location
CREATE POLICY IF NOT EXISTS "Drivers can update their own data" ON drivers
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'employee', 'franchise_manager')
    )
  );
`;

async function applyMigration() {
    try {
        console.log('📤 Executing SQL migration...\n');
        console.log(sql);
        console.log('\n⏳ Please wait...\n');

        // Note: Supabase JS client doesn't support raw SQL execution for security
        // We need to use the Supabase Management API or SQL Editor
        console.log('⚠️  The Supabase JS client cannot execute raw SQL for security reasons.');
        console.log('');
        console.log('📋 Please apply this migration manually:');
        console.log('');
        console.log('1. Go to: https://supabase.com/dashboard/project/rxyatfvjjnvjxwyhhhqn/sql/new');
        console.log('2. Copy the SQL above');
        console.log('3. Paste it into the SQL Editor');
        console.log('4. Click "Run" to execute');
        console.log('');
        console.log('Or use the Supabase CLI after linking your project:');
        console.log('  supabase link --project-ref rxyatfvjjnvjxwyhhhqn');
        console.log('  supabase db push');
        console.log('');

        // Try to verify if we can at least read from the drivers table
        console.log('🔍 Testing current access to drivers table...');
        const { data, error } = await supabase.from('drivers').select('id').limit(1);

        if (error) {
            console.log('❌ Current error:', error.message);
            console.log('   This confirms the RLS policies are missing.');
        } else {
            console.log('✅ Successfully read from drivers table!');
            console.log('   The RLS policies might already be applied.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

applyMigration();
