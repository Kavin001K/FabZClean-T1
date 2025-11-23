import { db } from "./db";
import { seedDatabase } from "./seed-data";

export async function initializeDatabase() {
  try {
    const dbType = process.env.USE_SUPABASE === 'true' ? 'supabase' : 'sqlite';
    console.log(`🔄 Initializing ${dbType} database...`);

    // Test the database connection by trying to get users
    await db.listUsers();

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

    // Simple health check - try to query users table
    await db.listUsers();

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
    await db.listUsers();

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
    const users = await db.listUsers();
    const products = await db.listProducts();
    const orders = await db.listOrders();
    const customers = await db.listCustomers();

    return {
      database: dbType,
      version: dbType === 'sqlite' ? "3.x" : "PostgreSQL",
      tables: {
        users: users.length,
        products: products.length,
        orders: orders.length,
        customers: customers.length,
      },
      status: "connected",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get database info: ${(error as Error).message}`);
  }
}
