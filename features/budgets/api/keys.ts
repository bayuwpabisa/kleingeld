/**
 * Query keys for budgets. Every month sits under `budgetKeys.all`, which the
 * budget mutations and the transaction mutations invalidate: a budget's
 * spending comes from the transactions.
 */
export const budgetKeys = {
  all: ["budgets"] as const,
  /** GET /api/budgets?month=: "YYYY-MM" */
  month: (month: string) => [...budgetKeys.all, "month", month] as const,
};
