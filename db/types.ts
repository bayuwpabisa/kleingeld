import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import type * as schema from "./schema";

/**
 * Any Drizzle database with our schema: the app's node-postgres pool
 * (db/index.ts) or PGlite in tests (db/testing/test-db.ts). Data-access
 * functions take one of these as a parameter instead of importing db/index.ts.
 */
export type AppDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** The `tx` inside `db.transaction(async (tx) => …)`. */
export type AppTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

/** Either one: helpers that run inside or outside a transaction. */
export type DbExecutor = AppDb | AppTx;
