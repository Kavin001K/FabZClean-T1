"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
// const vite_1 = require("./vite"); // Removed for Netlify Functions
const db_utils_1 = require("./db-utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
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
            // (0, vite_1.log)(logLine); // Removed for Netlify Functions
            console.log(logLine);
        }
    });
    next();
});
(async () => {
    const server = await (0, routes_1.registerRoutes)(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
        // await (0, vite_1.setupVite)(app, server); // Removed for Netlify Functions
    }
    else {
        // (0, vite_1.serveStatic)(app); // Removed for Netlify Functions
    }
    // Initialize database connection
    try {
        await (0, db_utils_1.initializeDatabase)();
        // (0, vite_1.log)('✅ Database connection established'); // Removed for Netlify Functions
        console.log('✅ Database connection established');
    }
    catch (error) {
        // (0, vite_1.log)('❌ Database connection failed:', error); // Removed for Netlify Functions
        console.log('❌ Database connection failed:', error);
        process.exit(1);
    }
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, () => {
        // (0, vite_1.log)(`serving on port ${port}`); // Removed for Netlify Functions
        console.log(`serving on port ${port}`);
    });
})();
//# sourceMappingURL=index.js.map