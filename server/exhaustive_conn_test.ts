import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function exhaustiveConnTest() {
    const password = 'badxit-mewjyw-kaDga9';
    const projRef = 'pxhydxsqtqpewmjfhhoh';

    const regions = ['ap-south-1', 'us-east-1', 'eu-central-1'];
    const userFormats = [`postgres.${projRef}`, 'postgres'];
    const ports = [5432, 6543];

    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        for (const user of userFormats) {
            for (const port of ports) {
                console.log(`Trying Region: ${region}, Host: ${host}, User: ${user}, Port: ${port}...`);
                const url = `postgresql://${user}:${password}@${host}:${port}/postgres`;
                const pool = new Pool({
                    connectionString: url,
                    ssl: { rejectUnauthorized: false },
                    connectionTimeoutMillis: 10000
                });

                try {
                    const client = await pool.connect();
                    console.log(`✅ SUCCESS WITH URL: postgresql://${user}:HIDDEN@${host}:${port}/postgres`);

                    await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS qualifications TEXT,
            ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS bank_name TEXT,
            ADD COLUMN IF NOT EXISTS account_number TEXT,
            ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
          `);
                    console.log('✅ Updated employees table successfully!');

                    client.release();
                    await pool.end();
                    return;
                } catch (e: any) {
                    console.log(`❌ Failed: ${e.message}`);
                    await pool.end();
                }
            }
        }
    }
}

exhaustiveConnTest();
