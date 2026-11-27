/**
 * @jest-environment node
 */
import { eq } from "drizzle-orm";

import { budgets, categories, users } from "./schema";
import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "./testing/test-db";

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

// Drizzle wraps the Postgres error; the constraint name is on its cause.
async function constraintOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error: unknown) {
    const cause = error instanceof Error ? error.cause : undefined;
    if (cause && typeof cause === "object" && "constraint" in cause) {
      return cause.constraint;
    }
    throw error;
  }
  return null;
}

describe("budgets table", () => {
  it("allows one budget per category of a user", async () => {
    const user = await createTestUser(db, "user-a");
    const categoryId = user.byName("Makan").id;
    await db.insert(budgets).values({ userId: user.id, categoryId, amount: 1 });

    expect(
      await constraintOf(
        db.insert(budgets).values({ userId: user.id, categoryId, amount: 2 }),
      ),
    ).toBe("budgets_user_category_unique");
  });

  it("lets each user budget their own categories", async () => {
    const a = await createTestUser(db, "user-a");
    const b = await createTestUser(db, "user-b");
    await db.insert(budgets).values([
      { userId: a.id, categoryId: a.byName("Makan").id, amount: 100_000 },
      { userId: b.id, categoryId: b.byName("Makan").id, amount: 200_000 },
    ]);
    expect(await db.select().from(budgets)).toHaveLength(2);
  });

  it("rejects a limit that is not positive", async () => {
    const user = await createTestUser(db, "user-a");
    expect(
      await constraintOf(
        db.insert(budgets).values({
          userId: user.id,
          categoryId: user.byName("Makan").id,
          amount: 0,
        }),
      ),
    ).toBe("budgets_amount_positive");
  });

  it("removes the budget with its category", async () => {
    const user = await createTestUser(db, "user-a");
    const food = user.byName("Makan").id;
    const transport = user.byName("Transport").id;
    await db.insert(budgets).values([
      { userId: user.id, categoryId: food, amount: 100_000 },
      { userId: user.id, categoryId: transport, amount: 50_000 },
    ]);

    await db.delete(categories).where(eq(categories.id, food));

    const rows = await db.select().from(budgets);
    expect(rows.map((r) => r.categoryId)).toEqual([transport]);
  });

  it("removes the budgets with their user", async () => {
    const user = await createTestUser(db, "user-a");
    await db.insert(budgets).values({
      userId: user.id,
      categoryId: user.byName("Makan").id,
      amount: 100_000,
    });

    await db.delete(users).where(eq(users.id, user.id));

    expect(await db.select().from(budgets)).toHaveLength(0);
  });
});
