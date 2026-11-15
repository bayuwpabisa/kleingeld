import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/date";
import type { TransactionDto } from "@/schemas/transaction";

import { transactionTitle } from "./transaction-title";

/**
 * The list on wide screens (DESIGN.md, Tabel transaksi): date, note,
 * category and amount, 56px rows. Sorting, row actions and pagination come
 * with the next tasks.
 */
export function TransactionTable({
  transactions,
}: {
  transactions: TransactionDto[];
}) {
  return (
    <table className="w-full table-fixed text-left">
      <caption className="sr-only">Daftar transaksi</caption>
      <thead className="text-sm text-fg-muted">
        <tr>
          <th scope="col" className="w-36 px-5 py-3 font-normal">
            Tanggal
          </th>
          <th scope="col" className="px-5 py-3 font-normal">
            Catatan
          </th>
          <th scope="col" className="w-44 px-5 py-3 font-normal">
            Kategori
          </th>
          <th scope="col" className="w-48 px-5 py-3 text-right font-normal">
            Nominal
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          const title = transactionTitle(transaction);
          return (
            <tr key={transaction.id} className="h-14 border-t border-border">
              <td className="px-5 text-fg-muted">
                {formatDate(transaction.date)}
              </td>
              <td className="px-5">
                <span className="block truncate" title={title}>
                  {title}
                </span>
              </td>
              <td className="px-5">
                <span className="inline-block max-w-full truncate rounded-full border border-border px-3 py-1 text-sm">
                  {transaction.category.name}
                </span>
              </td>
              <td className="px-5 text-right">
                <Money amount={transaction.amount} type={transaction.type} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
