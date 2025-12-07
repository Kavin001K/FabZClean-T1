import { defineConfig } from "drizzle-kit";

// Configuration for Drizzle Kit
// Note: We use manual SQL in SQLiteStorage.ts for SQLite.
// This config is primarily for reference or future Postgres migrations.
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", // Changed to match schema definition (pg-core)
  dbCredentials: {
    // Direct connection to DB (no pooler)
    url: process.env.SUPABASE_DB_URL || "postgres://postgres:Durai%402025@db.rxyatfvjjnvjxwyhhhqn.supabase.co:5432/postgres",
  },
});
