import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
    const email = 'admin@myfabclean.com';
    const password = 'Durai@2025';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔍 Checking if admin user already exists...');

    // Check if admin already exists
    const { data: existing } = await supabase
        .from('employees')
        .select('id, email, employee_id, role')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        console.log(`✅ Admin user already exists: ${existing.employee_id} (${existing.email})`);
        // Update password to ensure it matches
        const { error: updateErr } = await supabase
            .from('employees')
            .update({ password: hashedPassword, status: 'active', role: 'admin' })
            .eq('id', existing.id);
        if (updateErr) {
            console.error('❌ Failed to update password:', updateErr);
        } else {
            console.log('✅ Password updated successfully');
        }
        return;
    }

    console.log('⏳ Creating admin user in Supabase...');

    const { data, error } = await supabase.from('employees').insert({
        employee_id: 'FZC01AD01',
        first_name: 'System',
        last_name: 'Admin',
        email: email,
        phone: '+919876543210',
        position: 'Administrator',
        department: 'Management',
        hire_date: new Date().toISOString(),
        salary: '50000',
        hourly_rate: null,
        status: 'active',
        role: 'admin',
        password: hashedPassword,
        address: JSON.stringify({ street: 'FabZClean HQ', city: 'Coimbatore', state: 'Tamil Nadu' }),
        emergency_contact: '+919876543211',
        notes: 'Primary system administrator account',
    }).select().single();

    if (error) {
        console.error('❌ Failed to create admin:', error);
        return;
    }

    console.log(`✅ Admin user created successfully!`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Employee ID: ${data.employee_id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Login: admin@myfabclean.com / Durai@2025`);
}

createAdminUser();
