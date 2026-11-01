import { TransactionTracker } from "./transaction-tracker";

// Server Component: hanya me-render komponen client.
export default function Latihan1Page() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Latihan 1: Pencatat transaksi</h1>
      <TransactionTracker />
    </main>
  );
}
