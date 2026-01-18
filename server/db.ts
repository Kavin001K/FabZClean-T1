/**
 * Database Configuration - Secure Local Storage
 * * This module configures the application to use ONLY local SQLite storage
 * with enhanced security measures and file storage.
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
const FILES_PATH = path.join(SECURE_DATA_PATH, "files");
const INVOICES_PATH = path.join(FILES_PATH, "invoices");
const BILLS_PATH = path.join(FILES_PATH, "bills");
const RECEIPTS_PATH = path.join(FILES_PATH, "receipts");
const BARCODES_PATH = path.join(FILES_PATH, "barcodes");
const SIGNATURES_PATH = path.join(FILES_PATH, "signatures");
const DOCUMENTS_PATH = path.join(FILES_PATH, "documents");
const IMAGES_PATH = path.join(FILES_PATH, "images");
const REPORTS_PATH = path.join(FILES_PATH, "reports");
const TEMP_PATH = path.join(FILES_PATH, "temp");

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

// Initialize all directories
ensureSecureDirectory(SECURE_DATA_PATH);
ensureSecureDirectory(BACKUPS_PATH);
ensureSecureDirectory(LOGS_PATH);
ensureSecureDirectory(FILES_PATH);
ensureSecureDirectory(INVOICES_PATH);
ensureSecureDirectory(BILLS_PATH);
ensureSecureDirectory(RECEIPTS_PATH);
ensureSecureDirectory(BARCODES_PATH);
ensureSecureDirectory(SIGNATURES_PATH);
ensureSecureDirectory(DOCUMENTS_PATH);
ensureSecureDirectory(IMAGES_PATH);
ensureSecureDirectory(REPORTS_PATH);
ensureSecureDirectory(TEMP_PATH);

// Create year/month subdirectories for invoices and bills
const now = new Date();
const year = now.getFullYear().toString();
const month = (now.getMonth() + 1).toString().padStart(2, '0');
for (const basePath of [INVOICES_PATH, BILLS_PATH, RECEIPTS_PATH, REPORTS_PATH]) {
  const datePath = path.join(basePath, year, month);
  if (!existsSync(datePath)) {
    mkdirSync(datePath, { recursive: true });
  }
}

// 3. Database path within secure folder
const DB_PATH = path.join(SECURE_DATA_PATH, "fabzclean.db");

// 4. Initialize ONLY SQLite
console.log(`🔒 Initializing Secure Local Database at: ${DB_PATH}`);
console.log(`📁 File storage initialized at: ${FILES_PATH}`);
const dbInstance = new SQLiteStorage(DB_PATH);

export const db = dbInstance;

// For compatibility with existing imports
export { db as storage };

// Export type for better TypeScript support
export type Database = typeof db;

// Export paths for maintenance scripts and file storage
export const PATHS = {
  SECURE_DATA: SECURE_DATA_PATH,
  BACKUPS: BACKUPS_PATH,
  LOGS: LOGS_PATH,
  DATABASE: DB_PATH,
  FILES: FILES_PATH,
  INVOICES: INVOICES_PATH,
  BILLS: BILLS_PATH,
  RECEIPTS: RECEIPTS_PATH,
  BARCODES: BARCODES_PATH,
  SIGNATURES: SIGNATURES_PATH,
  DOCUMENTS: DOCUMENTS_PATH,
  IMAGES: IMAGES_PATH,
  REPORTS: REPORTS_PATH,
  TEMP: TEMP_PATH,
};

// Helper function to get dated path for file storage
export function getDatedPath(category: 'invoices' | 'bills' | 'receipts' | 'reports'): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  let basePath: string;
  switch (category) {
    case 'invoices': basePath = INVOICES_PATH; break;
    case 'bills': basePath = BILLS_PATH; break;
    case 'receipts': basePath = RECEIPTS_PATH; break;
    case 'reports': basePath = REPORTS_PATH; break;
    default: basePath = DOCUMENTS_PATH;
  }

  const datePath = path.join(basePath, year, month);
  if (!existsSync(datePath)) {
    mkdirSync(datePath, { recursive: true });
  }

  return datePath;
}
