import { SQLiteStorage } from "./SQLiteStorage";
import path from "path";
import { existsSync } from "fs";

// Determine database path with fallbacks
const isProduction = process.env.NODE_ENV === "production";

let dbPath: string;

if (isProduction) {
  // Try Render disk path first
  const renderDiskPath = process.env.RENDER_DISK_PATH || "/opt/render/project/src/data";

  // If the render disk path directory exists, use it
  // Otherwise fall back to a writable location
  if (existsSync(renderDiskPath)) {
    dbPath = path.join(renderDiskPath, "fabzclean.db");
  } else {
    // Fallback to /tmp which is always writable on Render
    console.warn(`⚠️  Render disk path ${renderDiskPath} not found, using /tmp`);
    dbPath = "/tmp/fabzclean.db";
  }
} else {
  dbPath = "./fabzclean.db";
}

console.log(`🗄️  Database path: ${dbPath}`);

// Use SQLite as the primary database
export const db = new SQLiteStorage(dbPath);

// For compatibility with existing imports
export { db as storage };

// Export type for better TypeScript support
export type Database = typeof db;
