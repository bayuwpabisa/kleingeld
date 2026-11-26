import { monthRange } from "@/features/transactions/periods";
import {
  transactionListQuerySchema,
  type CategoryTotalsQuery,
  type MonthlyTrendQuery,
  type TransactionFilters,
  type TransactionListQuery,
} from "@/schemas/transaction";

// What the dashboard asks for. The server prefetches it and the browser reads
// it with the same values, so both build the same query keys. No server or
// browser imports here: both sides use this file.

/** The summary's filters: the whole month of `today` ("YYYY-MM-DD"). */
export function currentMonthFilters(today: string): TransactionFilters {
  return monthRange(today.slice(0, 7));
}

/** How many months "Tren bulanan" shows: this one and the five before it. */
export const TREND_MONTHS = 6;

/** "Tren bulanan": the month of `today` and the five before it, "YYYY-MM". */
export function trendRange(today: string): MonthlyTrendQuery {
  const [year = 0, month = 1] = today.split("-").map(Number);
  // Date.UTC rolls a month below 0 back into the previous year.
  const first = new Date(Date.UTC(year, month - TREND_MONTHS, 1));
  const firstMonth = String(first.getUTCMonth() + 1).padStart(2, "0");
  return {
    from: `${first.getUTCFullYear()}-${firstMonth}`,
    to: today.slice(0, 7),
  };
}

/** "Per kategori": this month's expense, per category. */
export function monthCategoriesQuery(today: string): CategoryTotalsQuery {
  return { type: "expense", ...currentMonthFilters(today) };
}

/**
 * "Transaksi terbaru": the first five rows of the list in its default order.
 * A full list query, so optimistic changes find it by its key and update it
 * like any other list.
 */
export const RECENT_QUERY: TransactionListQuery =
  transactionListQuerySchema.parse({ pageSize: 5 });
