/**
 * @jest-environment node
 */
import { eq } from "drizzle-orm";

import { categories, transactions } from "@/db/schema";
import {
  createTestDb,
  createTestUser,
  resetTestDb,
  type TestDb,
} from "@/db/testing/test-db";
import type {
  TransactionInput,
  TransactionListQuery,
} from "@/schemas/transaction";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  summarizeTransactions,
  updateTransaction,
} from "./transactions-repo";

// These run real SQL (PGlite) on purpose: a missing `userId` condition in a
// query would pass a mocked test, but fails here.

/** The default order of the list. */
const NEWEST = { sort: "date", order: "desc" } as const;

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

function expense(
  user: typeof alice,
  overrides: Partial<TransactionInput> = {},
): TransactionInput {
  return {
    type: "expense",
    categoryId: user.byName("Makan").id,
    amount: 25_000,
    date: "2026-11-11",
    note: "Makan siang",
    ...overrides,
  };
}

async function create(
  user: typeof alice,
  overrides?: Partial<TransactionInput>,
) {
  const result = await createTransaction(db, user.id, expense(user, overrides));
  if (!result.ok) throw new Error(`create failed: ${result.reason}`);
  return result.data;
}

async function rowById(id: string) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));
  return row;
}

describe("createTransaction", () => {
  it("creates a transaction for the user and returns it with its category", async () => {
    const created = await create(alice);

    expect(created).toEqual({
      id: expect.any(String),
      type: "expense",
      amount: 25_000,
      date: "2026-11-11",
      note: "Makan siang",
      category: {
        id: alice.byName("Makan").id,
        name: "Makan",
        icon: "utensils",
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    expect((await rowById(created.id))?.userId).toBe("alice");
  });

  it("stores a missing note as null", async () => {
    const result = await createTransaction(db, alice.id, {
      ...expense(alice),
      note: undefined,
    });
    expect(result.ok && result.data.note).toBeNull();
  });

  it("refuses a category of another user", async () => {
    const result = await createTransaction(
      db,
      alice.id,
      expense(alice, { categoryId: bob.byName("Makan").id }),
    );
    expect(result).toEqual({ ok: false, reason: "category_not_found" });
    expect(await db.select().from(transactions)).toHaveLength(0);
  });

  it("refuses a category of the other type", async () => {
    const result = await createTransaction(
      db,
      alice.id,
      expense(alice, { type: "income" }),
    );
    expect(result).toEqual({ ok: false, reason: "category_type_mismatch" });
  });
});

describe("listTransactions", () => {
  it("lists only the user's own transactions, newest first", async () => {
    const older = await create(alice, { date: "2026-11-01" });
    const newer = await create(alice, { date: "2026-11-10" });
    const sameDayLater = await create(alice, { date: "2026-11-10" });
    await create(bob);

    const page = await listTransactions(db, alice.id, {
      ...NEWEST,
      page: 1,
      pageSize: 20,
    });

    expect(page.total).toBe(3);
    expect(page.data.map((t) => t.id)).toEqual([
      sameDayLater.id,
      newer.id,
      older.id,
    ]);
  });

  it("pages through the results", async () => {
    for (let day = 1; day <= 5; day += 1) {
      await create(alice, { date: `2026-11-0${day}` });
    }

    const second = await listTransactions(db, alice.id, {
      ...NEWEST,
      page: 2,
      pageSize: 2,
    });
    expect(second).toMatchObject({ page: 2, pageSize: 2, total: 5 });
    expect(second.data.map((t) => t.date)).toEqual([
      "2026-11-03",
      "2026-11-02",
    ]);

    const past = await listTransactions(db, alice.id, {
      ...NEWEST,
      page: 9,
      pageSize: 2,
    });
    expect(past.data).toEqual([]);
    expect(past.total).toBe(5);
  });

  it("returns an empty page for a user without transactions", async () => {
    await create(bob);
    expect(
      await listTransactions(db, alice.id, {
        ...NEWEST,
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({ data: [], page: 1, pageSize: 20, total: 0 });
  });
});

describe("getTransaction", () => {
  it("returns the user's own transaction", async () => {
    const created = await create(alice);
    expect(await getTransaction(db, alice.id, created.id)).toEqual(created);
  });

  it("does not return another user's transaction", async () => {
    const bobs = await create(bob);
    expect(await getTransaction(db, alice.id, bobs.id)).toBeNull();
  });
});

describe("updateTransaction", () => {
  it("changes only the given fields", async () => {
    const created = await create(alice);

    const result = await updateTransaction(db, alice.id, created.id, {
      amount: 30_000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      amount: 30_000,
      note: "Makan siang",
      date: "2026-11-11",
    });
    expect(new Date(result.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
  });

  it("clears the note with null", async () => {
    const created = await create(alice);
    const result = await updateTransaction(db, alice.id, created.id, {
      note: null,
    });
    expect(result.ok && result.data.note).toBeNull();
  });

  it("does not change another user's transaction", async () => {
    const bobs = await create(bob);

    const result = await updateTransaction(db, alice.id, bobs.id, {
      amount: 1,
    });

    expect(result).toEqual({ ok: false, reason: "not_found" });
    expect((await rowById(bobs.id))?.amount).toBe(25_000);
  });

  it("refuses moving a transaction to another user's category", async () => {
    const created = await create(alice);
    const result = await updateTransaction(db, alice.id, created.id, {
      categoryId: bob.byName("Transport").id,
    });
    expect(result).toEqual({ ok: false, reason: "category_not_found" });
    expect((await rowById(created.id))?.categoryId).toBe(
      alice.byName("Makan").id,
    );
  });

  it("checks the new type against the current category", async () => {
    const created = await create(alice);
    const result = await updateTransaction(db, alice.id, created.id, {
      type: "income",
    });
    expect(result).toEqual({ ok: false, reason: "category_type_mismatch" });
  });

  it("accepts a new type together with a matching category", async () => {
    const created = await create(alice);
    const result = await updateTransaction(db, alice.id, created.id, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
    });
    expect(result.ok && result.data.category.name).toBe("Gaji");
  });
});

describe("deleteTransaction", () => {
  it("deletes the user's own transaction and keeps the category", async () => {
    const created = await create(alice);

    expect(await deleteTransaction(db, alice.id, created.id)).toBe(true);

    expect(await rowById(created.id)).toBeUndefined();
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, alice.byName("Makan").id));
    expect(category).toBeDefined();
  });

  it("does not delete another user's transaction", async () => {
    const bobs = await create(bob);

    expect(await deleteTransaction(db, alice.id, bobs.id)).toBe(false);
    expect(await rowById(bobs.id)).toBeDefined();
  });
});

describe("listTransactions with filters and sort", () => {
  const all = { ...NEWEST, page: 1, pageSize: 20 };

  async function notes(query: Partial<TransactionListQuery>) {
    const page = await listTransactions(db, alice.id, { ...all, ...query });
    return page.data.map((t) => t.note ?? `(${t.category.name})`);
  }

  beforeEach(async () => {
    await create(alice, {
      note: "Kopi susu",
      date: "2026-10-31",
      amount: 28_000,
    });
    await create(alice, {
      note: "Makan siang",
      date: "2026-11-01",
      amount: 35_000,
    });
    await create(alice, {
      note: null,
      categoryId: alice.byName("Transport").id,
      date: "2026-11-02",
      amount: 50_000,
    });
    await create(alice, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
      note: "Gaji November",
      date: "2026-11-25",
      amount: 8_500_000,
    });
    await create(alice, {
      note: "Diskon 50% kopi_kenangan",
      date: "2026-11-03",
      amount: 20_000,
    });
    // Bob's coffee must never show up in Alice's results.
    await create(bob, { note: "Kopi bob", date: "2026-11-01" });
  });

  it("searches the note, ignoring case", async () => {
    expect(await notes({ q: "KOPI" })).toEqual([
      "Diskon 50% kopi_kenangan",
      "Kopi susu",
    ]);
  });

  it("searches the category name, for rows without a note", async () => {
    expect(await notes({ q: "trans" })).toEqual(["(Transport)"]);
  });

  it("treats % and _ as plain characters", async () => {
    expect(await notes({ q: "50%" })).toEqual(["Diskon 50% kopi_kenangan"]);
    // Unescaped, "_" would match the space in "Makan siang".
    expect(await notes({ q: "makan_siang" })).toEqual([]);
    expect(await notes({ q: "%" })).toEqual(["Diskon 50% kopi_kenangan"]);
  });

  it("treats a backslash as a plain character", async () => {
    // Unescaped, "\a" would mean a plain "a" and find most rows; escaped,
    // it looks for a backslash followed by "a", which no note has.
    expect(await notes({ q: "\\a" })).toEqual([]);
  });

  it("filters by type and category", async () => {
    expect(await notes({ type: "income" })).toEqual(["Gaji November"]);
    expect(await notes({ category: alice.byName("Transport").id })).toEqual([
      "(Transport)",
    ]);
  });

  it("does not show anything for a category of another user", async () => {
    expect(await notes({ category: bob.byName("Makan").id })).toEqual([]);
  });

  it("filters by a date range, including both ends", async () => {
    expect(await notes({ from: "2026-11-01", to: "2026-11-02" })).toEqual([
      "(Transport)",
      "Makan siang",
    ]);
    expect(await notes({ from: "2026-11-03" })).toEqual([
      "Gaji November",
      "Diskon 50% kopi_kenangan",
    ]);
    expect(await notes({ to: "2026-10-31" })).toEqual(["Kopi susu"]);
  });

  it("counts only the matching rows", async () => {
    const page = await listTransactions(db, alice.id, {
      ...all,
      q: "kopi",
      pageSize: 1,
    });
    expect(page.total).toBe(2);
    expect(page.data).toHaveLength(1);
  });

  it("sorts by date or amount in both directions", async () => {
    expect(await notes({ order: "asc" })).toEqual([
      "Kopi susu",
      "Makan siang",
      "(Transport)",
      "Diskon 50% kopi_kenangan",
      "Gaji November",
    ]);
    expect(await notes({ sort: "amount" })).toEqual([
      "Gaji November",
      "(Transport)",
      "Makan siang",
      "Kopi susu",
      "Diskon 50% kopi_kenangan",
    ]);
    expect(await notes({ sort: "amount", order: "asc" })).toEqual([
      "Diskon 50% kopi_kenangan",
      "Kopi susu",
      "Makan siang",
      "(Transport)",
      "Gaji November",
    ]);
  });

  it("keeps equal amounts in a stable order, so pages never overlap", async () => {
    await resetTestDb(db);
    alice = await createTestUser(db, "alice");
    for (let day = 1; day <= 5; day += 1) {
      await create(alice, { date: `2026-11-0${day}`, amount: 10_000 });
    }
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        listTransactions(db, alice.id, {
          ...all,
          sort: "amount",
          page,
          pageSize: 2,
        }),
      ),
    );
    const dates = pages.flatMap((p) => p.data.map((t) => t.date));
    expect(dates).toEqual([
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
      "2026-11-01",
    ]);
  });
});

describe("summarizeTransactions", () => {
  it("adds up income and expense of the user's matching transactions", async () => {
    await create(alice, { amount: 35_000, date: "2026-11-01" });
    await create(alice, { amount: 15_000, date: "2026-11-02" });
    await create(alice, { amount: 99_000, date: "2026-10-01" });
    await create(alice, {
      type: "income",
      categoryId: alice.byName("Gaji").id,
      amount: 8_500_000,
      date: "2026-11-25",
    });
    await create(bob, { amount: 1_000_000, date: "2026-11-01" });

    expect(
      await summarizeTransactions(db, alice.id, {
        from: "2026-11-01",
        to: "2026-11-30",
      }),
    ).toEqual({
      income: { total: 8_500_000, count: 1 },
      expense: { total: 50_000, count: 2 },
      balance: 8_450_000,
    });
  });

  it("uses the same filters as the list", async () => {
    await create(alice, { note: "Kopi", amount: 28_000 });
    await create(alice, { note: "Makan siang", amount: 35_000 });

    expect(await summarizeTransactions(db, alice.id, { q: "kopi" })).toEqual({
      income: { total: 0, count: 0 },
      expense: { total: 28_000, count: 1 },
      balance: -28_000,
    });
  });

  it("is all zero without transactions", async () => {
    await create(bob);
    expect(await summarizeTransactions(db, alice.id, {})).toEqual({
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
      balance: 0,
    });
  });
});
