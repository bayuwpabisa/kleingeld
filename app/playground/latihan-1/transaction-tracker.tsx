"use client";

import { useState } from "react";
import { TransactionForm } from "./transaction-form";
import { TransactionList } from "./transaction-list";
import { TransactionSummary } from "./transaction-summary";
import type { NewTransaction, Transaction } from "./types";

// Parent: pemilik state `transactions` (lifting state up).
export function TransactionTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  function handleAdd(input: NewTransaction) {
    setTransactions((prev) => [...prev, { ...input, id: crypto.randomUUID() }]);
  }

  function handleDelete(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="mt-6 space-y-6">
      <TransactionSummary transactions={transactions} />
      <TransactionForm onAdd={handleAdd} />
      <TransactionList transactions={transactions} onDelete={handleDelete} />
    </div>
  );
}
