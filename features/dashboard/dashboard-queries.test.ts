import {
  listQueryFromKey,
  transactionKeys,
} from "@/features/transactions/api/keys";
import {
  categoryTotalsQuerySchema,
  monthlyTrendQuerySchema,
  transactionListQuerySchema,
} from "@/schemas/transaction";

import {
  currentMonthFilters,
  monthCategoriesQuery,
  RECENT_QUERY,
  trendRange,
} from "./dashboard-queries";

describe("trendRange", () => {
  it("is this month and the five before it", () => {
    expect(trendRange("2026-11-23")).toStrictEqual({
      from: "2026-06",
      to: "2026-11",
    });
  });

  it("starts in the previous year early in the year", () => {
    expect(trendRange("2027-01-01")).toStrictEqual({
      from: "2026-08",
      to: "2027-01",
    });
    expect(trendRange("2027-05-31")).toStrictEqual({
      from: "2026-12",
      to: "2027-05",
    });
  });

  it("stays in one year from June to December", () => {
    expect(trendRange("2026-06-15")).toStrictEqual({
      from: "2026-01",
      to: "2026-06",
    });
    expect(trendRange("2026-12-31")).toStrictEqual({
      from: "2026-07",
      to: "2026-12",
    });
  });

  it("is a range the API accepts, unchanged", () => {
    const range = trendRange("2026-11-23");
    expect(monthlyTrendQuerySchema.parse(range)).toStrictEqual(range);
  });
});

describe("monthCategoriesQuery", () => {
  it("is this month's expense", () => {
    expect(monthCategoriesQuery("2026-11-23")).toStrictEqual({
      type: "expense",
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("is a query the API accepts, unchanged", () => {
    const query = monthCategoriesQuery("2026-11-23");
    expect(categoryTotalsQuerySchema.parse(query)).toStrictEqual(query);
  });
});

describe("currentMonthFilters", () => {
  it("covers the whole month of today", () => {
    expect(currentMonthFilters("2026-11-22")).toStrictEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("ends February on the 28th, or the 29th in a leap year", () => {
    expect(currentMonthFilters("2026-02-10")).toStrictEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(currentMonthFilters("2028-02-10")).toStrictEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("stays in the same year on the last day of December", () => {
    expect(currentMonthFilters("2026-12-31")).toStrictEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });
});

describe("RECENT_QUERY", () => {
  it("is the first five transactions, newest first", () => {
    expect(RECENT_QUERY).toStrictEqual(
      transactionListQuerySchema.parse({ pageSize: 5 }),
    );
    expect(RECENT_QUERY).toMatchObject({
      page: 1,
      pageSize: 5,
      sort: "date",
      order: "desc",
    });
  });

  it("reads back from its list key, so optimistic changes reach it", () => {
    expect(listQueryFromKey(transactionKeys.list(RECENT_QUERY))).toStrictEqual(
      RECENT_QUERY,
    );
  });
});
