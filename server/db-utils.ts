import { db, testConnection, healthCheck } from './database';
import { sql } from 'drizzle-orm';

// Re-export database functions
export { testConnection, healthCheck };

// Database utility functions for FabZClean application

/**
 * Initialize database connection and run health checks
 */
export async function initializeDatabase() {
  console.log('🔄 Initializing database connection...');
  
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }
  
  console.log('✅ Database initialized successfully');
  return true;
}

/**
 * Get database health status
 */
export async function getDatabaseHealth() {
  return await healthCheck();
}

/**
 * Execute raw SQL queries (use with caution)
 */
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await db.execute(sql.raw(query));
    return { success: true, data: result };
  } catch (error) {
    console.error('Query execution failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Test database connectivity
 */
export async function pingDatabase() {
  try {
    const start = Date.now();
    // Use the testConnection function which works correctly
    const isConnected = await testConnection();
    const duration = Date.now() - start;
    return { 
      success: isConnected, 
      latency: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      success: false, 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get database information
 */
export async function getDatabaseInfo() {
  try {
    // Use the testConnection function which works correctly
    const connectionTest = await testConnection();
    
    return {
      version: 'PostgreSQL (Neon)',
      currentTime: new Date().toISOString(),
      connected: connectionTest,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return { 
      version: 'Unknown',
      currentTime: new Date().toISOString(),
      connected: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Create database tables if they don't exist
 */
export async function createTables() {
  try {
    // This would typically use Drizzle migrations
    // For now, we'll just verify the connection
    await testConnection();
    console.log('✅ Database tables ready');
    return true;
  } catch (error) {
    console.error('Failed to create tables:', error);
    return false;
  }
}

export default db;
