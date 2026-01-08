import 'dotenv/config';
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-utils";
import { corsOptions, errorHandler } from "./middleware/auth";
import { registerAllRoutes } from "./routes/index";
import { db as storage } from "./db";
import { realtimeServer } from "./websocket-server";
import { performanceMiddleware, getPerformanceStats } from "./performance-optimizer";
import { connectToMongo } from "./mongo-db";

const app = express();

// Enable CORS
app.use(cors(corsOptions));

// Security & Optimization
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Performance monitoring middleware
app.use(performanceMiddleware());

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

// Performance metrics endpoint
app.get('/api/performance', (req, res) => {
  res.json(getPerformanceStats());
});

(async () => {
  // Routes are registered via registerAllRoutes(app) below

  // Determine environment
  // Force production mode if running on Render (RENDER=true) or if NODE_ENV is production
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

  // Create HTTP server
  // Always use WebSocket-enabled server for real-time features
  const server = realtimeServer.createServer(app);

  // if (!isProduction) {
  //   log("⚠️  Backend WebSocket disabled in development (using Supabase Realtime only)");
  // }

  // importantly only setup vite in development and BEFORE
  // registering routes so Vite middleware can handle module requests
  // The `isProduction` constant is already defined above.

  if (!isProduction) {
    await setupVite(app, server);
    log("✅ Vite dev server configured");
  } else {
    serveStatic(app);
    log("✅ Serving static files in production mode");
  }

  // Register all API routes AFTER Vite setup
  registerAllRoutes(app);
  log("✅ All API routes registered");

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize database connection
  try {
    await initializeDatabase();
    const dbType = (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder')) ? 'Supabase' : 'SQLite';
    log(`✅ ${dbType} database initialized and connected`);
  } catch (error: any) {
    log("❌ Database initialization failed:", error);
    // Don't exit - allow app to start even if DB init fails
    log("⚠️  Continuing without database initialization...");
  }

  // Initialize MongoDB (Non-blocking, optional)
  connectToMongo().then((connected) => {
    if (connected) {
      log("✅ MongoDB ready for flexible logging");
    } else {
      log("⚠️  MongoDB unavailable - using SQL-only mode");
    }
  });

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
