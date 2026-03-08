import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Adding columns to customers table...');
        await client.query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT;
    `);
        console.log('Columns added successfully.');
    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
