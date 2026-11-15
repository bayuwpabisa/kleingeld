"use client";

import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/date";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  deleteRequested,
  editorOpened,
} from "@/lib/store/transaction-editor-slice";
import type { TransactionDto } from "@/schemas/transaction";

import { transactionTitle } from "./transaction-title";

/**
 * The list on wide screens (DESIGN.md, Tabel transaksi): date, note,
 * category, amount and the row actions, 56px rows. Ubah and Hapus open the
 * dialogs of app/(app)/layout.tsx. A row still being saved has no id on the
 * server yet, so its actions wait. Sorting and pagination come on 14 Nov.
 */
export function TransactionTable({
  transactions,
}: {
  transactions: TransactionDto[];
}) {
  const dispatch = useAppDispatch();

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
          <th scope="col" className="w-40 px-5 py-3 text-right font-normal">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          const title = transactionTitle(transaction);
          const saving = transaction.id.startsWith("optimistic-");
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
              <td className="px-3 text-right whitespace-nowrap">
                <Button
                  variant="quiet"
                  size="sm"
                  disabled={saving}
                  aria-label={`Ubah ${title}`}
                  onClick={() =>
                    dispatch(editorOpened({ mode: "edit", id: transaction.id }))
                  }
                >
                  Ubah
                </Button>
                <Button
                  variant="quiet-danger"
                  size="sm"
                  disabled={saving}
                  aria-label={`Hapus ${title}`}
                  onClick={() => dispatch(deleteRequested(transaction.id))}
                >
                  Hapus
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
