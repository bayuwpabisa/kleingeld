# features/

Satu folder untuk satu fitur: `transactions`, `budgets`, `bills`, `dashboard`.

## Isi satu fitur

```
features/transactions/
  components/   komponen UI khusus fitur ini (TransactionForm, TransactionTable)
  hooks/        custom hook fitur (useTransactionFilters)
  api/          query dan mutation TanStack Query (useTransactions, useCreateTransaction)
  index.ts      pintu ekspor: hanya yang dipakai di luar fitur
```

Subfolder dibuat saat dibutuhkan, tidak perlu lengkap sejak awal.

## Aturan impor

- Fitur boleh mengimpor dari `components/`, `lib/`, `schemas/`, dan `db/` (hanya kode server).
- Fitur lain hanya boleh mengimpor lewat `index.ts`, jangan langsung ke file di dalamnya.
- `components/`, `lib/`, dan `schemas/` tidak boleh mengimpor dari `features/`.
- Route di `app/` merangkai fitur, sedangkan logikanya tetap di `features/`.

## Akses data aman

`tsconfig.json` memakai `noUncheckedIndexedAccess`, jadi `arr[i]` dan `obj[key]` bertipe `T | undefined`. Supaya kode tidak memanjang, pakai pola yang memang tidak menghasilkan indeks kosong:

```ts
// Jumlah dan kelompok: iterasi, bukan indeks
const total = transactions.reduce((sum, t) => sum + t.amount, 0);

// Lookup per key: Map, lalu beri default saat dibaca
const totalByCategory = new Map<string, number>();
for (const t of transactions) {
  totalByCategory.set(t.categoryId, (totalByCategory.get(t.categoryId) ?? 0) + t.amount);
}

// Satu elemen: find atau at(), hasilnya memang bisa undefined
const latest = transactions.at(-1);

// Data dari luar (form, request, query string): parse dengan Zod dulu
const input = transactionSchema.parse(body);

// Indeks langsung hanya kalau perlu, dengan default
const firstAmount = amounts[0] ?? 0;
```
