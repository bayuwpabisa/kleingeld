import { useQuery } from "@tanstack/react-query";

import type { MonthlyTrendQuery } from "@/schemas/transaction";

import { fetchMonthlyTrend } from "./fetch-transactions";
import { transactionKeys } from "./keys";

/**
 * Income and expense per month of the range, one entry per month. After a
 * change it is refetched with everything under `transactionKeys.all`.
 */
export function useMonthlyTrend(query: MonthlyTrendQuery) {
  return useQuery({
    queryKey: transactionKeys.trend(query),
    queryFn: ({ signal }) => fetchMonthlyTrend(query, signal),
  });
}
