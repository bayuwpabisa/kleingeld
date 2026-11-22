import { monthRange } from "@/features/transactions/periods";
import {
  transactionListQuerySchema,
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

/**
 * "Transaksi terbaru": the first five rows of the list in its default order.
 * A full list query, so optimistic changes find it by its key and update it
 * like any other list.
 */
export const RECENT_QUERY: TransactionListQuery =
  transactionListQuerySchema.parse({ pageSize: 5 });
