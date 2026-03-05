/**
 * Database Configuration - Supabase Cloud Only
 * 
 * This module configures the application to use ONLY Supabase 
 * as the cloud database backend. No local SQLite.
 */

import { SupabaseStorage } from "./SupabaseStorage";

// Initialize Supabase storage
const dbInstance = new SupabaseStorage();

console.log(`☁️  Using Supabase Cloud Database: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}`);

export const db = dbInstance;

// For compatibility with existing imports
export { db as storage };

// Export type for better TypeScript support
export type Database = typeof db;
