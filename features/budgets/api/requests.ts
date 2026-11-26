import { apiFetch } from "@/lib/api/client";
import type {
  BudgetDto,
  BudgetInput,
  BudgetStatus,
  BudgetUpdate,
} from "@/schemas/budget";

// The calls of the budgets API, used by the query and mutation hooks.

/** GET /api/budgets?month=YYYY-MM */
export function fetchBudgets(month: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ month });
  return apiFetch<BudgetStatus[]>(`/api/budgets?${params}`, { signal });
}

export function createBudget(input: BudgetInput) {
  return apiFetch<BudgetDto>("/api/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBudget(id: string, values: BudgetUpdate) {
  return apiFetch<BudgetDto>(`/api/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteBudget(id: string) {
  return apiFetch<void>(`/api/budgets/${id}`, { method: "DELETE" });
}
