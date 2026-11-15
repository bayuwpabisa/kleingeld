import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { defaultCategoriesFor } from "../default-categories";
import * as schema from "../schema";
import type { AppDb } from "../types";

// For tests only: a real Postgres (PGlite, in memory) with the same
// migrations as Neon. Use it from a test file with `@jest-environment node`.

export type TestDb = AppDb & { close: () => Promise<void> };

export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle({ client, schema, casing: "snake_case" });
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "db", "migrations"),
  });
  return Object.assign(db, { close: () => client.close() });
}

/** Removes every row, so each test starts from an empty database. */
export async function resetTestDb(db: AppDb) {
  // Children first: transactions → categories → users (sessions and
  // accounts cascade with their user).
  await db.delete(schema.transactions);
  await db.delete(schema.categories);
  await db.delete(schema.users);
}

/** A user with the default categories, like a fresh sign-up. */
export async function createTestUser(db: AppDb, id: string) {
  await db.insert(schema.users).values({
    id,
    name: `User ${id}`,
    email: `${id}@example.test`,
  });
  const categories = await db
    .insert(schema.categories)
    .values(defaultCategoriesFor(id))
    .returning();

  const byName = (name: string) => {
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error(`No default category named ${name}`);
    return category;
  };
  return { id, categories, byName };
}
