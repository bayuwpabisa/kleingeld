import { formatDate } from "@/lib/date";
import type { TransactionFilters } from "@/schemas/transaction";

// The "Periode" filter: all time, one of the last 12 months, or any range.
// In the URL a period is just `from`/`to`; a range that covers exactly one
// month reads back as that month. Dates are calendar dates ("YYYY-MM-DD").

type Range = Pick<TransactionFilters, "from" | "to">;

/** "2026-11" */
export type MonthValue = string;
export type Period = "all" | "custom" | MonthValue;

const monthName = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "2026-11" → 1 to 30 November. Day 0 of the next month is the last day. */
export function monthRange(month: MonthValue): { from: string; to: string } {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
}

/** "2026-11" → "November 2026" */
export function monthLabel(month: MonthValue): string {
  return monthName.format(new Date(`${month}-01T00:00:00Z`));
}

/** Every month from `from` to `to`, both included, oldest first. */
export function monthsBetween(from: MonthValue, to: MonthValue): MonthValue[] {
  const [fromYear = 0, fromMonth = 1] = from.split("-").map(Number);
  const [toYear = 0, toMonth = 1] = to.split("-").map(Number);
  const count = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
  return Array.from({ length: Math.max(count, 0) }, (_, step) => {
    const date = new Date(Date.UTC(fromYear, fromMonth - 1 + step, 1));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
  });
}

/** The current month and the 11 before it, newest first. */
export function recentMonths(
  today: string,
  count = 12,
): { value: MonthValue; label: string }[] {
  const [year = 0, month = 1] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, back) => {
    const date = new Date(Date.UTC(year, month - 1 - back, 1));
    const value = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
    return { value, label: monthLabel(value) };
  });
}

/** Which "Periode" option a range is. */
export function periodOf({ from, to }: Range): Period {
  if (!from && !to) return "all";
  if (from && to) {
    const month = from.slice(0, 7);
    const whole = monthRange(month);
    if (whole.from === from && whole.to === to) return month;
  }
  return "custom";
}

/** "1–15 Nov 2026", or both full dates when the months differ. */
function rangeText(from: string, to: string) {
  if (from.slice(0, 7) === to.slice(0, 7)) {
    return `${Number(from.slice(8))}–${formatDate(to)}`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** The period in words, for the balance card: "November 2026". */
export function periodLabel(range: Range): string {
  const { from, to } = range;
  const period = periodOf(range);
  if (period === "all") return "Semua waktu";
  if (period !== "custom") return monthLabel(period);
  if (from && to) return rangeText(from, to);
  if (from) return `Sejak ${formatDate(from)}`;
  return `Sampai ${formatDate(to ?? "")}`;
}

/**
 * The period inside a sentence: "di November 2026", "pada 1–15 Nov 2026",
 * "sejak 1 Nov 2026"; empty for all time.
 */
export function periodPhrase(range: Range): string {
  const { from, to } = range;
  const period = periodOf(range);
  if (period === "all") return "";
  if (period !== "custom") return `di ${monthLabel(period)}`;
  if (from && to) return `pada ${rangeText(from, to)}`;
  if (from) return `sejak ${formatDate(from)}`;
  return `sampai ${formatDate(to ?? "")}`;
}
