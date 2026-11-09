import "./db/load-env";

import { defineConfig } from "drizzle-kit";

// Migrations use the direct connection; PgBouncer (the pooled URL) is meant
// for app queries.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL must be set (see README › Database).",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
