import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Create Neon client
const sql = neon(connectionString);

// Create Drizzle database instance
// @ts-ignore - Type mismatch in drizzle-orm/neon-serverless
export const db = drizzle(sql, { schema });

// Database connection test function
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully:', result[0]);
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Health check function
export async function healthCheck() {
  try {
    const result = await sql`SELECT 1 as status`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error: any) {
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
  connectionString,
  restApiUrl: process.env.NEON_REST_API_URL,
  stackProjectId: process.env.VITE_STACK_PROJECT_ID,
  stackPublishableKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  stackSecretKey: process.env.STACK_SECRET_SERVER_KEY,
  jwksUrl: process.env.JWKS_URL
};

export default db;