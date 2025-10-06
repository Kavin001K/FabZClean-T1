import { defineConfig } from "drizzle-kit";

// SQLite configuration for local development
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./fabzclean.db",
  },
});
