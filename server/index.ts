import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerAllRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-utils";
import { realtimeServer } from "./websocket-server";
import { driverTrackingService } from "./driver-tracking";
import { corsOptions, errorHandler } from "./middleware/auth";

const app = express();

// Enable CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
          // Register all routes
          registerAllRoutes(app);
  
  // Create HTTP server
  const server = realtimeServer.createServer(app);

  // Error handling middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
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
  // Bind to 0.0.0.0 to accept connections from any IP address (including static IP)
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`🚀 FabZClean Server running on ${host}:${port}`);
    if (process.env.STATIC_IP) {
      log(`📊 Access at: http://${process.env.STATIC_IP}:${port}`);
    }
    log(`📊 Health check: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/health`);
  });
})();
