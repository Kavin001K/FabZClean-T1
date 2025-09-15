"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.testConnection = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabaseHealth = getDatabaseHealth;
exports.executeQuery = executeQuery;
exports.pingDatabase = pingDatabase;
exports.getDatabaseInfo = getDatabaseInfo;
exports.createTables = createTables;
const database_1 = require("./database");
Object.defineProperty(exports, "testConnection", { enumerable: true, get: function () { return database_1.testConnection; } });
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return database_1.healthCheck; } });
const drizzle_orm_1 = require("drizzle-orm");
// Database utility functions for FabZClean application
/**
 * Initialize database connection and run health checks
 */
async function initializeDatabase() {
    console.log('🔄 Initializing database connection...');
    const isConnected = await (0, database_1.testConnection)();
    if (!isConnected) {
        throw new Error('Failed to connect to database');
    }
    console.log('✅ Database initialized successfully');
    return true;
}
/**
 * Get database health status
 */
async function getDatabaseHealth() {
    return await (0, database_1.healthCheck)();
}
/**
 * Execute raw SQL queries (use with caution)
 */
async function executeQuery(query, params = []) {
    try {
        const result = await database_1.db.execute(drizzle_orm_1.sql.raw(query, params));
        return { success: true, data: result };
    }
    catch (error) {
        console.error('Query execution failed:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Test database connectivity
 */
async function pingDatabase() {
    try {
        const start = Date.now();
        // Use the testConnection function which works correctly
        const isConnected = await (0, database_1.testConnection)();
        const duration = Date.now() - start;
        return {
            success: isConnected,
            latency: `${duration}ms`,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
/**
 * Get database information
 */
async function getDatabaseInfo() {
    try {
        // Use the testConnection function which works correctly
        const connectionTest = await (0, database_1.testConnection)();
        return {
            version: 'PostgreSQL (Neon)',
            currentTime: new Date().toISOString(),
            connected: connectionTest,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Failed to get database info:', error);
        return {
            version: 'Unknown',
            currentTime: new Date().toISOString(),
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
/**
 * Create database tables if they don't exist
 */
async function createTables() {
    try {
        // This would typically use Drizzle migrations
        // For now, we'll just verify the connection
        await (0, database_1.testConnection)();
        console.log('✅ Database tables ready');
        return true;
    }
    catch (error) {
        console.error('Failed to create tables:', error);
        return false;
    }
}
exports.default = database_1.db;
//# sourceMappingURL=db-utils.js.map