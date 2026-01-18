import { db } from "./db";
import { seedDatabase } from "./seed-data";

export async function initializeDatabase() {
  try {
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';
    console.log(`🔄 Initializing ${dbType} database...`);

    // Test the database connection by trying to get customers
    await db.listCustomers();

    console.log(`✅ ${dbType} database initialized successfully`);

    // Seed the database with sample data if empty
    // Note: Seeding might need adjustment for Supabase if not desired
    if (dbType === 'sqlite') {
      await seedDatabase();
    }

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';

    // Simple health check - try to query customers table
    await db.listCustomers();

    const responseTime = Date.now() - startTime;

    return {
      status: "healthy",
      database: dbType,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';
    return {
      status: "unhealthy",
      database: dbType,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function pingDatabase() {
  try {
    const startTime = Date.now();
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';

    // Simple ping - try to query
    await db.listCustomers();

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime: `${responseTime}ms`,
      database: dbType,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';
    return {
      success: false,
      error: (error as Error).message,
      database: dbType,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getDatabaseInfo() {
  try {
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';

    let config = {
      host: 'Local Filesystem',
      port: 0,
      database: 'local.sqlite',
      user: 'N/A',
      ssl: 'No',
      restApiUrl: undefined as string | undefined,
      stackProjectId: undefined as string | undefined,
      stackPublishableKey: undefined as string | undefined,
      stackSecretKey: undefined as string | undefined,
      jwksUrl: undefined as string | undefined
    };

    if (dbType === 'supabase') {
      const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

      if (sbUrl) {
        try {
          const url = new URL(sbUrl);
          config.host = url.hostname;
          config.port = 443;
          config.database = 'postgres';
          config.user = 'supabase_user';
          config.ssl = 'Required';
          config.restApiUrl = `${sbUrl}/rest/v1`;
          config.stackProjectId = url.hostname.split('.')[0];
          config.jwksUrl = `${sbUrl}/auth/v1/jwks`;
        } catch (e) {
          console.warn('Invalid Supabase URL:', sbUrl);
        }
      } else {
        config.host = 'Supabase (Not Configured)';
        config.database = 'postgres';
      }
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to get database info: ${(error as Error).message}`);
  }
}
