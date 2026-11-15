import type { TransactionDto, TransactionPage } from "@/schemas/transaction";

import {
  insertTransaction,
  removeTransaction,
  replaceTransaction,
  sortTransactions,
} from "./cache";

function t(id: string, date: string, createdAt = "2026-11-01T00:00:00.000Z") {
  return {
    id,
    date,
    createdAt,
    type: "expense",
    amount: 1,
    note: null,
    category: { id: "c", name: "Makan", icon: "utensils" },
    updatedAt: createdAt,
  } satisfies TransactionDto;
}

function page(data: TransactionDto[], extra: Partial<TransactionPage> = {}) {
  return { data, page: 1, pageSize: 3, total: data.length, ...extra };
}

const ids = (p: TransactionPage) => p.data.map((x) => x.id);

describe("sortTransactions", () => {
  it("orders like the API: newest date, then newest entry, then id", () => {
    const sorted = sortTransactions([
      t("a", "2026-11-01"),
      t("b", "2026-11-03"),
      t("c", "2026-11-03", "2026-11-03T10:00:00.000Z"),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
});

describe("insertTransaction", () => {
  it("puts a new transaction in date order on the first page and counts it", () => {
    const result = insertTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-01")]),
      t("new", "2026-11-03"),
    );
    expect(ids(result)).toEqual(["a", "new", "b"]);
    expect(result.total).toBe(3);
  });

  it("keeps the page size, dropping the last row", () => {
    const result = insertTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-04"), t("c", "2026-11-03")]),
      t("new", "2026-11-06"),
    );
    expect(ids(result)).toEqual(["new", "a", "b"]);
    expect(result.total).toBe(4);
  });

  it("only counts it on later pages, whose rows it cannot place", () => {
    const later = page([t("a", "2026-10-01")], { page: 2, total: 4 });
    const result = insertTransaction(later, t("new", "2026-11-06"));
    expect(ids(result)).toEqual(["a"]);
    expect(result.total).toBe(5);
  });
});

describe("replaceTransaction", () => {
  it("swaps the transaction and re-sorts when its date changed", () => {
    const result = replaceTransaction(
      page([t("a", "2026-11-05"), t("b", "2026-11-01")]),
      t("b", "2026-11-09"),
    );
    expect(ids(result)).toEqual(["b", "a"]);
    expect(result.total).toBe(2);
  });

  it("leaves a page without it alone", () => {
    const original = page([t("a", "2026-11-05")]);
    expect(replaceTransaction(original, t("x", "2026-11-09"))).toBe(original);
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
