# Plan 16 Nov 2026: Dashboard SSR (ringkasan bulan ini + transaksi terbaru, streaming Suspense)

Dikerjakan mulai 22 Nov (jadwal bergeser; task dikerjakan berurutan).

## Context
Task jadwal 16 Nov: **Dashboard SSR: saldo, pemasukan vs pengeluaran bulan ini, streaming Suspense → "dashboard cepat dengan data server"**. Sebelum task ini `/dashboard` hanya `PagePlaceholder`. Data server sudah ada: `summarizeTransactions` dan `listTransactions` di `features/transactions/server/transactions-repo.ts`, hook client `useTransactionSummary` / `useTransactions`, dan mutation optimistic yang meng-invalidate `transactionKeys.all`.

Keputusan user (22 Nov):
- Scope: kartu **Saldo / Pemasukan / Pengeluaran bulan ini** + **Transaksi terbaru (5)**. Tidak sekarang: banner demo, pemilih bulan, banding bulan lalu. Grafik menyusul 17 Nov, budget 18 Nov, tagihan + kartu "Tagihan bulan ini" 19 Nov.
- Data: **SSR + hydrate TanStack Query** (pola docs `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md` › "Provide initial data from a Server Component").
- Pemasukan 0 (demo Gaji tanggal 25; pada 22 Nov ini kasus nyata): Rp0 + keterangan **"Belum ada pemasukan bulan ini"**. Saldo negatif ditulis "−Rp…" dengan warna `fg` (DESIGN.md: merah hanya untuk lewat batas dan error).

## Rancangan

### Alur data (server → cache client)
1. `app/(app)/dashboard/page.tsx` tetap Server Component; `PageHeader` (+ `AddTransactionButton`) diprerender statis. Dua `<Suspense>` terpisah supaya streaming terlihat: ringkasan dan transaksi terbaru masing-masing muncul begitu datanya siap.
2. Tiap boundary = Server Component async: `requireUser()` (membaca header, jadi dinamis; `todayInJakarta()` sesudahnya aman dengan `cacheComponents`), hitung `today`, buat QueryClient server dengan `retry: false` (DB gagal tidak menunda render dengan backoff), `await prefetchQuery({ queryKey, queryFn: () => repo(db, user.id, …) })`, `<HydrationBoundary state={dehydrate(queryClient)}>`, lalu komponen client dengan prop `today`.
3. Komponen client memakai **hook yang sudah ada** (`useTransactionSummary`, `useTransactions`) dengan **key yang persis sama**, jadi data sudah ada di HTML server dan tidak ada fetch client pertama (staleTime 30 dtk di `lib/query-client.ts`). Mutation yang ada otomatis memperbarui dashboard: list terbaru ikut optimistic (`updateLists` membaca query dari key lewat `listQueryFromKey`), ringkasan di-refetch setelah mutation selesai (sama seperti halaman Transaksi).
4. Prefetch gagal → query tidak di-dehydrate (default hanya status `success`) → client mengambil sendiri lewat API dan menampilkan error state + "Coba lagi". Tidak perlu `error.tsx`.

Identitas key adalah invariant terpenting, jadi satu modul murni (tanpa import server atau client) dipakai kedua sisi:
- `features/dashboard/dashboard-queries.ts`: `currentMonthFilters(today)` → `monthRange(today.slice(0, 7))` (dari `features/transactions/periods.ts`); `RECENT_QUERY = transactionListQuerySchema.parse({ pageSize: 5 })` (default urut tanggal terbaru, halaman 1). Key ringkasan sengaja sama dengan Periode = bulan itu di halaman Transaksi, jadi cache dipakai bersama.
- `features/dashboard/server/prefetch-dashboard.ts`: `prefetchMonthSummary(db, userId, today)` dan `prefetchRecentTransactions(db, userId)` → `DehydratedState`. Konvensi repo: folder `server/` = khusus server (paket `server-only` tidak terpasang dan tidak ditambah).

### UI (DESIGN.md › Kartu ringkasan, States, Baris transaksi)
- `features/dashboard/components/month-summary.tsx` (client):
  - Desktop (`lg`): 3 kartu Saldo · Pemasukan · Pengeluaran (urutan wireframe 03; kolom ke-4 Tagihan menyusul 19 Nov). Keterangan: Saldo "pemasukan − pengeluaran"; Pemasukan "N transaksi" atau "Belum ada pemasukan bulan ini"; Pengeluaran "N transaksi". `SummaryCard` di `transaction-summary.tsx` di-export dan dipakai ulang; ukuran nominal memakai `summaryLayout` (tier desktop 3 kolom sudah diukur).
  - HP: satu kartu saldo `bg-surface-muted` (wireframe mobile 03): "Saldo bulan ini" `text-3xl`, di bawahnya Pemasukan dan Pengeluaran dua kolom. Ukuran nominal panjang diukur di browser 320/360/390 sampai 15 digit (seperti R4 di task 14 Nov); tier baru (kalau perlu) dicatat di DESIGN.md › Kartu ringkasan. Skeleton setinggi kartu yang termuat.
  - Gagal tanpa data: kartu kecil `role="alert"` "Ringkasan gagal dimuat." + "Coba lagi" (pola `TransactionSummary`).
- `features/dashboard/components/recent-transactions.tsx` (client): judul "Transaksi terbaru" + link "Lihat semua" ke `/transactions`. Baris = `TransactionRow` yang di-export dari `transaction-groups.tsx`, detail "22 Nov · Makan" (`shortDate`, aturan list tanpa judul hari). `today` datang dari server lewat prop (tidak dibaca ulang di client), supaya render server sama dengan hydrate. Klik baris di desktop membuka dialog ubah (`editorOpened`), dicek dengan `matchMedia` saat klik (bukan saat render, jadi HTML server sama di semua lebar; Ctrl/⌘-klik tetap membuka tab baru); di HP ke `/transactions/[id]/edit`. States: skeleton, error + "Coba lagi", offline (`fetchStatus === "paused"`), user baru → EmptyState dengan teks DESIGN.md "Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi." + Tambah transaksi (sama dengan `transaction-list.tsx`).
- Tata letak: HP 1 kolom (ringkasan, lalu transaksi terbaru; grafik, budget, dan tagihan disisipkan nanti sesuai urutan wireframe). Desktop: kartu transaksi terbaru di kolom pertama grid 3 kolom bagian bawah (posisi akhir wireframe; kolom Budget dan Tagihan kosong sampai 18–19 Nov).

### State dan transisi
| Komponen | Pemilik state | Transisi | Test |
|---|---|---|---|
| MonthSummary | TanStack (key ringkasan bulan) | hydrated → tampil tanpa fetch; tanpa hydrate → skeleton → data / error; error → Coba lagi → data; mutation selesai → refetch → angka baru | satu test per transisi + pemasukan 0 + saldo negatif + axe |
| RecentTransactions | TanStack (key list pageSize 5) | hydrated → tampil; tanpa hydrate → skeleton → data / error / offline; total 0 → EmptyState; tambah optimistic → baris di atas, maksimal 5; hapus → baris hilang | satu test per transisi + klik desktop vs HP + axe |
| Halaman tersembunyi (Activity) | — | tidak ada `useState` baru; data ikut cache, jadi tidak perlu `useResetOnHide` | dicek di browser (tambah di `/transactions` → kembali ke dashboard → angka baru) |

## Langkah dan commit
Branch `feature/dashboard-summary` dari `develop` `c611c7b`; scope commit `dashboard` (dan `transactions` untuk export kecil bila perlu). Sebelum tiap commit: typegen + tsc, eslint, prettier, **full** jest lewat `node` (exit code dicatat), `git status`, `git diff --stat`, centang + catatan. Berhenti setelah tiap langkah dan tunggu "lanjut".

- [x] D0. Plan ini + catatan di bawah C5 `docs/plans/2026-11-21-busy-feedback.md` ("dipush `f932293`, PR #22 → `c611c7b`"). Commit `docs: plan the dashboard summary`
- [x] D1. `dashboard-queries.ts` + `server/prefetch-dashboard.ts`. Test dulu: unit (`currentMonthFilters` di akhir bulan, Februari, Desember; `RECENT_QUERY` = hasil parse schema) dan PGlite `@jest-environment node`: state dehydrate berisi **key yang sama dengan `transactionKeys.summary`/`list` yang dibangun client**, data sesuai baris user, baris user lain tidak ikut, query gagal tidak di-dehydrate. Mutation check: misalnya pageSize atau filter berbeda di prefetch → test key merah. Commit `feat(dashboard): prefetch this month's summary and recent transactions`
  - 22 Nov: test dulu, `dashboard-queries.test.ts` (5) dan `server/prefetch-dashboard.test.ts` (4, PGlite). Test prefetch membaca hasilnya kembali seperti browser: `hydrate` ke QueryClient baru, lalu `getQueryData` dengan key yang ditulis literal (`{ from: "2026-11-01", to: "2026-11-30" }`; `{ page: 1, pageSize: 5, sort: "date", order: "desc" }`), jadi yang diuji adalah hash key, bukan objek yang sama. Data uji: baris di luar bulan di kedua sisi (31 Okt, 1 Des), Gaji Oktober (pemasukan bulan ini tetap 0), baris user lain di bulan yang sama. Kegagalan DB = PGlite yang sudah ditutup. Merah dulu: kedua suite "Cannot find module" (modul belum ada). Setelah implementasi 9/9 hijau.
  - Mutation check (dikembalikan sesudahnya, `grep` baris `queryKey`/`retry`/`onError`/`pageSize` dicek): M1 key list `pageSize: 6` → hanya test transaksi terbaru merah; M2 key ringkasan `{ from }` saja → hanya test ringkasan merah; M4 `onError` tanpa log → 2 test kegagalan merah; M5 `RECENT_QUERY` 6 baris → test `RECENT_QUERY` dan test transaksi terbaru merah. M3 (`retry: false` dilepas) **tetap hijau**: lihat Catatan perbaikan.
  - Impor antar-fitur langsung ke file (`@/features/transactions/api/keys`, `…/periods`, `…/server/transactions-repo`), bukan lewat `index.ts` seperti tertulis di `features/README.md`: repo belum punya `index.ts` di fitur mana pun dan impor langsung sudah dipakai (`transactions/api/optimistic.ts` → `categories/api/use-categories`). Barrel yang mencampur kode server dan client juga berisiko masuk ke bundle browser. README belum diubah; ditanyakan ke user.
  - `features/dashboard/.gitkeep` dihapus (folder sudah berisi).
  - Cek (`check.sh`): typegen, tsc, eslint, prettier, jest semua exit 0; 65 suite / 536 test (527 + 9), 0 baris `console.error`.
- [ ] D2. `MonthSummary` (+ export `SummaryCard`). Test dulu per tabel; mutation check (keterangan pemasukan 0 dilepas; hydrate dilepas → fetch terjadi). Browser 390/1024/1440 terang/gelap, nominal panjang di 320/360/390, DESIGN.md bila ada tier baru. Commit `feat(dashboard): show this month's balance, income and expense`
- [ ] D3. `RecentTransactions` (+ export `TransactionRow`). Test dulu per tabel (tambah optimistic lewat `useCreateTransaction` dengan `apiFetch` di-mock); mutation check (klik desktop tanpa `preventDefault`; batas 5 baris). Browser. Commit `feat(dashboard): list the five latest transactions`
- [ ] D4. Pasang di `page.tsx` dengan dua Suspense + skeleton. Browser (dev + `next start`): HTML awal berisi nominal (bukti SSR), tidak ada request `/api/transactions/summary` saat load pertama (network log), skeleton lalu konten (streaming), tambah/ubah/hapus lewat dialog dashboard → kartu dan list berubah, tambah di `/transactions` lalu kembali (Activity) → angka baru, akun demo pada 22 Nov → "Belum ada pemasukan bulan ini" + saldo negatif, axe 0 di 390/1024/1440 × terang/gelap, `agent-browser errors` kosong. Commit `feat(dashboard): stream the dashboard from the server`
- [ ] D5. Cek akhir: full jest 2×, build (env dummy CI; `/dashboard` ◐), self-review `git diff develop...HEAD`, AGENTS.md › Structure (`features/dashboard/`, pola prefetch + HydrationBoundary + key bersama). Push setelah konfirmasi; user membuka PR `feat(dashboard): add the dashboard summary` dan squash-merge.

## File utama
- Baru: `features/dashboard/dashboard-queries.ts`, `features/dashboard/server/prefetch-dashboard.ts`, `features/dashboard/components/` (`month-summary.tsx`, `recent-transactions.tsx`, skeleton) + test di sebelahnya.
- Ubah: `app/(app)/dashboard/page.tsx`, `features/transactions/components/transaction-summary.tsx` (export `SummaryCard`), `features/transactions/components/transaction-groups.tsx` (export `TransactionRow`), `AGENTS.md`, mungkin `DESIGN.md`.
- Dipakai ulang: `summarizeTransactions`, `listTransactions`, `transactionKeys`, `useTransactionSummary`, `useTransactions`, `monthRange`, `todayInJakarta`, `shortDate`, `summaryLayout`, `Money`, `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `editorOpened`, `requireUser`, `db`.

## Verifikasi
- Full jest hijau 2×, 0 `console.error`; setiap test baru merah di bawah mutasinya.
- Browser: nominal sudah ada di HTML server; tidak ada fetch ringkasan pertama dari client; dashboard ikut berubah setelah mutation (dari dialog dan dari halaman lain); axe 0 di 6 kombinasi.
- Build lolos; `/dashboard` partial prerender (header statis, data streaming).

## Belum termasuk
- Dashboard yang terbuka melewati pergantian bulan tetap memakai bulan saat dimuat sampai reload.
- Ringkasan tidak optimistic (refetch setelah mutation), sama dengan halaman Transaksi.

## Catatan perbaikan
- Rancangan menulis QueryClient server diberi `retry: false` "supaya DB gagal tidak menunda render dengan backoff". Premisnya salah: TanStack Query 5.105 sudah tidak me-retry di server (`node_modules/@tanstack/query-core/build/modern/retryer.js:129`: `config.retry ?? (isServer() ? 0 : 3)`). Ketahuan karena mutation M3 tetap hijau. `retry: false` tetap ditulis supaya tidak bergantung pada default itu, komentarnya diubah menjadi apa adanya, dan opsi ini tercatat sebagai **tidak dijaga test**.
