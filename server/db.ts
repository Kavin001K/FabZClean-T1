/**
 * Database Configuration - Secure Local Storage
 * 
 * This module configures the application to use ONLY local SQLite storage
 * with enhanced security measures.
 * 
 * Security Features:
 * - Secure data folder with restricted permissions
 * - No cloud dependencies
 * - Complete local control
 */

import { SQLiteStorage } from "./SQLiteStorage";
import path from "path";
import { existsSync, mkdirSync, chmodSync } from "fs";

// 1. Define Secure Folder Path
const SECURE_DATA_PATH = path.join(process.cwd(), "server", "secure_data");
const BACKUPS_PATH = path.join(SECURE_DATA_PATH, "backups");
const LOGS_PATH = path.join(SECURE_DATA_PATH, "logs");

// 2. Ensure secure directories exist with restricted permissions
function ensureSecureDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    // Set permissions to 700 (owner read/write/execute only)
    try {
      chmodSync(dirPath, 0o700);
    } catch (err) {
      console.warn(`⚠️  Could not set permissions on ${dirPath}:`, err);
    }
  }
}

ensureSecureDirectory(SECURE_DATA_PATH);
ensureSecureDirectory(BACKUPS_PATH);
ensureSecureDirectory(LOGS_PATH);

// 3. Database path within secure folder
const DB_PATH = path.join(SECURE_DATA_PATH, "fabzclean.db");

// 4. Initialize ONLY SQLite
console.log(`🔒 Initializing Secure Local Database at: ${DB_PATH}`);
const dbInstance = new SQLiteStorage(DB_PATH);

export const db = dbInstance;

// For compatibility with existing imports
export { db as storage };

// Export type for better TypeScript support
export type Database = typeof db;

// Export paths for maintenance scripts
export const PATHS = {
  SECURE_DATA: SECURE_DATA_PATH,
  BACKUPS: BACKUPS_PATH,
  LOGS: LOGS_PATH,
  DATABASE: DB_PATH,
};
