import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const password = 'badxit-mewjyw-kaDga9';
const projRef = 'pxhydxsqtqpewmjfhhoh';
// Using ap-south-1 pooler since it resolves
const host = 'aws-0-ap-south-1.pooler.supabase.com';
const user = `postgres.${projRef}`;
const port = 6543; // Transaction mode for Supabase Pooler

const url = `postgresql://${user}:${password}@${host}:${port}/postgres`;

const pool = new Pool({
    connectionString: url,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateEmployeesTable() {
    const client = await pool.connect();
    try {
        console.log(`Connecting to: postgresql://${user}:HIDDEN@${host}:${port}/postgres`);
        console.log('Adding missing columns to employees table via Mumbai pooler...');

        await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS qualifications TEXT,
      ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number TEXT,
      ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
    `);

        console.log('✅ Successfully updated employees table.');
    } catch (error) {
        console.error('❌ Error updating employees table:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updateEmployeesTable();
