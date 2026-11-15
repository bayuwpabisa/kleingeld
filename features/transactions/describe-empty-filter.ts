import type { TransactionFilters } from "@/schemas/transaction";

import { periodPhrase } from "./periods";

/**
 * The message when the filters find nothing (DESIGN.md, States: name the
 * filters, offer a reset): "Tidak ada transaksi untuk “kopi” di November
 * 2026." The category's name comes from the caller, which has the list:
 * its name, `null` when the user has no such category, or `undefined` while
 * the categories load (the category is then left out).
 */
export function describeEmptyFilter(
  filters: TransactionFilters,
  categoryName: string | null | undefined,
): string {
  const noun =
    filters.type === "income"
      ? "pemasukan"
      : filters.type === "expense"
        ? "pengeluaran"
        : "transaksi";
  const parts = [
    filters.q && `untuk “${filters.q}”`,
    filters.category &&
      categoryName !== undefined &&
      (categoryName === null
        ? "di kategori yang tidak ditemukan"
        : `di kategori ${categoryName}`),
    periodPhrase(filters),
  ].filter(Boolean);

  if (parts.length === 0) {
    return `Tidak ada ${noun} yang cocok dengan filter ini.`;
  }
  return `Tidak ada ${noun} ${parts.join(" ")}.`;
}
