import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Create Neon client
const sql = neon(connectionString);

// Create Drizzle database instance
export const db = drizzle(sql, { schema });

// Database connection test function
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Health check function
export async function healthCheck() {
  try {
    const result = await sql`SELECT 1 as status`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// Export connection string for reference
export const DATABASE_CONFIG = {
  host: 'ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  ssl: 'require',
  connectionString
};

export default db;
