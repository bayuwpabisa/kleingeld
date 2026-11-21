import type { TransactionType } from "@/schemas/transaction";

// Rupiah amounts are whole numbers (DESIGN.md, Angka Rupiah).

const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** U+2212, the minus sign. A hyphen looks too short next to digits. */
export const MINUS = "−";

/** The size of an amount with thousands dots and no sign: 35000 → "35.000". */
export function formatRupiah(amount: number): string {
  return rupiah.format(Math.abs(amount));
}

/**
 * What a screen reader should say. With a type: "pengeluaran 35.000 rupiah";
 * without one, a plain amount, negative as "minus …".
 */
export function moneyLabel(amount: number, type?: TransactionType): string {
  const words = `${formatRupiah(amount)} rupiah`;
  if (type)
    return `${type === "income" ? "pemasukan" : "pengeluaran"} ${words}`;
  return amount < 0 ? `minus ${words}` : words;
}
