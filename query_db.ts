import { config } from 'dotenv';
config();
import pkg from 'pg';
const { Client } = pkg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE prosrc ILIKE '%Unsupported transaction_type%';
  `);
  console.log(res.rows);
  await client.end();
}
run();
