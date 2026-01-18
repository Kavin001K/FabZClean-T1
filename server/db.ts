/**
 * Database Configuration - Secure Local Storage
 * * This module configures the application to use ONLY local SQLite storage
 * with enhanced security measures.
 */

import { SQLiteStorage } from "./SQLiteStorage";
import path from "path";
import { existsSync, mkdirSync, chmodSync } from "fs";

// 1. Define Secure Folder Path
// ✅ MODIFIED: Prioritize external environment variable, fall back to local folder
const SECURE_DATA_PATH = process.env.DATA_STORAGE_PATH
  ? process.env.DATA_STORAGE_PATH
  : path.join(process.cwd(), "server", "secure_data");

const BACKUPS_PATH = path.join(SECURE_DATA_PATH, "backups");
const LOGS_PATH = path.join(SECURE_DATA_PATH, "logs");

// 2. Ensure secure directories exist with restricted permissions
function ensureSecureDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    try {
      mkdirSync(dirPath, { recursive: true });
      // Set permissions to 700 (owner read/write/execute only)
      // Only apply restricted permissions if creating the folder fresh
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
