import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateEmployeesTable() {
    const client = await pool.connect();
    try {
        console.log('Adding missing columns to employees table...');

        // Add qualifications column if it doesn't exist
        await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS qualifications TEXT;
    `);

        // Add salary_type column if it doesn't exist (maps to salaryType in frontend)
        await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly';
    `);

        // Add other missing columns from user screenshots if needed
        // Based on the 'Work' tab: Department, Position, Hire Date are already there
        // Based on 'Pay' tab: salaryType is missing (added above)

        console.log('Successfully updated employees table.');
    } catch (error) {
        console.error('Error updating employees table:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updateEmployeesTable();
