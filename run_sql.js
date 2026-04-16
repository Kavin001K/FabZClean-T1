const { Client } = require('pg');
const fs = require('fs');

const sqlFile = process.argv[2] || 'scripts/customer_autocomplete_indexes.sql';
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    throw new Error('Missing DATABASE_URL or SUPABASE_DB_URL');
}

const sql = fs.readFileSync(sqlFile, 'utf-8');
const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
client.connect().then(() => client.query(sql)).then(() => console.log(`Done: ${sqlFile}`)).catch(console.error).finally(() => client.end());
