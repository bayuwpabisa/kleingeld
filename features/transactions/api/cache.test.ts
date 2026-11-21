import type { InfiniteData } from "@tanstack/react-query";

import type {
  TransactionDto,
  TransactionListQuery,
  TransactionPage,
} from "@/schemas/transaction";

import { DEFAULT_LIST_QUERY } from "../list-query-url";
import {
  insertTransaction,
  matchesFilters,
  removeTransaction,
  replaceTransaction,
  sortTransactions,
  updateCachedList,
} from "./cache";

const MAKAN = { id: "c-makan", name: "Makan", icon: "utensils" };
const GAJI = { id: "c-gaji", name: "Gaji", icon: "wallet" };

function t(
  id: string,
  date: string,
  extra: Partial<TransactionDto> = {},
): TransactionDto {
  const createdAt = extra.createdAt ?? "2026-11-01T00:00:00.000Z";
  return {
    id,
    date,
    type: "expense",
    amount: 1,
    note: null,
    category: MAKAN,
    createdAt,
    updatedAt: createdAt,
    ...extra,
  };
}

function page(data: TransactionDto[], extra: Partial<TransactionPage> = {}) {
  return { data, page: 1, pageSize: 3, total: data.length, ...extra };
}

const query = (extra: Partial<TransactionListQuery> = {}) => ({
  ...DEFAULT_LIST_QUERY,
  ...extra,
});

const ids = (p: TransactionPage) => p.data.map((x) => x.id);

describe("matchesFilters", () => {
  const row = t("a", "2026-11-10", { note: "Kopi Susu", amount: 28_000 });

  it("matches without filters", () => {
    expect(matchesFilters(row, {})).toBe(true);
  });

  it("searches the note and the category name, ignoring case", () => {
    expect(matchesFilters(row, { q: "kopi" })).toBe(true);
    expect(matchesFilters(row, { q: "MAKAN" })).toBe(true);
    expect(matchesFilters(row, { q: "teh" })).toBe(false);
  });

  it("checks type, category and both ends of the range", () => {
    expect(matchesFilters(row, { type: "expense" })).toBe(true);
    expect(matchesFilters(row, { type: "income" })).toBe(false);
    expect(matchesFilters(row, { category: MAKAN.id })).toBe(true);
    expect(matchesFilters(row, { category: GAJI.id })).toBe(false);
    expect(matchesFilters(row, { from: "2026-11-10", to: "2026-11-10" })).toBe(
      true,
    );
    expect(matchesFilters(row, { from: "2026-11-11" })).toBe(false);
    expect(matchesFilters(row, { to: "2026-11-09" })).toBe(false);
  });
});

describe("sortTransactions", () => {
  it("orders like the API by default: newest date, newest entry, then id", () => {
    const sorted = sortTransactions(
      [
        t("a", "2026-11-01"),
        t("b", "2026-11-03"),
        t("c", "2026-11-03", { createdAt: "2026-11-03T10:00:00.000Z" }),
      ],
      query(),
    );
    expect(sorted.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("orders oldest first, the first entry of a day first", () => {
    const sorted = sortTransactions(
      [
        t("a", "2026-11-03", { createdAt: "2026-11-03T10:00:00.000Z" }),
        t("b", "2026-11-03"),
        t("c", "2026-11-01"),
      ],
      query({ order: "asc" }),
    );
    expect(sorted.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("orders by amount, newest first among equal amounts", () => {
    const rows = [
      t("small", "2026-11-05", { amount: 10 }),
      t("big-old", "2026-11-01", { amount: 500 }),
      t("big-new", "2026-11-04", { amount: 500 }),
    ];
    expect(
      sortTransactions(rows, query({ sort: "amount" })).map((x) => x.id),
    ).toEqual(["big-new", "big-old", "small"]);
    expect(
      sortTransactions(rows, query({ sort: "amount", order: "asc" })).map(
        (x) => x.id,
      ),
    ).toEqual(["small", "big-new", "big-old"]);
  });
});

describe("insertTransaction", () => {
  it("puts a new transaction in order on the first page and counts it", () => {
    const result = insertTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-01")]),
      t("new", "2026-11-03"),
      query(),
    );
    expect(ids(result)).toEqual(["a", "new", "b"]);
    expect(result.total).toBe(3);
  });

  it("follows the list's sort", () => {
    const result = insertTransaction(
      page([
        t("a", "2026-11-05", { amount: 900 }),
        t("b", "2026-11-01", { amount: 5 }),
      ]),
      t("new", "2026-11-09", { amount: 50 }),
      query({ sort: "amount" }),
    );
    expect(ids(result)).toEqual(["a", "new", "b"]);
  });

  it("keeps the page size, dropping the last row", () => {
    const result = insertTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-04"), t("c", "2026-11-03")]),
      t("new", "2026-11-06"),
      query(),
    );
    expect(ids(result)).toEqual(["new", "a", "b"]);
    expect(result.total).toBe(4);
  });

  it("only counts it on later pages, whose rows it cannot place", () => {
    const later = page([t("a", "2026-10-01")], { page: 2, total: 4 });
    const result = insertTransaction(later, t("new", "2026-11-06"), query());
    expect(ids(result)).toEqual(["a"]);
    expect(result.total).toBe(5);
  });

  it("leaves a list whose filters it does not match alone", () => {
    const incomeOnly = page([
      t("g", "2026-11-25", { type: "income", category: GAJI }),
    ]);
    expect(
      insertTransaction(
        incomeOnly,
        t("new", "2026-11-06"),
        query({ type: "income" }),
      ),
    ).toBe(incomeOnly);
  });
});

describe("replaceTransaction", () => {
  it("swaps the transaction and re-sorts when its date changed", () => {
    const result = replaceTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-01")]),
      t("b", "2026-11-09"),
      query(),
    );
    expect(ids(result)).toEqual(["b", "a"]);
    expect(result.total).toBe(2);
  });

  it("drops a transaction that no longer matches the list's filters", () => {
    const makanOnly = page([t("a", "2026-11-05"), t("b", "2026-11-01")]);
    const result = replaceTransaction(
      makanOnly,
      t("b", "2026-11-01", { category: GAJI, type: "income" }),
      query({ category: MAKAN.id }),
    );
    expect(ids(result)).toEqual(["a"]);
    expect(result.total).toBe(1);
  });

  it("leaves a page without it alone", () => {
    const original = page([t("a", "2026-11-05")]);
    expect(replaceTransaction(original, t("x", "2026-11-09"), query())).toBe(
      original,
    );
  });
});

describe("removeTransaction", () => {
  it("drops the transaction and the count", () => {
    const result = removeTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-01")]),
      "a",
    );
    expect(ids(result)).toEqual(["b"]);
    expect(result.total).toBe(1);
  });

  it("leaves a page without it alone", () => {
    const original = page([t("a", "2026-11-05")]);
    expect(removeTransaction(original, "x")).toBe(original);
  });
});

describe("updateCachedList", () => {
  const infinite = (
    pages: TransactionPage[],
  ): InfiniteData<TransactionPage, number> => ({
    pages,
    pageParams: pages.map((p) => p.page),
  });

  it("updates a paged list as one page", () => {
    const result = updateCachedList(page([t("a", "2026-11-05")]), (p) =>
      insertTransaction(p, t("new", "2026-11-06"), query()),
    );
    expect(result && "data" in result && ids(result)).toEqual(["new", "a"]);
  });

  it("updates loaded pages of a phone list as one list, without dropping rows", () => {
    const loaded = infinite([
      page([t("a", "2026-11-05"), t("b", "2026-11-04")], {
        pageSize: 2,
        total: 3,
      }),
      page([t("c", "2026-11-03")], { page: 2, pageSize: 2, total: 3 }),
    ]);

    const result = updateCachedList(loaded, (p) =>
      insertTransaction(p, t("new", "2026-11-06"), query()),
    );

    expect(result && "pages" in result).toBe(true);
    if (!result || !("pages" in result)) return;
    expect(result.pages.flatMap(ids)).toEqual(["new", "a", "b", "c"]);
    expect(result.pages.map((p) => p.total)).toEqual([4, 4]);
    // Page numbers stay, so "Muat lebih banyak" and refetches still work.
    expect(result.pages.map((p) => p.page)).toEqual([1, 2]);
    expect(result.pageParams).toEqual([1, 2]);
  });

  it("keeps every page's total the same after a delete", () => {
    const loaded = infinite([
      page([t("a", "2026-11-05"), t("b", "2026-11-04")], {
        pageSize: 2,
        total: 3,
      }),
      page([t("c", "2026-11-03")], { page: 2, pageSize: 2, total: 3 }),
    ]);

    const result = updateCachedList(loaded, (p) => removeTransaction(p, "c"));

    if (!result || !("pages" in result)) throw new Error("not infinite");
    expect(result.pages.flatMap(ids)).toEqual(["a", "b"]);
    expect(result.pages.map((p) => p.total)).toEqual([2, 2]);
  });

  it("leaves an empty cache entry alone", () => {
    expect(updateCachedList(undefined, (p) => p)).toBeUndefined();
  });
});
