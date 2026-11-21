import type { TransactionDto } from "@/schemas/transaction";

/** A row's title: the note, or the category name when there is no note. */
export function transactionTitle(transaction: TransactionDto): string {
  return transaction.note ?? transaction.category.name;
}
