import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function tryConnections() {
    const password = 'badxit-mewjyw-kaDga9';
    const projRef = 'pxhydxsqtqpewmjfhhoh';

    const hosts = [
        `db.${projRef}.supabase.co`,
        `aws-0-us-east-1.pooler.supabase.com`,
        `db.${projRef}.supabase.com`,
        `direct.${projRef}.supabase.co`
    ];

    const userFormats = [
        `postgres.${projRef}`,
        'postgres'
    ];

    const ports = [5432, 6543];

    for (const host of hosts) {
        for (const user of userFormats) {
            for (const port of ports) {
                console.log(`Trying host: ${host}, user: ${user}, port: ${port}...`);
                const url = `postgresql://${user}:${password}@${host}:${port}/postgres`;
                const pool = new Pool({
                    connectionString: url,
                    ssl: { rejectUnauthorized: false },
                    connectionTimeoutMillis: 5000
                });

                try {
                    const client = await pool.connect();
                    console.log(`✅ Success with URL: postgresql://${user}:HIDDEN@${host}:${port}/postgres`);

                    await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS qualifications TEXT,
            ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS bank_name TEXT,
            ADD COLUMN IF NOT EXISTS account_number TEXT,
            ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
          `);
                    console.log('✅ Successfully updated employees table.');

                    client.release();
                    await pool.end();
                    return; // Stop after first success
                } catch (e: any) {
                    console.log(`❌ Failed: ${e.message}`);
                    await pool.end();
                }
            }
        }
    }
}

tryConnections();
