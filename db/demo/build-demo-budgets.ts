import type { DemoCategory, DemoTransaction } from "./build-demo-transactions";

export type DemoBudget = {
  categoryId: string;
  amount: number;
};

/**
 * The demo's budgets: how much of each limit this month's spending should
 * use, so the Budget page shows all three levels (below 80%, almost used up
 * at 80–100%, over the limit). Makan and Transport carry the warnings because
 * they have spending on almost every day. `fixed` is the limit while a
 * category has spent too little this month for a target to mean anything.
 * Kesehatan and "Kopi & jajan" have no budget, so the demo can still create one.
 */
export const DEMO_BUDGET_PLAN = [
  { name: "Makan", percent: 85, fixed: 1_500_000 },
  { name: "Transport", percent: 112, fixed: 600_000 },
  { name: "Tagihan", percent: 60, fixed: 4_000_000 },
  { name: "Belanja", percent: 50, fixed: 1_000_000 },
  { name: "Hiburan", percent: 45, fixed: 300_000 },
] as const;

/**
 * From this much spending on, a limit is set from the target. Rounding the
 * limit to Rp10.000 then moves the share by at most a few points (at
 * Rp100.000: 81.6–88.8% for 85%, 106–118.6% for 112%), so the level stays.
 * Below it, the fixed limit keeps the share under 80%.
 */
export const MIN_SPENT_FOR_TARGET = 100_000;

const STEP = 10_000;

/**
 * Builds the demo account's budgets from its transactions: one per category
 * in `DEMO_BUDGET_PLAN`, sized from that category's spending in the month of
 * `today` ("YYYY-MM-DD"). Pure: no database access.
 */
export function buildDemoBudgets({
  today,
  categories,
  transactions,
}: {
  today: string;
  categories: readonly DemoCategory[];
  transactions: readonly DemoTransaction[];
}): DemoBudget[] {
  const month = today.slice(0, 7);
  const spent = new Map<string, number>();
  for (const row of transactions) {
    if (row.type !== "expense" || !row.date.startsWith(month)) continue;
    spent.set(row.categoryId, (spent.get(row.categoryId) ?? 0) + row.amount);
  }

  return DEMO_BUDGET_PLAN.map((plan) => {
    const category = categories.find(
      (c) => c.name === plan.name && c.type === "expense",
    );
    if (!category) throw new Error(`Demo category "${plan.name}" is missing`);

    const used = spent.get(category.id) ?? 0;
    const amount =
      used >= MIN_SPENT_FOR_TARGET
        ? Math.round((used * 100) / plan.percent / STEP) * STEP
        : plan.fixed;
    return { categoryId: category.id, amount };
  });
}
