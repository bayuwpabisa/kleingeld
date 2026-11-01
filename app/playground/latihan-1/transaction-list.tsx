import { formatRupiah } from "../_lib/format-rupiah";
import type { Transaction } from "./types";

type TransactionListProps = {
  transactions: Transaction[];
  onDelete: (id: string) => void;
};

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-zinc-600">Belum ada transaksi</p>;
  }
  return (
    <ul className="divide-y rounded border">
      {transactions.map((t) => {
        const isIncome = t.type === "income";

        return (
          <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span>
              {t.description}
              <span className="ml-2 text-sm text-zinc-600">
                ({isIncome ? "Pemasukan" : "Pengeluaran"})
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className={isIncome ? "text-green-700" : "text-red-700"}>
                {isIncome ? "+" : "-"}
                {formatRupiah(t.amount)}
              </span>
              <button
                type="button"
                aria-label={`Hapus ${t.description}`}
                className="rounded border px-2 py-1 text-sm"
                onClick={() => onDelete(t.id)}
              >
                Hapus
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
