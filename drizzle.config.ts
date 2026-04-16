import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing database URL. Set SUPABASE_DB_URL or DATABASE_URL before running Drizzle.");
}

// Configuration for Drizzle Kit
// Note: We use manual SQL in SQLiteStorage.ts for SQLite.
// This config is primarily for reference or future Postgres migrations.
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", // Changed to match schema definition (pg-core)
  dbCredentials: {
    url: databaseUrl,
  },
});
