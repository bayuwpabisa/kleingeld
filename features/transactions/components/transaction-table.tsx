"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  deleteRequested,
  editorOpened,
} from "@/lib/store/transaction-editor-slice";
import type {
  SortOrder,
  TransactionDto,
  TransactionSort,
} from "@/schemas/transaction";

import { transactionTitle } from "./transaction-title";

type Sorting = { sort: TransactionSort; order: SortOrder };

/**
 * The list on wide screens (DESIGN.md, Tabel transaksi): date, note,
 * category, amount and the row actions, 56px rows. Tanggal and Nominal sort
 * the list (`aria-sort` on the sorted column). Ubah and Hapus open the
 * dialogs of app/(app)/layout.tsx. A row still being saved has no id on the
 * server yet, so its actions wait.
 */
export function TransactionTable({
  transactions,
  sorting,
  onSort,
}: {
  transactions: TransactionDto[];
  sorting: Sorting;
  onSort: (sorting: Sorting) => void;
}) {
  const dispatch = useAppDispatch();

  return (
    <table className="w-full table-fixed text-left">
      <caption className="sr-only">Daftar transaksi</caption>
      <thead className="text-sm text-fg-muted">
        <tr>
          <SortableHeader
            column="date"
            label="Tanggal"
            sorting={sorting}
            onSort={onSort}
            className="w-36"
          />
          <th scope="col" className="px-5 py-3 font-normal">
            Catatan
          </th>
          <th scope="col" className="w-44 px-5 py-3 font-normal">
            Kategori
          </th>
          <SortableHeader
            column="amount"
            label="Nominal"
            sorting={sorting}
            onSort={onSort}
            className="w-48"
            alignEnd
          />
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

/**
 * A column header that sorts (DESIGN.md: a <button> with an arrow, and
 * `aria-sort` on the sorted column only). The sorted column flips its order;
 * another column starts with the newest date or the biggest amount.
 */
function SortableHeader({
  column,
  label,
  sorting,
  onSort,
  className,
  alignEnd = false,
}: {
  column: TransactionSort;
  label: string;
  sorting: Sorting;
  onSort: (sorting: Sorting) => void;
  className?: string;
  alignEnd?: boolean;
}) {
  const active = sorting.sort === column;
  const Icon = !active
    ? ArrowUpDown
    : sorting.order === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={
        active
          ? sorting.order === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
      className={cn(
        "px-3 py-1.5 font-normal",
        alignEnd && "text-right",
        className,
      )}
    >
      <button
        type="button"
        onClick={() =>
          onSort({
            sort: column,
            order: active && sorting.order === "desc" ? "asc" : "desc",
          })
        }
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-surface-muted hover:text-fg",
          active && "font-medium text-fg",
        )}
      >
        {label}
        <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </th>
  );
}
