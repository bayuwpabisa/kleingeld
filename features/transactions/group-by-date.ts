import type { TransactionDto } from "@/schemas/transaction";

export type DateGroup = { date: string; items: TransactionDto[] };

/**
 * Consecutive transactions of the same date, in the order given (the API
 * sends newest first), for the day headings of the phone list.
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
