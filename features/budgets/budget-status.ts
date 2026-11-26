import { monthRange } from "@/features/transactions/periods";
import type { BudgetStatus } from "@/schemas/budget";

// How full a budget is, in words and numbers (DESIGN.md › Meter budget).
// Pure, so the Budget page, the budget form and the dashboard card agree.

/** Below 80%, 80–100% ("hampir habis"), or over the limit ("lewat batas"). */
export type BudgetLevel = "ok" | "warning" | "over";

/**
 * Integer rules, so 80% is exactly 80%: `spent * 5 >= amount * 4` is
 * `spent / amount >= 0.8` without fractions, and stays a safe integer for
 * limits up to Rp1 triliun.
 */
export function budgetLevel(spent: number, amount: number): BudgetLevel {
  if (spent > amount) return "over";
  if (spent * 5 >= amount * 4) return "warning";
  return "ok";
}

/**
 * The share used, as a whole percent: rounded down, but rounded up once over
 * the limit, so the number never disagrees with the level (79.6% → 79,
 * 100.2% → 101).
 */
export function budgetPercent(spent: number, amount: number): number {
  const exact = (spent * 100) / amount;
  return budgetLevel(spent, amount) === "over"
    ? Math.ceil(exact)
    : Math.floor(exact);
}

const levelWords: Record<BudgetLevel, string> = {
  ok: "terpakai",
  warning: "hampir habis",
  over: "lewat batas",
};

/** "45% terpakai", "85% · hampir habis", "112% · lewat batas" */
export function budgetLabel(spent: number, amount: number): string {
  const percent = budgetPercent(spent, amount);
  const level = budgetLevel(spent, amount);
  return level === "ok"
    ? `${percent}% ${levelWords.ok}`
    : `${percent}% · ${levelWords[level]}`;
}

/** All limits and spending together; `left` is below 0 when over. */
export function budgetTotals(budgets: readonly BudgetStatus[]) {
  const amount = budgets.reduce((total, b) => total + b.amount, 0);
  const spent = budgets.reduce((total, b) => total + b.spent, 0);
  return { amount, spent, left: amount - spent };
}

const levelRank: Record<BudgetLevel, number> = { over: 0, warning: 1, ok: 2 };
const byName = new Intl.Collator("id-ID").compare;

/**
 * Most urgent first: over the limit, then almost used up, then the rest;
 * within a level the highest share first, equal shares by name. A new array.
 */
export function byUrgency(budgets: readonly BudgetStatus[]): BudgetStatus[] {
  return [...budgets].sort(
    (a, b) =>
      levelRank[budgetLevel(a.spent, a.amount)] -
        levelRank[budgetLevel(b.spent, b.amount)] ||
      b.spent / b.amount - a.spent / a.amount ||
      byName(a.category.name, b.category.name),
  );
}

const andList = new Intl.ListFormat("id-ID", { type: "conjunction" });

/**
 * "2 kategori perlu perhatian: Makan hampir habis (85%) dan Hiburan lewat
 * batas (112%)." in the list's order, or null when every budget is below 80%.
 */
export function attentionMessage(
  budgets: readonly BudgetStatus[],
): string | null {
  const parts = budgets.flatMap((b) => {
    const level = budgetLevel(b.spent, b.amount);
    if (level === "ok") return [];
    const percent = budgetPercent(b.spent, b.amount);
    return [`${b.category.name} ${levelWords[level]} (${percent}%)`];
  });
  if (parts.length === 0) return null;
  return `${parts.length} kategori perlu perhatian: ${andList.format(parts)}.`;
}

/** What is left lasts until the month ends: "untuk 5 hari lagi". */
export function daysLeftLabel(today: string): string {
  const lastDay = Number(monthRange(today.slice(0, 7)).to.slice(8));
  const days = lastDay - Number(today.slice(8)) + 1;
  return days <= 1 ? "untuk hari ini" : `untuk ${days} hari lagi`;
}
