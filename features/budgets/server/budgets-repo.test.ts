/**
 * @jest-environment node
 */
import { eq } from "drizzle-orm";

import { budgets, transactions } from "@/db/schema";
import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "@/db/testing/test-db";

import {
  createBudget,
  deleteBudget,
  listBudgetStatus,
  updateBudget,
} from "./budgets-repo";

// Real SQL (PGlite): a missing `userId` or date condition would pass a mocked
// test, but fails here.

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

let alice: Awaited<ReturnType<typeof createTestUser>>;
let bob: Awaited<ReturnType<typeof createTestUser>>;

beforeEach(async () => {
  await resetTestDb(db);
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
});

const MONTH = "2026-11";

async function spend(
  user: typeof alice,
  category: string,
  amount: number,
  date: string,
  type: "expense" | "income" = "expense",
) {
  await db.insert(transactions).values({
    userId: user.id,
    categoryId: user.byName(category).id,
    type,
    amount,
    date,
  });
}

async function budget(user: typeof alice, category: string, amount: number) {
  const result = await createBudget(db, user.id, {
    categoryId: user.byName(category).id,
    amount,
  });
  if (!result.ok) throw new Error(`create failed: ${result.reason}`);
  return result.data;
}

async function amountOf(id: string) {
  const [row] = await db
    .select({ amount: budgets.amount })
    .from(budgets)
    .where(eq(budgets.id, id));
  return row?.amount;
}

describe("listBudgetStatus", () => {
  it("adds up the category's expenses in the month", async () => {
    const food = await budget(alice, "Makan", 1_000_000);
    await spend(alice, "Makan", 25_000, "2026-11-01");
    await spend(alice, "Makan", 40_000, "2026-11-30");
    await spend(alice, "Transport", 15_000, "2026-11-10");

    expect(await listBudgetStatus(db, alice.id, MONTH)).toStrictEqual([
      {
        id: food.id,
        category: {
          id: alice.byName("Makan").id,
          name: "Makan",
          icon: "utensils",
        },
        amount: 1_000_000,
        spent: 65_000,
        count: 2,
      },
    ]);
  });

  it("leaves out other months", async () => {
    await budget(alice, "Makan", 1_000_000);
    await spend(alice, "Makan", 25_000, "2026-10-31");
    await spend(alice, "Makan", 40_000, "2026-11-15");
    await spend(alice, "Makan", 55_000, "2026-12-01");

    const [status] = await listBudgetStatus(db, alice.id, MONTH);
    expect(status).toMatchObject({ spent: 40_000, count: 1 });
  });

  it("does not count income", async () => {
    await budget(alice, "Makan", 1_000_000);
    await spend(alice, "Makan", 40_000, "2026-11-15");
    // The API never files income under an expense category; the query must
    // still ignore such a row.
    await spend(alice, "Makan", 500_000, "2026-11-16", "income");

    const [status] = await listBudgetStatus(db, alice.id, MONTH);
    expect(status).toMatchObject({ spent: 40_000, count: 1 });
  });

  it("shows a budget without spending as 0", async () => {
    await budget(alice, "Hiburan", 300_000);
    const [status] = await listBudgetStatus(db, alice.id, MONTH);
    expect(status).toMatchObject({ amount: 300_000, spent: 0, count: 0 });
  });

  it("shows only the user's own budgets and spending", async () => {
    await budget(alice, "Makan", 1_000_000);
    await budget(bob, "Makan", 2_000_000);
    await budget(bob, "Transport", 500_000);
    await spend(alice, "Makan", 10_000, "2026-11-15");
    await spend(bob, "Makan", 99_000, "2026-11-15");

    const rows = await listBudgetStatus(db, alice.id, MONTH);
    expect(rows.map((r) => [r.category.name, r.amount, r.spent])).toEqual([
      ["Makan", 1_000_000, 10_000],
    ]);
  });

  it("sorts by category name", async () => {
    await budget(alice, "Transport", 1);
    await budget(alice, "Belanja", 1);
    await budget(alice, "Makan", 1);
    const rows = await listBudgetStatus(db, alice.id, MONTH);
    expect(rows.map((r) => r.category.name)).toEqual([
      "Belanja",
      "Makan",
      "Transport",
    ]);
  });
});

describe("createBudget", () => {
  it("adds a budget for the user's expense category", async () => {
    const result = await createBudget(db, alice.id, {
      categoryId: alice.byName("Makan").id,
      amount: 1_500_000,
    });
    expect(result).toStrictEqual({
      ok: true,
      data: {
        id: expect.any(String),
        category: {
          id: alice.byName("Makan").id,
          name: "Makan",
          icon: "utensils",
        },
        amount: 1_500_000,
      },
    });
  });

  it("refuses another user's category", async () => {
    const result = await createBudget(db, alice.id, {
      categoryId: bob.byName("Makan").id,
      amount: 1,
    });
    expect(result).toStrictEqual({ ok: false, reason: "category_not_found" });
    expect(await db.select().from(budgets)).toHaveLength(0);
  });

  it("refuses a category that does not exist", async () => {
    const result = await createBudget(db, alice.id, {
      categoryId: "0b6e5f00-0000-4000-8000-000000000001",
      amount: 1,
    });
    expect(result).toStrictEqual({ ok: false, reason: "category_not_found" });
  });

  it("refuses an income category", async () => {
    const result = await createBudget(db, alice.id, {
      categoryId: alice.byName("Gaji").id,
      amount: 1,
    });
    expect(result).toStrictEqual({ ok: false, reason: "category_not_expense" });
    expect(await db.select().from(budgets)).toHaveLength(0);
  });

  it("refuses a second budget for the same category", async () => {
    const first = await budget(alice, "Makan", 1_000_000);
    const result = await createBudget(db, alice.id, {
      categoryId: alice.byName("Makan").id,
      amount: 2_000_000,
    });
    expect(result).toStrictEqual({ ok: false, reason: "duplicate" });
    expect(await amountOf(first.id)).toBe(1_000_000);
  });
});

describe("updateBudget", () => {
  it("changes the limit", async () => {
    const food = await budget(alice, "Makan", 1_000_000);
    const result = await updateBudget(db, alice.id, food.id, {
      amount: 1_250_000,
    });
    expect(result).toStrictEqual({
      ok: true,
      data: { ...food, amount: 1_250_000 },
    });
    expect(await amountOf(food.id)).toBe(1_250_000);
  });

  it("does not touch another user's budget", async () => {
    const bobs = await budget(bob, "Makan", 2_000_000);
    const result = await updateBudget(db, alice.id, bobs.id, { amount: 1 });
    expect(result).toStrictEqual({ ok: false, reason: "not_found" });
    expect(await amountOf(bobs.id)).toBe(2_000_000);
  });
});

describe("deleteBudget", () => {
  it("removes the user's budget", async () => {
    const food = await budget(alice, "Makan", 1_000_000);
    expect(await deleteBudget(db, alice.id, food.id)).toBe(true);
    expect(await amountOf(food.id)).toBeUndefined();
  });

  it("does not touch another user's budget", async () => {
    const bobs = await budget(bob, "Makan", 2_000_000);
    expect(await deleteBudget(db, alice.id, bobs.id)).toBe(false);
    expect(await amountOf(bobs.id)).toBe(2_000_000);
  });
});
