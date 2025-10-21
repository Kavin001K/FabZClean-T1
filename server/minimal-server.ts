import express from "express";
import cors from "cors";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-utils";
import { realtimeServer } from "./websocket-server";
import { corsOptions, errorHandler } from "./middleware/auth";

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
  // Create HTTP server
  const server = realtimeServer.createServer(app);

  // Error handling middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the quoter routes so the catch-all route
  // doesn't interfere with the other routes
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    log("✅ Serving static files in production mode");
  }

  // Initialize database connection
  try {
    await initializeDatabase();
    log("✅ SQLite database initialized and connected");
  } catch (error: any) {
    log("❌ Database initialization failed:", error);
    // Don't exit - allow app to start even if DB init fails
    log("⚠️  Continuing without database initialization...");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, () => {
    log(`🚀 FabZClean Server running on port ${port}`);
    log(`📊 Health check: http://localhost:${port}/api/health`);
    log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
  });
})();
