import type { TransactionDto } from "@/schemas/transaction";

export type DateGroup = { date: string; items: TransactionDto[] };

/**
 * Consecutive transactions of the same date, in the order given, for the day
 * headings of the phone list. Only for a list sorted by date: in any other
 * order one date can come back several times, and then two groups would have
 * the same date (and the same React key and heading id).
 */
export function groupByDate(transactions: TransactionDto[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const transaction of transactions) {
    const last = groups.at(-1);
    if (last?.date === transaction.date) last.items.push(transaction);
    else groups.push({ date: transaction.date, items: [transaction] });
  }
  return groups;
}
