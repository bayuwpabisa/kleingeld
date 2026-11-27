/**
 * @jest-environment node
 */
import { hydrate, QueryClient } from "@tanstack/react-query";

import { transactions } from "@/db/schema";
import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "@/db/testing/test-db";
import type { BudgetStatus } from "@/schemas/budget";

import { budgetKeys } from "../api/keys";
import { createBudget } from "./budgets-repo";
import { prefetchBudgets } from "./prefetch-budgets";

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

describe("prefetchBudgets", () => {
  it("hands over this month's budgets under the key the page reads", async () => {
    const alice = await createTestUser(db, "alice");
    await createBudget(db, alice.id, {
      categoryId: alice.byName("Makan").id,
      amount: 1_000_000,
    });
    await db.insert(transactions).values([
      {
        userId: alice.id,
        categoryId: alice.byName("Makan").id,
        type: "expense",
        amount: 850_000,
        date: "2026-11-20",
      },
      {
        userId: alice.id,
        categoryId: alice.byName("Makan").id,
        type: "expense",
        amount: 99_000,
        date: "2026-10-31",
      },
    ]);

    const state = await prefetchBudgets(db, alice.id, "2026-11-26");

    const client = new QueryClient();
    hydrate(client, state);
    const data = client.getQueryData<BudgetStatus[]>(
      budgetKeys.month("2026-11"),
    );
    expect(data?.map((b) => [b.category.name, b.amount, b.spent])).toEqual([
      ["Makan", 1_000_000, 850_000],
    ]);
  });

  it("hands over nothing and logs the error when the database fails", async () => {
    const broken = await createTestDb();
    await broken.close();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    const state = await prefetchBudgets(broken, "alice", "2026-11-26");

    expect(state.queries).toStrictEqual([]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toBe("Budget prefetch failed");
    log.mockRestore();
  });
});
