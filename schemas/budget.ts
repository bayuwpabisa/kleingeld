import { z } from "zod";

import {
  amountField,
  bodyOptions,
  categoryIdField,
  monthField,
} from "./transaction";

// Budgets: one monthly limit per expense category, the same every month until
// it is changed. Shared by the route handlers and the budget form; no
// database imports, so the browser can use it.

/** POST /api/budgets */
export const budgetInputSchema = z.strictObject(
  { categoryId: categoryIdField, amount: amountField },
  bodyOptions,
);

/** PATCH /api/budgets/[id]: only the limit changes; a new category is a new budget. */
export const budgetUpdateSchema = z.strictObject(
  { amount: amountField },
  bodyOptions,
);

/** GET /api/budgets?month=YYYY-MM: whose spending counts. */
export const budgetListQuerySchema = z.object({
  month: monthField("Bulan tidak valid"),
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
export type BudgetListQuery = z.infer<typeof budgetListQuerySchema>;

/** A budget as POST and PATCH return it. */
export type BudgetDto = {
  id: string;
  category: { id: string; name: string; icon: string };
  /** The monthly limit in whole rupiah. */
  amount: number;
};

/** One budget of GET /api/budgets: the limit and the month's spending. */
export type BudgetStatus = BudgetDto & {
  /** Expenses in the budget's category in the asked month. */
  spent: number;
  /** How many expenses that is. */
  count: number;
};
