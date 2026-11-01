import { BudgetBoard } from "./budget-board";
import { BudgetProvider } from "./budget-context";

export default function Latihan2Page() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Latihan 2: Budget per kategori</h1>
      <BudgetProvider>
        <BudgetBoard />
      </BudgetProvider>
    </main>
  );
}
