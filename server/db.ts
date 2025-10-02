import { SQLiteStorage } from "./SQLiteStorage";
import path from "path";

// Use persistent disk for production (Render) or local for development
const isProduction = process.env.NODE_ENV === "production";
const dbPath = isProduction 
  ? path.join(process.env.RENDER_DISK_PATH || "/opt/render/project/src/data", "fabzclean.db")
  : "./fabzclean.db";

// Use SQLite as the primary database
export const db = new SQLiteStorage(dbPath);

// For compatibility with existing imports
export { db as storage };

// Initialize with some logging
console.log(`🗄️  Using SQLite database: ${dbPath}`);

// Export type for better TypeScript support
export type Database = typeof db;
