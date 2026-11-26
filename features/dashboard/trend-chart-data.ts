import { monthLabel } from "@/features/transactions/periods";
import { moneyLabel } from "@/lib/money";
import type { MonthlyTotal } from "@/schemas/transaction";

// What "Tren bulanan" shows, worked out from the API's months (oldest first,
// the last one is this month). Pure, so it is tested without a chart.

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortMonthName = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  month: "short",
});

const monthName = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  month: "long",
});

const toDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

/** The axis' amounts: 6398500 → "6,4 jt". */
export function compactRupiah(value: number): string {
  return compact.format(value);
}

export type TrendRow = MonthlyTotal & {
  /** "Nov", under the bars. */
  label: string;
  /** The value above a bar: this month only (DESIGN.md, Grafik). */
  incomeLabel: string | null;
  expenseLabel: string | null;
};

export function trendRows(months: MonthlyTotal[]): TrendRow[] {
  const last = months.length - 1;
  return months.map((month, index) => ({
    ...month,
    label: shortMonthName.format(toDate(month.month)),
    incomeLabel: index === last ? compactRupiah(month.income) : null,
    expenseLabel: index === last ? compactRupiah(month.expense) : null,
  }));
}

/** Gap between a bar's top and its label's baseline (Recharts' default). */
const VALUE_LABEL_GAP = 5;
/** One line of a 12px value label, measured in the browser. */
export const VALUE_LABEL_LINE = 16;

type BySeries<T> = { income: T; expense: T };

/**
 * Where this month's two value labels go: the SVG y of each baseline, from
 * the y of each bar's top (smaller is higher; `null` for a bar of 0, which
 * has no label). Each label sits just above its own bar. The two bars are
 * side by side, so their labels overlap sideways (measured at 320–1440px:
 * a label is wider than the step from one bar's middle to the next). When
 * their tops are closer than one label line, the lower bar's label moves up
 * above the other one (the expense label when the bars are equal).
 */
export function valueLabelBaselines(
  tops: BySeries<number | null>,
): BySeries<number | null> {
  const income = tops.income === null ? null : tops.income - VALUE_LABEL_GAP;
  const expense = tops.expense === null ? null : tops.expense - VALUE_LABEL_GAP;
  if (
    income === null ||
    expense === null ||
    Math.abs(income - expense) >= VALUE_LABEL_LINE
  ) {
    return { income, expense };
  }
  return income <= expense
    ? { income, expense: income - VALUE_LABEL_LINE }
    : { income: expense - VALUE_LABEL_LINE, expense };
}

/** "Juni–November 2026", or "Agustus 2026–Januari 2027" across a year. */
export function trendRangeLabel(months: MonthlyTotal[]): string {
  const first = months.at(0)?.month ?? "";
  const last = months.at(-1)?.month ?? "";
  if (first.slice(0, 4) === last.slice(0, 4)) {
    return `${monthName.format(toDate(first))}–${monthLabel(last)}`;
  }
  return `${monthLabel(first)}–${monthLabel(last)}`;
}

/** The month with the largest value; the earliest wins a tie. */
function highest(months: MonthlyTotal[], key: "income" | "expense") {
  return months.reduce<MonthlyTotal | null>(
    (best, month) => (!best || month[key] > best[key] ? month : best),
    null,
  );
}

function highestSentence(
  months: MonthlyTotal[],
  key: "income" | "expense",
  name: "Pemasukan" | "Pengeluaran",
) {
  const top = highest(months, key);
  if (!top || top[key] === 0) {
    return `Belum ada ${name.toLowerCase()} dalam rentang ini.`;
  }
  return `${name} tertinggi ${monthLabel(top.month)}: ${moneyLabel(top[key])}.`;
}

/**
 * The chart in words, for screen readers: the range, the highest month of
 * each series, and this month. The table has every number.
 */
export function trendSummary(months: MonthlyTotal[]): string {
  const current = months.at(-1);
  const parts = [
    `${trendRangeLabel(months)}.`,
    highestSentence(months, "income", "Pemasukan"),
    highestSentence(months, "expense", "Pengeluaran"),
  ];
  if (current) {
    parts.push(
      `Bulan ini, ${monthLabel(current.month)}: ` +
        `pemasukan ${moneyLabel(current.income)}, ` +
        `pengeluaran ${moneyLabel(current.expense)}.`,
    );
  }
  return parts.join(" ");
}

/** Nothing in or out in any month: the card shows its empty state. */
export function isEmptyTrend(months: MonthlyTotal[]): boolean {
  return months.every((month) => month.income === 0 && month.expense === 0);
}
