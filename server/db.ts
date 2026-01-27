/**
 * Database Configuration - Secure Local Storage
 * * This module configures the application to use ONLY local SQLite storage
 * with enhanced security measures and file storage.
 */

import { SQLiteStorage } from "./SQLiteStorage";
import path from "path";
import { existsSync, mkdirSync, chmodSync } from "fs";
import { DATABASE_PATH, getSecurePaths, initializeSecureDirectories } from "./db-path";

// Initialize secure directories on import
initializeSecureDirectories();

// Get all paths from the unified configuration
const paths = getSecurePaths();
const SECURE_DATA_PATH = path.dirname(DATABASE_PATH);
const DB_PATH = DATABASE_PATH;
const BACKUPS_PATH = paths.backups;
const LOGS_PATH = paths.logs;
const FILES_PATH = paths.files;
const INVOICES_PATH = path.join(FILES_PATH, "invoices");
const BILLS_PATH = path.join(FILES_PATH, "bills");
const RECEIPTS_PATH = path.join(FILES_PATH, "receipts");
const BARCODES_PATH = path.join(FILES_PATH, "barcodes");
const SIGNATURES_PATH = path.join(FILES_PATH, "signatures");
const DOCUMENTS_PATH = path.join(FILES_PATH, "documents");
const IMAGES_PATH = path.join(FILES_PATH, "images");
const REPORTS_PATH = path.join(FILES_PATH, "reports");
const TEMP_PATH = paths.temp;

// 2. Ensure secure directories exist with restricted permissions
function ensureSecureDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    try {
      mkdirSync(dirPath, { recursive: true });
      // Try setting permissions (Linux/Docker only), ignore on Windows
      if (process.platform !== 'win32') {
        try {
          chmodSync(dirPath, 0o700);
        } catch (e) {
          // Ignore permission errors on some file systems
        }
      }
    } catch (err) {
      console.warn(`⚠️  Could not create directory ${dirPath}:`, err);
    }
  }
}

// Initialize all directories
[
  SECURE_DATA_PATH, BACKUPS_PATH, LOGS_PATH, FILES_PATH,
  INVOICES_PATH, BILLS_PATH, RECEIPTS_PATH, BARCODES_PATH,
  SIGNATURES_PATH, DOCUMENTS_PATH, IMAGES_PATH, REPORTS_PATH, TEMP_PATH
].forEach(ensureSecureDirectory);

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

// 4. Initialize ONLY SQLite

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
