import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see README › Database).",
  );
}

// One pool per server instance, reused across requests. On Vercel Fluid
// compute, attachDatabasePool closes idle connections before the instance
// is suspended; outside Vercel it does nothing.
export const pool = new Pool({ connectionString });
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export type Db = typeof db;
