import { db } from "./db";

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing SQLite database...");

    // Test the database connection by trying to get users
    await db.listUsers();

    console.log("✅ SQLite database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ SQLite database initialization failed:", error);
    throw error;
  }
}

export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();

    // Simple health check - try to query users table
    await db.listUsers();

    const responseTime = Date.now() - startTime;

    return {
      status: "healthy",
      database: "sqlite",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      database: "sqlite",
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function pingDatabase() {
  try {
    const startTime = Date.now();

    // Simple ping - try to query
    await db.listUsers();

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime: `${responseTime}ms`,
      database: "sqlite",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      database: "sqlite",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getDatabaseInfo() {
  try {
    const users = await db.listUsers();
    const products = await db.listProducts();
    const orders = await db.listOrders();
    const customers = await db.listCustomers();

    return {
      database: "sqlite",
      version: "3.x", // SQLite version
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
