# Latihan React — 2 komponen

Kerjakan sendiri, lalu minta Claude me-review. Kerangka file sudah ada di `app/playground/`. Isi bagian bertanda `TODO`.

Jalankan `npm run dev`, lalu buka http://localhost:3000/playground.

Kode playground hanya untuk latihan dan akan dihapus sebelum rilis v1.

## Latihan 1: Pencatat transaksi (komponen, props, state)

**Folder:** `app/playground/latihan-1/`

**Konsep yang dilatih:** komponen, props, callback props (pengganti `@Output`), `useState`, controlled input, lifting state up, render list dengan `key`, derived state.

**Struktur:**
- `transaction-tracker.tsx`: parent dan pemilik state (`transactions`).
- `transaction-form.tsx`: form tambah transaksi. Memanggil `onAdd`.
- `transaction-list.tsx`: daftar transaksi dengan tombol hapus. Memanggil `onDelete`.
- `transaction-summary.tsx`: total pemasukan, pengeluaran, dan saldo.

**Kriteria selesai:**
1. Form punya input deskripsi, nominal, dan tipe (pemasukan/pengeluaran), masing-masing dengan `<label>`.
2. Submit dengan deskripsi kosong atau nominal ≤ 0 tidak menambah data dan menampilkan pesan error.
3. Setelah submit berhasil, form dikosongkan.
4. Daftar memakai `key={t.id}`, dan menampilkan "Belum ada transaksi" kalau kosong.
5. Tombol hapus menghapus item yang benar.
6. Summary dihitung saat render, bukan disimpan di state terpisah.
7. Tidak ada mutasi array (`push`, `splice`).
8. Nominal ditampilkan dengan `formatRupiah` dari `app/playground/_lib/format-rupiah.ts`.

**Petunjuk:** `crypto.randomUUID()` untuk id. Event submit: `(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); ... }`.

## Latihan 2: Budget per kategori (custom hook, Context, useEffect)

**Folder:** `app/playground/latihan-2/`

**Konsep yang dilatih:** custom hook (pengganti logika service), Context + Provider (pengganti DI), `useSyncExternalStore` untuk membaca data dari luar React (localStorage), aturan hooks, hydration di Next.js.

**Struktur:**
- `use-local-storage.ts`: custom hook `useLocalStorage<T>(key, initialValue)`.
- `budget-context.tsx`: `BudgetProvider` + hook `useBudget()`. State disimpan memakai `useLocalStorage`.
- `budget-form.tsx`: tambah budget (kategori, batas, terpakai).
- `budget-meter.tsx`: progress bar satu kategori.
- `budget-board.tsx`: membaca `useBudget()` dan me-render `BudgetForm` + daftar `BudgetMeter`.

**Kriteria selesai:**
1. `useLocalStorage` mengembalikan `[value, setValue]` seperti `useState`, dan nilainya bertahan setelah halaman di-refresh.
2. Tidak ada error hydration di console. Petunjuk: render pertama di server tidak punya `window`. Baca localStorage dengan `useSyncExternalStore` dan server snapshot `() => null`. Jangan memanggil `setState` di dalam `useEffect` untuk menyalin isi localStorage, karena ditolak aturan lint `react-hooks/set-state-in-effect`.
3. `useBudget()` dipakai di luar `BudgetProvider` melempar error yang jelas.
4. `BudgetForm` dan `BudgetBoard` tidak menerima data budget lewat props. Keduanya mengambilnya dari `useBudget()`.
5. `BudgetMeter` memakai elemen `<progress>` atau `role="progressbar"` dengan `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, dan label.
6. Warna: < 80% normal, ≥ 80% kuning (peringatan), > 100% merah (lewat batas), plus teks status. Jangan hanya mengandalkan warna.
7. Persentase dihitung saat render di `BudgetMeter`, bukan disimpan.
8. Budget bisa dihapus.

**Bonus:** tombol untuk menambah "terpakai" pada satu kategori (+Rp50.000), supaya perubahan warna meter terlihat.

## Setelah selesai
- Jalankan `npm run lint` dan `npx tsc --noEmit`.
- Minta review: "review latihan 1" / "review latihan 2".
- Catat 2–3 hal yang paling berbeda dari Angular di bagian bawah `angular-vs-react.md`. Ini bahan cerita interview.
