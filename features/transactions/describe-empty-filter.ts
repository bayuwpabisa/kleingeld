import type { TransactionFilters } from "@/schemas/transaction";

import { periodPhrase } from "./periods";

/**
 * The message when the filters find nothing (DESIGN.md, States: name the
 * filters, offer a reset): "Tidak ada transaksi untuk “kopi” di November
 * 2026." The category's name comes from the caller, which has the list.
 */
export function describeEmptyFilter(
  filters: TransactionFilters,
  categoryName: string | undefined,
): string {
  const noun =
    filters.type === "income"
      ? "pemasukan"
      : filters.type === "expense"
        ? "pengeluaran"
        : "transaksi";
  const parts = [
    filters.q && `untuk “${filters.q}”`,
    filters.category && categoryName && `di kategori ${categoryName}`,
    periodPhrase(filters),
  ].filter(Boolean);

  if (parts.length === 0) {
    return `Tidak ada ${noun} yang cocok dengan filter ini.`;
  }
  return `Tidak ada ${noun} ${parts.join(" ")}.`;
}
