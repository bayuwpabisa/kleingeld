/**
 * @jest-environment node
 */
import { hydrate, QueryClient } from "@tanstack/react-query";

import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "@/db/testing/test-db";
import { transactionKeys } from "@/features/transactions/api/keys";
import { createTransaction } from "@/features/transactions/server/transactions-repo";
import type {
  CategoryTotal,
  MonthlyTotal,
  TransactionInput,
  TransactionPage,
  TransactionSummary,
} from "@/schemas/transaction";

import {
  prefetchMonthCategories,
  prefetchMonthlyTrend,
  prefetchMonthSummary,
  prefetchRecentTransactions,
} from "./prefetch-dashboard";

// The dashboard hands server data to the browser's query cache. It only
// works when the server writes it under the key the client hooks read, so
// these tests read the result back with keys spelled out as the client
// builds them.

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

async function create(
  user: typeof alice,
  overrides: Partial<TransactionInput> = {},
) {
  const result = await createTransaction(db, user.id, {
    type: "expense",
    categoryId: user.byName("Makan").id,
    amount: 25_000,
    date: "2026-11-10",
    note: null,
    ...overrides,
  });
  if (!result.ok) throw new Error(`create failed: ${result.reason}`);
  return result.data;
}

/** What the browser's cache holds after hydrating the server's state. */
function hydrated(state: Parameters<typeof hydrate>[1]) {
  const client = new QueryClient();
  hydrate(client, state);
  return client;
}

describe("prefetchMonthSummary", () => {
  it("puts this month's totals under the summary key of the month", async () => {
    await create(alice, { amount: 25_000, date: "2026-11-10" });
    await create(alice, { amount: 40_000, date: "2026-11-30" });
    // Outside the month on both sides.
    await create(alice, { amount: 1_000, date: "2026-10-31" });
    await create(alice, { amount: 2_000, date: "2026-12-01" });
    await create(alice, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
      amount: 8_000_000,
      date: "2026-10-25",
    });
    // Another user's row in the same month.
    await create(bob, { amount: 99_000, date: "2026-11-15" });

    const state = await prefetchMonthSummary(db, alice.id, "2026-11-22");

    expect(state.queries).toHaveLength(1);
    const cache = hydrated(state);
    expect(
      cache.getQueryData<TransactionSummary>(
        transactionKeys.summary({ from: "2026-11-01", to: "2026-11-30" }),
      ),
    ).toStrictEqual({
      income: { total: 0, count: 0 },
      expense: { total: 65_000, count: 2 },
      balance: -65_000,
    });
  });
});

describe("prefetchRecentTransactions", () => {
  it("puts the five newest rows under the key of the five-row list", async () => {
    const dates = [
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ];
    for (const date of dates) await create(alice, { date, note: date });
    await create(bob, { date: "2026-11-20", note: "bob" });

    const state = await prefetchRecentTransactions(db, alice.id);

    expect(state.queries).toHaveLength(1);
    const page = hydrated(state).getQueryData<TransactionPage>(
      transactionKeys.list({
        page: 1,
        pageSize: 5,
        sort: "date",
        order: "desc",
      }),
    );
    expect(page).toMatchObject({ page: 1, pageSize: 5, total: 6 });
    expect(page?.data.map((t) => t.note)).toStrictEqual([
      "2026-11-06",
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
    ]);
  });
});

describe("prefetchMonthlyTrend", () => {
  it("puts six months of totals under the trend key of those months", async () => {
    await create(alice, { amount: 30_000, date: "2026-06-01" });
    await create(alice, { amount: 45_000, date: "2026-11-23" });
    await create(alice, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
      amount: 8_500_000,
      date: "2026-10-25",
    });
    // A month too early, and another user's row.
    await create(alice, { amount: 1_000, date: "2026-05-31" });
    await create(bob, { amount: 99_000, date: "2026-11-15" });

    const state = await prefetchMonthlyTrend(db, alice.id, "2026-11-23");

    expect(state.queries).toHaveLength(1);
    expect(
      hydrated(state).getQueryData<MonthlyTotal[]>(
        transactionKeys.trend({ from: "2026-06", to: "2026-11" }),
      ),
    ).toStrictEqual([
      { month: "2026-06", income: 0, expense: 30_000 },
      { month: "2026-07", income: 0, expense: 0 },
      { month: "2026-08", income: 0, expense: 0 },
      { month: "2026-09", income: 0, expense: 0 },
      { month: "2026-10", income: 8_500_000, expense: 0 },
      { month: "2026-11", income: 0, expense: 45_000 },
    ]);
  });
});

describe("prefetchMonthCategories", () => {
  it("puts this month's expense per category under its key", async () => {
    await create(alice, { amount: 25_000, date: "2026-11-01" });
    await create(alice, {
      amount: 60_000,
      date: "2026-11-30",
      categoryId: alice.byName("Transport").id,
    });
    // Last month, income, and another user's row.
    await create(alice, { amount: 500_000, date: "2026-10-31" });
    await create(alice, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
      amount: 8_500_000,
      date: "2026-11-25",
    });
    await create(bob, { amount: 99_000, date: "2026-11-15" });

    const state = await prefetchMonthCategories(db, alice.id, "2026-11-23");

    expect(state.queries).toHaveLength(1);
    const totals = hydrated(state).getQueryData<CategoryTotal[]>(
      transactionKeys.byCategory({
        type: "expense",
        from: "2026-11-01",
        to: "2026-11-30",
      }),
    );
    expect(totals?.map((t) => [t.category.name, t.total])).toStrictEqual([
      ["Transport", 60_000],
      ["Makan", 25_000],
    ]);
  });
});

describe("when the database fails", () => {
  let broken: TestDb;

  beforeAll(async () => {
    broken = await createTestDb();
    await broken.close();
  });

  // Nothing is handed over, so the browser loads the data itself and shows
  // its own error state with "Coba lagi". No retries: the page must not wait.
  it.each([
    ["summary", () => prefetchMonthSummary(broken, "alice", "2026-11-22")],
    ["recent transactions", () => prefetchRecentTransactions(broken, "alice")],
    ["trend", () => prefetchMonthlyTrend(broken, "alice", "2026-11-22")],
    [
      "categories",
      () => prefetchMonthCategories(broken, "alice", "2026-11-22"),
    ],
  ])("hands over no %s and logs the error", async (_name, prefetch) => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    const state = await prefetch();

    expect(state.queries).toStrictEqual([]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toBe("Dashboard prefetch failed");
    log.mockRestore();
  });
});
