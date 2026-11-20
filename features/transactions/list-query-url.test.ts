/**
 * @jest-environment node
 */
import type { TransactionListQuery } from "@/schemas/transaction";

import {
  DEFAULT_LIST_QUERY,
  hasActiveFilters,
  parseListQuery,
  toSearchParams,
} from "./list-query-url";

const CATEGORY = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";

describe("parseListQuery", () => {
  it("gives the default query for an empty URL", () => {
    expect(parseListQuery(new URLSearchParams())).toEqual(DEFAULT_LIST_QUERY);
  });

  it("reads every parameter", () => {
    const params = new URLSearchParams({
      q: "kopi",
      type: "expense",
      category: CATEGORY,
      from: "2026-11-01",
      to: "2026-11-30",
      sort: "amount",
      order: "asc",
      page: "3",
    });
    expect(parseListQuery(params)).toEqual({
      q: "kopi",
      type: "expense",
      category: CATEGORY,
      from: "2026-11-01",
      to: "2026-11-30",
      sort: "amount",
      order: "asc",
      page: 3,
      pageSize: 20,
    });
  });

  it("ignores broken values instead of failing, since URLs are typed by hand", () => {
    const params = new URLSearchParams({
      q: "kopi",
      type: "transfer",
      category: "not-a-uuid",
      from: "2026-13-01",
      sort: "note",
      order: "up",
      page: "abc",
    });
    expect(parseListQuery(params)).toEqual({
      ...DEFAULT_LIST_QUERY,
      q: "kopi",
    });
  });

  it("drops a range that ends before it starts", () => {
    const params = new URLSearchParams({
      from: "2026-11-30",
      to: "2026-11-01",
    });
    expect(parseListQuery(params)).toEqual(DEFAULT_LIST_QUERY);
  });

  it("does not let the URL choose the page size", () => {
    expect(parseListQuery(new URLSearchParams({ pageSize: "100" }))).toEqual(
      DEFAULT_LIST_QUERY,
    );
  });
});

describe("toSearchParams", () => {
  it("writes nothing for the default query", () => {
    expect(toSearchParams(DEFAULT_LIST_QUERY).toString()).toBe("");
  });

  it("writes only what differs from the default, in a fixed order", () => {
    expect(
      toSearchParams({
        ...DEFAULT_LIST_QUERY,
        page: 2,
        type: "expense",
        q: "kopi susu",
      }).toString(),
    ).toBe("q=kopi+susu&type=expense&page=2");
  });

  it("round-trips through the URL", () => {
    const query = {
      q: "kopi",
      type: "income" as const,
      category: CATEGORY,
      from: "2026-10-01",
      to: "2026-10-31",
      sort: "amount" as const,
      order: "asc" as const,
      page: 4,
      pageSize: 20,
    };
    expect(parseListQuery(toSearchParams(query))).toEqual(query);
  });
});

describe("hasActiveFilters", () => {
  it("is false for sort and page only", () => {
    const query: TransactionListQuery = {
      ...DEFAULT_LIST_QUERY,
      sort: "amount",
      page: 3,
    };
    expect(hasActiveFilters(query)).toBe(false);
  });

  it.each([
    { q: "kopi" },
    { type: "expense" as const },
    { category: CATEGORY },
    { from: "2026-11-01" },
    { to: "2026-11-30" },
  ])("is true for %p", (filter) => {
    expect(hasActiveFilters({ ...DEFAULT_LIST_QUERY, ...filter })).toBe(true);
  });
});
