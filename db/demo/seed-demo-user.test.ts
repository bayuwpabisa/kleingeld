/**
 * @jest-environment node
 */
import { eq } from "drizzle-orm";

import { budgets, categories, transactions } from "../schema";
import { createTestDb, resetTestDb, type TestDb } from "../testing/test-db";
import { buildDemoBudgets } from "./build-demo-budgets";
import { buildDemoTransactions } from "./build-demo-transactions";
import { DEMO_USER } from "./demo-user";
import { seedDemoUser } from "./seed-demo-user";

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

const today = "2026-11-26";

async function demoBudgets() {
  return db
    .select({ name: categories.name, amount: budgets.amount })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(eq(budgets.userId, DEMO_USER.id))
    .orderBy(categories.name);
}

describe("seedDemoUser", () => {
  it("adds the demo transactions and budgets", async () => {
    const result = await seedDemoUser(db, today);

    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
      })
      .from(categories)
      .where(eq(categories.userId, DEMO_USER.id));
    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        note: transactions.note,
      })
      .from(transactions)
      .where(eq(transactions.userId, DEMO_USER.id));

    const expectedRows = buildDemoTransactions({ today, categories: cats });
    expect(result.transactions).toBe(expectedRows.length);
    expect(rows).toHaveLength(expectedRows.length);

    const nameOf = new Map(cats.map((c) => [c.id, c.name]));
    const expectedBudgets = buildDemoBudgets({
      today,
      categories: cats,
      transactions: expectedRows,
    })
      .map((b) => ({ name: nameOf.get(b.categoryId), amount: b.amount }))
      .sort((x, y) => (x.name ?? "").localeCompare(y.name ?? ""));
    expect(result.budgets).toBe(5);
    expect(await demoBudgets()).toEqual(expectedBudgets);
  });

  it("can reset the demo again while it has budgets", async () => {
    await seedDemoUser(db, today);
    const first = await demoBudgets();

    const result = await seedDemoUser(db, today);

    expect(result.budgets).toBe(5);
    expect(await demoBudgets()).toEqual(first);
  });
});
