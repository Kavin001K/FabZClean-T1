"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_CONFIG = exports.db = void 0;
exports.testConnection = testConnection;
exports.healthCheck = healthCheck;
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const serverless_1 = require("@neondatabase/serverless");
const schema = __importStar(require("../shared/schema"));
// Database connection configuration
const connectionString = process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
// Create Neon client
const sql = (0, serverless_1.neon)(connectionString);
// Create Drizzle database instance
// @ts-ignore - Type mismatch in drizzle-orm/neon-serverless
exports.db = (0, neon_serverless_1.drizzle)(sql, { schema });
// Database connection test function
async function testConnection() {
    try {
        const result = await sql `SELECT NOW() as current_time`;
        console.log('✅ Database connected successfully:', result[0]);
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
// Health check function
async function healthCheck() {
    try {
        const result = await sql `SELECT 1 as status`;
        return { status: 'healthy', timestamp: new Date().toISOString() };
    }
    catch (error) {
        return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
}
// Export connection string for reference
exports.DATABASE_CONFIG = {
    host: 'ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech',
    port: 5432,
    database: 'neondb',
    user: 'neondb_owner',
    ssl: 'require',
    connectionString,
    restApiUrl: process.env.NEON_REST_API_URL,
    stackProjectId: process.env.VITE_STACK_PROJECT_ID,
    stackPublishableKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
    stackSecretKey: process.env.STACK_SECRET_SERVER_KEY,
    jwksUrl: process.env.JWKS_URL
};
exports.default = exports.db;
//# sourceMappingURL=database.js.map