import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking employees table columns via REST API...');
    // This is a hack to get column names: SELECT * FROM employees LIMIT 1
    const { data, error } = await supabase.from('employees').select('*').limit(1);

    if (error) {
        console.error('Error fetching employees:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        // If table is empty, we can try to get the schema from the PostgREST info if enabled
        console.log('No data found in employees table. Trying to get columns from first record if it exists...');
    }

    // Try to create a dummy employee with new columns to see if it fails
    console.log('Attempting to check if qualifications column exists...');
    const { error: insertError } = await supabase.from('employees').insert([{
        employee_id: 'TEST_CHECK',
        first_name: 'Test',
        last_name: 'Check',
        position: 'Test',
        department: 'Test',
        hire_date: new Date().toISOString(),
        salary: 0,
        qualifications: 'exists?' // try to insert new column
    }]);

    if (insertError) {
        console.log('Insert failed (expected if column missing):', insertError.message);
    } else {
        console.log('Insert succeeded! Qualifications column EXISTS.');
        // Clean up
        await supabase.from('employees').delete().eq('employee_id', 'TEST_CHECK');
    }
}

checkColumns();
