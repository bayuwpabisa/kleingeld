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
import type { TransactionInput } from "@/schemas/transaction";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from "./transactions-repo";

// These run real SQL (PGlite) on purpose: a missing `userId` condition in a
// query would pass a mocked test, but fails here.

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
      page: 2,
      pageSize: 2,
    });
    expect(second).toMatchObject({ page: 2, pageSize: 2, total: 5 });
    expect(second.data.map((t) => t.date)).toEqual([
      "2026-11-03",
      "2026-11-02",
    ]);

    const past = await listTransactions(db, alice.id, { page: 9, pageSize: 2 });
    expect(past.data).toEqual([]);
    expect(past.total).toBe(5);
  });

  it("returns an empty page for a user without transactions", async () => {
    await create(bob);
    expect(
      await listTransactions(db, alice.id, { page: 1, pageSize: 20 }),
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
