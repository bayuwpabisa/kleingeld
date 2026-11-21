/**
 * @jest-environment node
 */
import { categories } from "@/db/schema";
import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "@/db/testing/test-db";

import { listCategories } from "./categories-repo";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetTestDb(db);
});

describe("listCategories", () => {
  it("lists only the user's own categories, expenses first, then by name", async () => {
    await createTestUser(db, "alice");
    await createTestUser(db, "bob");
    await db.insert(categories).values({
      userId: "alice",
      name: "Kopi & jajan",
      type: "expense",
      icon: "coffee",
    });

    const list = await listCategories(db, "alice");

    expect(list.every((c) => c.id && c.name && c.icon)).toBe(true);
    expect(list.map((c) => `${c.type}:${c.name}`)).toEqual([
      "expense:Belanja",
      "expense:Hiburan",
      "expense:Kesehatan",
      "expense:Kopi & jajan",
      "expense:Makan",
      "expense:Tagihan",
      "expense:Transport",
      "income:Freelance",
      "income:Gaji",
      "income:Lainnya",
    ]);
  });

  it("returns only the fields the form needs", async () => {
    await createTestUser(db, "alice");
    const [first] = await listCategories(db, "alice");
    expect(Object.keys(first ?? {}).sort()).toEqual([
      "icon",
      "id",
      "name",
      "type",
    ]);
  });

  it("returns nothing for a user without categories", async () => {
    await createTestUser(db, "alice");
    expect(await listCategories(db, "nobody")).toEqual([]);
  });
});
