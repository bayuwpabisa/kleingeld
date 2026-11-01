import { formatRupiah } from "../_lib/format-rupiah";
import type { Transaction, TransactionType } from "./types";

type TransactionSummaryProps = {
  transactions: Transaction[];
};

function sumByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((total, t) => total + t.amount, 0);
}

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const totalIncome = sumByType(transactions, "income");
  const totalExpense = sumByType(transactions, "expense");
  const balance = totalIncome - totalExpense;
  return (
    <dl className="grid grid-cols-3 gap-4">
      <div>
        <dt>Pemasukan</dt>
        <dd>{formatRupiah(totalIncome)}</dd>
      </div>
      <div>
        <dt>Pengeluaran</dt>
        <dd>{formatRupiah(totalExpense)}</dd>
      </div>
      <div>
        <dt>Saldo</dt>
        <dd>{formatRupiah(balance)}</dd>
      </div>
    </dl>
  )
}
