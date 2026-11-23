import { QueryClient } from "@tanstack/react-query";

import { transactionKeys } from "./keys";

// The charts' data sits under `transactionKeys.all`, so the refetch every
// mutation does (invalidate `all`) keeps them up to date; and outside
// `lists()`, so the optimistic list updates never touch them.

const trendKey = transactionKeys.trend({ from: "2026-06", to: "2026-11" });
const byCategoryKey = transactionKeys.byCategory({
  type: "expense",
  from: "2026-11-01",
  to: "2026-11-30",
});

function cacheWithCharts() {
  const client = new QueryClient();
  client.setQueryData(trendKey, []);
  client.setQueryData(byCategoryKey, []);
  return client;
}

describe("chart keys", () => {
  it("are refetched with everything else after a change", async () => {
    const client = cacheWithCharts();

    await client.invalidateQueries({ queryKey: transactionKeys.all });

    expect(client.getQueryState(trendKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(byCategoryKey)?.isInvalidated).toBe(true);
  });

  it("are not lists, so optimistic list updates leave them alone", async () => {
    const client = cacheWithCharts();

    await client.invalidateQueries({ queryKey: transactionKeys.lists() });

    expect(client.getQueryState(trendKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(byCategoryKey)?.isInvalidated).toBe(false);
    expect(
      client.getQueriesData({ queryKey: transactionKeys.lists() }),
    ).toStrictEqual([]);
  });

  it("keep each range and type apart", () => {
    expect(trendKey).toStrictEqual([
      "transactions",
      "trend",
      { from: "2026-06", to: "2026-11" },
    ]);
    expect(byCategoryKey).toStrictEqual([
      "transactions",
      "by-category",
      { type: "expense", from: "2026-11-01", to: "2026-11-30" },
    ]);
  });
});
