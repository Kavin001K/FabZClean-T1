import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cron from "node-cron";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-utils";
import { realtimeServer } from "./websocket-server";
import { driverTrackingService } from "./driver-tracking";
import { corsOptions, errorHandler } from "./middleware/auth";
import { surveillanceMiddleware } from "./middleware/surveillance";

const app = express();

// Enable CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Helper to mask sensitive PII and secrets in logs
function maskSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  const masked = Array.isArray(data) ? [...data] : { ...data };

  // Fields to completely redact
  const sensitiveFields = ['password', 'token', 'access_token', 'refreshToken', 'card', 'cvc', 'secret', 'auth'];
  // Fields to mask as PII
  const piiFields = ['email', 'phone', 'phoneNumber', 'mobile', 'address'];

  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED_SECRET***';
    } else if (piiFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED_PII***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

// Security Headers Middleware (Strict CSP)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.googleapis.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://* blob:; frame-src 'self';"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Logging & Data Masking Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // OPTIMIZATION: Only capture body if it's small to prevent memory leaks
    try {
      const bodySize = bodyJson ? JSON.stringify(bodyJson).length : 0;
      if (bodySize < 2000) {
        capturedJsonResponse = bodyJson;
      } else {
        capturedJsonResponse = { _truncated: 'Response too large to log', size: bodySize };
      }
    } catch {
      capturedJsonResponse = { _truncated: 'Could not serialize response' };
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Apply strict masking before logging
        const safeLogData = maskSensitiveData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(safeLogData)}`;
      }

      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Surveillance Middleware - logs all authenticated API requests to audit_logs
app.use(surveillanceMiddleware);

(async () => {
  // Register all routes
  await registerRoutes(app);

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

  // Schedule daily maintenance at 3 AM
  cron.schedule('0 3 * * *', async () => {
    log('🔧 Running scheduled daily maintenance...');
    try {
      const { optimizeSystem } = await import('./scripts/daily-maintenance');
      await optimizeSystem();
      log('✅ Daily maintenance completed successfully');
    } catch (error: any) {
      log('❌ Daily maintenance failed:', error.message);
    }
  });
  log('📅 Daily maintenance scheduled for 3:00 AM');
})();
