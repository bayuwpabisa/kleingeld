"use client";

import { formatRupiah } from "../_lib/format-rupiah";
import { useBudget } from "./budget-context";
import { BudgetForm } from "./budget-form";
import { BudgetMeter } from "./budget-meter";

const SPENDING_STEP = 50000;
export function BudgetBoard() {
  const { budgets, removeBudget, addSpending } = useBudget();
  const stepLabel = `+${formatRupiah(SPENDING_STEP)}`;

  return (
    <div className="mt-6 space-y-6">
      <BudgetForm />

      {budgets.length === 0 ? (
        <p className="text-zinc-600">Belum ada budget.</p>
      ) : (
        <ul className="space-y-4">
          {budgets.map((b) => (
            <li key={b.id} className="space-y-2 rounded border p-3">
              <BudgetMeter category={b.category} limit={b.limit} spent={b.spent} />
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`${stepLabel} untuk ${b.category}`}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => addSpending(b.id, SPENDING_STEP)}
                >
                  {stepLabel}
                </button>
                <button
                  type="button"
                  aria-label={`Hapus budget ${b.category}`}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => removeBudget(b.id)}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
