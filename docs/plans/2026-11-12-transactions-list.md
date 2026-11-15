# Plan 12 Nov 2026: TanStack Query + Redux Toolkit, daftar transaksi dengan skeleton dan error state (±2 jam)

## Context
Tugas jadwal 12 Nov: **"TanStack Query (server state) + Redux Toolkit (UI state); daftar transaksi dengan skeleton + error state"**. Output: *daftar transaksi dari API dengan loading/error rapi*.

Hari ini 15 Nov. Kamu memilih mencoba menyelesaikan 12–14 Nov + rilis v0.2 hari ini, **dengan titik cek**: setiap task tetap satu PR dengan cakupan penuh, dan kalau sampai malam belum rapi, v0.2 digeser (README diperbarui saat itu). PR #11 (API) sudah di-squash-merge ke develop (`bb758d0`) dengan judul yang benar.

Yang sudah ada dan dipakai ulang:
- API `GET /api/transactions?page&pageSize` → `TransactionPage` (`schemas/transaction.ts`: `TransactionDto`, `TransactionListQuery`, `DEFAULT_PAGE_SIZE`). Format error `ApiErrorBody` di `lib/api/http.ts` (type-only import aman untuk client).
- `components/ui/`: `Card`, `Button`/`buttonClasses`, `Toast` (`ToastProvider` + `useToast().show({ message, action })`, timer 4 dtk, pause saat hover/fokus, fokus kembali), dan `AddTransactionLink` di `components/app-shell/`.
- `app/(app)/transactions/page.tsx`: masih `PagePlaceholder`. Halaman statis, data dimuat di client.
- `db/demo/seed-demo-user.ts` punya `todayInJakarta()` privat. Fungsi ini dipindah ke `lib/date.ts` supaya dipakai bersama.
- Wireframe `docs/wireframe/mvp-v1/{Desktop,Mobile}/04 Transaksi.png` dan DESIGN.md (Money, Baris transaksi, Tabel transaksi, States).

## Cara kerja (sama seperti 11 Nov)
Setiap langkah: test dulu sampai gagal, lalu implementasi. Sebelum commit: baca ulang diff terhadap plan + AGENTS.md, lalu jalankan lint/typecheck/test. Setiap kesalahan dicatat di **Catatan perbaikan** dan dirangkum di chat. Setiap perintah shell dicek dulu supaya tidak ada yang menulis saat plan mode.

## Keputusan
- **Dependency**, dengan versi yang sudah dirilis ≥2 minggu: `@tanstack/react-query@5.105.0` (server state, sesuai jadwal), `@reduxjs/toolkit@2.13.0` + `react-redux@9.3.1` (UI state, sesuai jadwal). Tanpa devtools dan tanpa MSW.
- **Redux = state toast** (pilihanmu). Slice `toast` di `lib/store/`: `{ current: { id, message, actionLabel? } | null }`. Thunk `showToast({ message, action })` menyimpan callback "Urungkan" di registry modul (Map berdasarkan id, dibersihkan setiap toast diganti atau ditutup), karena fungsi tidak boleh masuk store Redux. API `useToast().show/dismiss` **tidak berubah** untuk pemakai. Timer dan state pause tetap lokal di komponen, karena itu state tampilan elemen, bukan state aplikasi. `ToastProvider` diganti `<Toaster />` (viewport saja) yang dirender di provider root.
- **Alasan teknis Redux di sini:** error global TanStack Query terjadi di luar React (`QueryCache.onError`), dan dari sana bisa langsung `store.dispatch(showToast(…))`.
- **Store per pemasangan**: `makeStore()` dibuat di `app/providers.tsx` (client) lewat `useState`, sesuai pola Redux untuk Next App Router (tidak memakai store global modul, supaya request di server tidak saling berbagi). Typed hooks `useAppDispatch`/`useAppSelector` via `.withTypes()`.
- **QueryClient** (`lib/query-client.ts`, `makeQueryClient({ dispatch, onUnauthorized })`): `staleTime` 30 dtk. Retry hanya untuk error jaringan/5xx (maksimal 2), dan error 4xx tidak di-retry. `QueryCache.onError`: 401 → `onUnauthorized()` (default `location.assign("/login?next=…")`); error refetch saat data lama masih tampil → toast "Data gagal diperbarui. Coba lagi nanti."; error muat pertama ditangani inline oleh kotak error, tanpa toast ganda.
- **Klien API** (`lib/api/client.ts`): `apiFetch<T>(path, { signal, … })`. Respons non-OK dengan body `ApiErrorBody` → `ApiError` (status, code, message, fieldErrors, formErrors), dipakai juga oleh form 13 Nov. 204 → `undefined`. Komponen tidak pernah memanggil `fetch` langsung (aturan AGENTS.md).
- **Query** (`features/transactions/api/`): `transactionKeys` (`all`, `list(query)`, `detail(id)`). `useTransactions(query)` → `useQuery` dengan `signal` diteruskan ke fetch (dasar untuk "request lama dibatalkan" di 14 Nov) dan `placeholderData: keepPreviousData`.
- **Tampilan** mengikuti wireframe 04 dan DESIGN.md:
  - Desktop (≥lg): `<table>` dengan `<caption>` sr-only, kolom Tanggal ("1 Nov 2026"), Catatan, Kategori (chip), dan Nominal (rata kanan, `whitespace-nowrap`). Baris 56px.
  - Mobile: dikelompokkan per tanggal dengan judul "Hari ini · Min, 15 Nov" / "Kemarin · Sab, 14 Nov" / "Jum, 13 Nov" (tahun ditampilkan kalau bukan tahun ini, zona Asia/Jakarta). Setiap baris berisi ikon kategori dalam lingkaran 40px, judul, nama kategori, dan nominal.
  - Keduanya dirender, lalu disembunyikan dengan CSS (`hidden lg:table` / `lg:hidden`) tanpa JS, supaya tidak terjadi hydration mismatch. Elemen `display:none` juga tidak dibaca screen reader.
  - Judul baris = `note`. Kalau note kosong, nama kategori yang dipakai. Judul panjang di-truncate dengan teks lengkap di `title`.
  - Footer: "Menampilkan 1–20 dari 178 transaksi".
- **Money** (`lib/money.ts` + `components/ui/money.tsx`): `Intl.NumberFormat("id-ID")`, prefix "Rp" lebih kecil, `tabular-nums`. Di daftar: pemasukan "+" berwarna `income`, pengeluaran "−" (U+2212) berwarna `fg`. Label untuk screen reader berbentuk "pengeluaran 35.000 rupiah".
- **Ikon kategori** (`components/ui/category-icon.tsx`): map eksplisit nama Lucide ke komponen (utensils, bus, receipt, clapperboard, shopping-bag, heart-pulse, wallet, laptop, coins, coffee, plus fallback), supaya tidak mengimpor seluruh Lucide. Daftar kurasi ±20 ikon dilengkapi saat Pengaturan kategori dibuat.
- **States** (DESIGN.md › States, pakai skill `ui-states`): skeleton berbentuk konten (tabel dan grup, `bg-surface-muted`, pulse yang mati kalau reduced motion, layout tidak bergeser, `aria-busy`); kotak error di area daftar "Transaksi gagal dimuat. Periksa koneksi lalu coba lagi." + **Coba lagi** (refetch); kosong untuk user baru "Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi." + **Tambah transaksi** (link ke `/transactions/new`). Komponen generik `Skeleton`, `ErrorState`, `EmptyState` di `components/ui/` agar dipakai ulang oleh dashboard/budget.
- **Belum di task ini** (dicatat untuk nanti): kolom Aksi (Ubah · Hapus) + klik baris → 13 Nov; cari/filter/sort/pagination/"Muat lebih banyak" → 14 Nov; kartu ringkasan Pemasukan/Pengeluaran/Selisih butuh endpoint agregat → diputuskan di plan 14 Nov.

## File
- `package.json`/lock: tiga dependency di atas.
- `lib/money.ts` (+test), `components/ui/money.tsx` (+test), `lib/date.ts` (+test: `todayInJakarta`, `formatDate`, `dateGroupLabel(date, today)`). `db/demo/seed-demo-user.ts` memakai `todayInJakarta` dari `lib/date.ts`.
- `lib/store/store.ts` (`makeStore`, `RootState`, `AppDispatch`, `AppStore`), `lib/store/hooks.ts`, `lib/store/toast-slice.ts` (+test: reducer, `showToast` + registry callback).
- `components/ui/toast.tsx`: `Toaster` + `useToast` dari store. `toast.test.tsx` diperbarui memakai helper provider, dan perilaku lama (timer, pause, fokus, Urungkan, axe) tetap dites.
- `lib/api/client.ts` (+test, node env, `fetch` di-spy), `lib/query-client.ts` (+test: retry, toast saat refetch gagal, 401 memanggil `onUnauthorized`).
- `app/providers.tsx` (client): Redux Provider → QueryClientProvider → children + `<Toaster />`. `app/layout.tsx`: `ThemeProvider` > `Providers`.
- `lib/testing/render-with-providers.tsx`: store + QueryClient baru per test (retry off). Test lama yang memakai `ToastProvider` (`app/page.test.tsx`, `features/auth/components/*.test.tsx`) diubah memakainya.
- `components/ui/skeleton.tsx`, `error-state.tsx`, `empty-state.tsx`, `category-icon.tsx` (+test yang perlu).
- `features/transactions/api/keys.ts`, `fetch-transactions.ts`, `use-transactions.ts`.
- `features/transactions/components/transaction-list.tsx` (state + footer), `transaction-table.tsx`, `transaction-groups.tsx`, `transaction-list-skeleton.tsx` (+`transaction-list.test.tsx`).
- `app/(app)/transactions/page.tsx`: `PagePlaceholder` diganti `<TransactionList />`.
- `README.md` (TanStack Query + Redux Toolkit pindah ke *in use*), `AGENTS.md` › Structure (`lib/store/`, `lib/query-client.ts`, `lib/api/client.ts`, `app/providers.tsx`, `lib/testing/`), `docs/plans/2026-11-12-transactions-list.md`.

## Test (ditulis dulu)
- **money**: 35000 → "35.000"; tanda "+"/"−" (U+2212) sesuai tipe; label SR "pengeluaran 35.000 rupiah"; 1.000.000.000.000 muat.
- **date**: `formatDate("2026-11-01")` → "1 Nov 2026"; label grup Hari ini/Kemarin/hari lain/tahun lain; tanggal tidak bergeser karena zona waktu; `todayInJakarta` pada pukul 23.30 UTC = besoknya.
- **toast slice**: show menggantikan toast lama dan membersihkan callback lama; dismiss dengan id lama tidak menutup toast baru; aksi menjalankan callback yang benar.
- **Toast (komponen)**: seluruh test lama tetap lolos dengan provider baru.
- **apiFetch**: 200 → JSON; 204 → undefined; 400 `ApiErrorBody` → `ApiError` dengan fieldErrors; 500 tanpa body JSON → `ApiError` status 500 dengan pesan umum; `signal` diteruskan.
- **query client**: 404/400 tidak di-retry; 500 di-retry; refetch gagal saat ada data → toast; muat pertama gagal → tanpa toast; 401 → `onUnauthorized`.
- **TransactionList** (mock `apiFetch`): pending → skeleton + `aria-busy`; data → baris di tabel dan grup, tanda/nominal benar, judul fallback ke kategori, footer jumlah; error → kotak error, **Coba lagi** → refetch → data tampil; total 0 → state kosong + link Tambah transaksi; axe tanpa pelanggaran (data, error, kosong).

## Langkah dan commit
- [x] 0. `git switch develop && git pull` (sekarang HEAD detached di `bb758d0`, lihat Catatan perbaikan). Hapus branch lokal `feature/transactions-api` setelah `git diff develop feature/transactions-api` kosong. Buat branch `feature/transactions-list`. Simpan plan ke `docs/plans/2026-11-12-transactions-list.md`, centang box 7 di plan 11 Nov. Commit `docs: add transactions list plan`
- [x] 1. Install dependency, cek lockfile hanya ke registry.npmjs.org. Commit `build: add tanstack query and redux toolkit`
- [x] 2. Money + date (+ refactor `todayInJakarta`). Commit `feat(ui): add money and date formatting`
- [ ] 3. Store + toast slice + Toast via Redux + `app/providers.tsx` + helper test, lalu perbarui test lama. Commit `refactor(ui): keep toast state in redux toolkit`
- [ ] 4. `apiFetch` + `makeQueryClient` + wiring di providers. Commit `feat(api): add api client and query client`
- [ ] 5. Skeleton/ErrorState/EmptyState/CategoryIcon + query transaksi + komponen daftar + halaman. Commit `feat(transactions): list transactions with loading and error states`
- [ ] 6. README + AGENTS.md. Commit `docs: document data fetching and ui state`
- [ ] 7. Verifikasi, push, PR `feat: add transactions list` (judul diketik ulang), `ci` + Vercel hijau, squash merge (kamu), lalu titik cek: lanjut ke 13 Nov atau berhenti.

## Verifikasi
1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, dan build dengan env dummy CI semuanya hijau.
2. Manual di `npm run dev` lewat browser (skill next-dev-loop / agent-browser):
   - login demo → `/transactions`: skeleton sebentar, lalu 20 transaksi terbaru dan footer "dari 178";
   - desktop 1440px: tabel; mobile 390px: grup per tanggal dengan "Hari ini"/"Kemarin"; terang dan gelap;
   - blokir `/api/transactions` (route jaringan agent-browser) → kotak error, buka blokir → **Coba lagi** → data tampil;
   - cookie dihapus lalu halaman di-refetch → diarahkan ke `/login?next=/transactions`;
   - akun Google/GitHub tanpa transaksi → state kosong;
   - axe (agent-browser a11y) 0 pelanggaran di desktop/mobile, terang/gelap; navigasi keyboard + toast di halaman lain (login/keluar) tetap berfungsi.
3. Self-review `git diff develop...HEAD` terhadap checklist Keputusan.

## Catatan perbaikan
- 15 Nov, saat riset plan 12 Nov: perintah baca yang kujalankan ternyata berisi `git switch --detach origin/develop`, padahal masih plan mode, dan output-nya tersembunyi oleh `2>/dev/null`. Ini kesalahan yang sama dengan saat menyusun plan 11 Nov. Akibatnya HEAD detached di `bb758d0` (develop terbaru). Working tree bersih dan tidak ada yang hilang (branch 11 Nov sudah di-push dan di-merge). Langkah 0 mengembalikannya ke branch `develop`. Pencegahannya: setiap perintah plan mode dicek dulu supaya hanya membaca, dan output error tidak lagi dibuang dengan `2>/dev/null`.

## Catatan untuk nanti
- 13 Nov: kolom Aksi + klik baris membuka form ubah; mutation memakai `apiFetch` + `ApiError.fieldErrors` → `setError` React Hook Form; toast "Transaksi disimpan"/"Transaksi dihapus" · Urungkan lewat `useToast`; invalidasi `transactionKeys.all`. Butuh `GET /api/categories`.
- 14 Nov: cari/filter/sort/pagination dari URL ke `transactionListQuerySchema` + `transactionKeys.list(query)`; desktop pakai pagination, mobile "Muat lebih banyak" (`useInfiniteQuery`?); putuskan kartu ringkasan + endpoint agregatnya.
- `components/landing/dashboard-preview.tsx` dan `app/dev/ui/page.tsx` masih memakai `Intl.NumberFormat` sendiri. Pindahkan ke `Money` saat audit (20–21 Nov) atau saat `/dev/ui` dihapus sebelum v1.
- F4 (hapus `kleingeld-old` dan backup 4 Nov): ditunda atas pilihanmu, paling lambat sebelum rilis v1.0.
