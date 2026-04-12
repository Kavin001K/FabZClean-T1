const { Client } = require('pg');
const sql = require('fs').readFileSync('scripts/customer_autocomplete_indexes.sql', 'utf-8');
const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres.ryfbnyljshzrcaxqesgw:T93p5R0U4BwPzI0V@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});
client.connect().then(() => client.query(sql)).then(() => console.log('Done')).catch(console.error).finally(() => client.end());
