import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-utils";
import { corsOptions, errorHandler } from "./middleware/auth";
import { registerAllRoutes } from "./routes/index";
import { db as storage } from "./db";

const app = express();

// Enable CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'FabZClean Server is running!'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    version: '1.0.0'
  });
});

(async () => {
  // Routes are registered via registerAllRoutes(app) below

  // Create HTTP server first (needed for Vite HMR)
  const server = createServer(app);

  // importantly only setup vite in development and BEFORE
  // registering routes so Vite middleware can handle module requests
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    await setupVite(app, server);
    log("✅ Vite dev server configured");
  } else {
    serveStatic(app);
    log("✅ Serving static files in production mode");
  }

  // Explicit health routes for database status and info
  app.get('/api/health/database', async (req, res) => {
    try {
      const { db } = await import('./db');
      await db.getProducts();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite',
      });
    } catch (error: any) {
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  app.get('/api/database/info', async (req, res) => {
    try {
      res.json({
        type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite',
        version: '1.0.0',
        tables: ['users', 'products', 'orders', 'customers', 'employees'],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Services endpoint
  app.get('/api/services', async (req, res) => {
    try {
      const { db } = await import('./db');
      const services = await db.getServices();
      res.json({ data: services });
    } catch (error: any) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Register all API routes AFTER Vite setup
  log("🔄 Registering all API routes (RELOADED)...");
  registerAllRoutes(app);
  log("✅ All API routes registered");

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize database connection
  try {
    await initializeDatabase();
    const dbType = process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite';
    log(`✅ ${dbType} database initialized and connected`);
  } catch (error: any) {
    log("❌ Database initialization failed:", error);
    // Don't exit - allow app to start even if DB init fails
    log("⚠️  Continuing without database initialization...");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // Bind to 0.0.0.0 to accept connections from any IP address (including static IP)
  const port = parseInt(process.env.PORT || (process.env.NODE_ENV === "production" ? "5000" : "5001"), 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`🚀 FabZClean Server running on ${host}:${port}`);
    if (process.env.STATIC_IP) {
      log(`📊 Access at: http://${process.env.STATIC_IP}:${port}`);
    }
    log(`📊 Health check: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/health`);
    log(`🧪 Test endpoint: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/test`);
  });
})();
