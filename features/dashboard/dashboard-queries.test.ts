import {
  listQueryFromKey,
  transactionKeys,
} from "@/features/transactions/api/keys";
import { transactionListQuerySchema } from "@/schemas/transaction";

import { currentMonthFilters, RECENT_QUERY } from "./dashboard-queries";

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
