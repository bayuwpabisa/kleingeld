import { monthLabel } from "@/features/transactions/periods";
import { moneyLabel } from "@/lib/money";

import type { RankedCategory } from "./rank-categories";
import { compactRupiah } from "./trend-chart-data";

// What "Pengeluaran per kategori" shows, worked out from rankCategories'
// rows (largest first, "Lainnya" last). Pure, so it is tested without a
// chart.

const percent = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 0,
});

export type CategoryRow = {
  /** The category id, or "other" for Lainnya. */
  key: string;
  /** "Makan", or "Lainnya (2 kategori)": the chart, tooltip and table. */
  label: string;
  total: number;
  count: number;
  /** Part of the month's expense, 0 to 1. */
  share: number;
  /** "51%" */
  shareLabel: string;
  /** At the end of the bar: "3,2 jt". */
  valueLabel: string;
};

/**
 * Whole percents. Rounded one by one, so a month's rows may add up to 99%
 * or 101%; each row is still right. A category with any spending never
 * reads "0%".
 */
export function shareLabel(share: number): string {
  if (share > 0 && share < 0.005) return "<1%";
  return percent.format(share);
}

export function categoryRows(ranked: RankedCategory[]): CategoryRow[] {
  const sum = ranked.reduce((all, row) => all + row.total, 0);
  return ranked.map((row) => {
    const share = sum > 0 ? row.total / sum : 0;
    return {
      key: row.kind === "category" ? row.id : "other",
      label:
        row.kind === "category"
          ? row.name
          : `${row.name} (${row.categoryCount} kategori)`,
      total: row.total,
      count: row.count,
      share,
      shareLabel: shareLabel(share),
      valueLabel: compactRupiah(row.total),
    };
  });
}

/**
 * The chart in words, for screen readers: the month, its total, then each
 * bar from the largest. `month` is "YYYY-MM".
 */
export function categorySummary(rows: CategoryRow[], month: string): string {
  const sum = rows.reduce((all, row) => all + row.total, 0);
  const opening = `Pengeluaran ${monthLabel(month)}: total ${moneyLabel(sum)}.`;
  const [only] = rows;
  if (rows.length === 1 && only) {
    return `${opening} Semuanya ${only.label}.`;
  }
  const bars = rows
    .map((row) => `${row.label} ${moneyLabel(row.total)} (${row.shareLabel})`)
    .join(", ");
  return `${opening} Dari yang terbesar: ${bars}.`;
}

/**
 * A name cut to `maxChars` characters, the last one an ellipsis. SVG text
 * does not wrap or cut itself; the full name is in the tooltip and table.
 */
export function fitLabel(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}
