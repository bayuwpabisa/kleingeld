"use client";

import { useState } from "react";
import type { NewTransaction, TransactionType } from "./types";

type TransactionFormProps = {
  onAdd: (input: NewTransaction) => void;
};

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedDescription = description.trim();
    const amountAsNumber = Number(amount);

    if (trimmedDescription === "") {
      setError("Deskripsi wajib diisi");
      return;
    }

    if (!Number.isInteger(amountAsNumber) || amountAsNumber <= 0) {
      setError("Nominal harus bilangan bulat lebih dari 0");
      return;
    }

    onAdd({ description: trimmedDescription, amount: amountAsNumber, type });

    setDescription("");
    setAmount("");
    setType("expense");
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="description">Deskripsi</label>
        <input
          type="text"
          id="description"
          className="rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="amount">Nominal (Rp)</label>
        <input
          type="number"
          id="amount"
          inputMode="numeric"
          min={1}
          step={1}
          className="rounded border px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="type">Tipe</label>
        <select
          id="type"
          className="rounded border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>

      <p role="alert" className="text-red-700">{error}</p>
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Tambah
      </button>
    </form>
  );
}
