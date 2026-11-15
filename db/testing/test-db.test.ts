/**
 * @jest-environment node
 */
import { categories } from "../schema";
import { createTestDb, createTestUser, type TestDb } from "./test-db";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

it("applies the migrations and creates a user with default categories", async () => {
  const user = await createTestUser(db, "user-a");
  const rows = await db.select().from(categories);
  expect(rows).toHaveLength(user.categories.length);
  expect(user.byName("Makan").type).toBe("expense");
});
