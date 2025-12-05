import { defineConfig } from "drizzle-kit";

// Configuration for Drizzle Kit
// Note: We use manual SQL in SQLiteStorage.ts for SQLite.
// This config is primarily for reference or future Postgres migrations.
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", // Changed to match schema definition (pg-core)
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://user:password@localhost:5432/fabzclean",
  },
});
