"use client";

import { createContext, useContext } from "react";
import type { Budget, NewBudget } from "./types";
import { useLocalStorage } from "./use-local-storage";

type BudgetContextValue = {
  budgets: Budget[];
  addBudget: (input: NewBudget) => void;
  removeBudget: (id: string) => void;
  addSpending: (id: string, amount: number) => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

const STORAGE_KEY = "kleingeld-latihan-budgets";

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useLocalStorage<Budget[]>(STORAGE_KEY, []);

  function addBudget(input: NewBudget) {
    setBudgets((prev) => [...prev, { ...input, id: crypto.randomUUID() }]);
  }

  function removeBudget(id: string) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  function addSpending(id: string, amount: number) {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, spent: b.spent + amount } : b))
    );
  }
  return (
    <BudgetContext value={{ budgets, addBudget, removeBudget, addSpending }}>
      {children}
    </BudgetContext>
  );
}

export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext);
  if (context === null) {
    throw new Error("useBudget harus dipanggil di dalam BudgetProvider");
  }
  return context;
}
