import { db } from "./db";

export async function initializeDatabase() {
  try {
    console.log(`🔄 Initializing Supabase database...`);

    // Test the database connection by trying to list customers
    await db.listCustomers();

    console.log(`✅ Supabase database initialized successfully`);
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();

    // Simple health check - try to query customers table
    await db.listCustomers();

    const responseTime = Date.now() - startTime;

    return {
      status: "healthy",
      database: "supabase",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      database: "supabase",
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function pingDatabase() {
  try {
    const startTime = Date.now();

    await db.listCustomers();

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime: `${responseTime}ms`,
      database: "supabase",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      database: "supabase",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getDatabaseInfo() {
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  let config = {
    host: 'Supabase (Not Configured)',
    port: 443,
    database: 'postgres',
    user: 'supabase_user',
    ssl: 'Required',
    restApiUrl: undefined as string | undefined,
    stackProjectId: undefined as string | undefined,
    stackPublishableKey: undefined as string | undefined,
    stackSecretKey: undefined as string | undefined,
    jwksUrl: undefined as string | undefined
  };

  if (sbUrl) {
    try {
      const url = new URL(sbUrl);
      config.host = url.hostname;
      config.restApiUrl = `${sbUrl}/rest/v1`;
      config.stackProjectId = url.hostname.split('.')[0];
      config.jwksUrl = `${sbUrl}/auth/v1/jwks`;
    } catch (e) {
      console.warn('Invalid Supabase URL:', sbUrl);
    }
  }

  return config;
}
