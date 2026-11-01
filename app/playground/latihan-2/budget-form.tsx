"use client";

import { useState } from "react";
import { useBudget } from "./budget-context";

export function BudgetForm() {
  const { addBudget } = useBudget();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [spent, setSpent] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedCategory = category.trim();
    const limitAsNumber = Number(limit);
    const spentAsNumber = Number(spent);

    if (trimmedCategory === "") {
      setError("Kategori wajib diisi");
      return;
    }

    if (!Number.isInteger(limitAsNumber) || limitAsNumber <= 0) {
      setError("Batas harus bilangan bulat lebih dari 0");
      return;
    }

    if (!Number.isInteger(spentAsNumber) || spentAsNumber < 0) {
      setError("Terpakai harus bilangan bulat, minimal 0");
      return;
    }

    addBudget({ category: trimmedCategory, limit: limitAsNumber, spent: spentAsNumber });

    setCategory("");
    setLimit("");
    setSpent("");
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="category">Kategori</label>
        <input
          type="text"
          id="category"
          className="rounded border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="limit">Batas per bulan (Rp)</label>
        <input
          type="number"
          id="limit"
          inputMode="numeric"
          min={1}
          step={1}
          className="rounded border px-3 py-2"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="spent">Sudah terpakai (Rp)</label>
        <input
          type="number"
          id="spent"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="0"
          className="rounded border px-3 py-2"
          value={spent}
          onChange={(e) => setSpent(e.target.value)}
        />
      </div>

      <p role="alert" className="text-red-700">
        {error}
      </p>
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Tambah budget
      </button>
    </form>
  );
}
