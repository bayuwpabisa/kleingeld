import { cn } from "@/lib/cn";
import { MINUS, formatRupiah, moneyLabel } from "@/lib/money";
import type { TransactionType } from "@/schemas/transaction";

type MoneyProps = {
  amount: number;
  /**
   * For lists where income and expenses mix: income gets "+" in the income
   * color, expenses get "−". Leave it out for labeled cards and balances.
   */
  type?: TransactionType;
  className?: string;
};

/**
 * Every amount in the app (DESIGN.md, Angka Rupiah): tabular digits, a small
 * muted "Rp", and a sign that always comes with its color. Screen readers
 * get words ("pengeluaran 35.000 rupiah") instead of the symbols.
 */
export function Money({ amount, type, className }: MoneyProps) {
  const sign = type
    ? type === "income"
      ? "+"
      : MINUS
    : amount < 0
      ? MINUS
      : "";

  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap tabular-nums",
        type === "income" ? "text-income" : "text-fg",
        className,
      )}
    >
      <span aria-hidden="true">
        {sign}
        <span className="text-[0.6em] font-medium text-fg-muted">Rp</span>
        <span>{formatRupiah(amount)}</span>
      </span>
      <span className="sr-only">{moneyLabel(amount, type)}</span>
    </span>
  );
}
