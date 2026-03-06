import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const password = 'badxit-mewjyw-kaDga9';
const projRef = 'pxhydxsqtqpewmjfhhoh';
// Using Supabase Pooler (Transaction Mode usually 6543, Session usually 5432)
// This is a common hostname for Supabase US East 1
const poolerUrl = `postgresql://postgres.${projRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const pool = new Pool({
    connectionString: poolerUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateEmployeesTable() {
    const client = await pool.connect();
    try {
        console.log('Adding missing columns to employees table via pooler...');

        await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS qualifications TEXT,
      ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number TEXT,
      ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
    `);

        console.log('Successfully updated employees table.');
    } catch (error) {
        console.error('Error updating employees table:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updateEmployeesTable();
