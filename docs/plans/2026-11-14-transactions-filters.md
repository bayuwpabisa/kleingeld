# Plan 14 Nov 2026: Cari, filter, sort, dan pagination transaksi di URL (±2 jam, kemungkinan lebih)

## Context
Tugas jadwal 14 Nov: **"Tabel transaksi: search debounce, filter tanggal/kategori/tipe, sort, pagination server-side; filter di URL"**. Output: *filter bisa dibagikan lewat URL, request lama dibatalkan*.

Status: PR #13 (form transaksi) sudah di-squash-merge ke develop (`36d0dca`). Daftar sekarang selalu menampilkan halaman 1 (`FIRST_PAGE` di `transaction-list.tsx`), dan API hanya menerima `page`/`pageSize`. Setelah task ini: task 15 Nov (test form + tabel, rilis v0.2).

Keputusanmu untuk task ini:
- **Paging ikut wireframe**: desktop memakai nomor halaman (`page` di URL), HP memakai "Muat lebih banyak" (`useInfiniteQuery`, jumlah yang sudah dimuat tidak masuk URL).
- **Filter tanggal = Periode + rentang**: select "Periode" berisi Semua waktu (default), 12 bulan terakhir, dan "Rentang tanggal…" (input Dari/Sampai). API memakai `from`/`to`.
- **Kartu ringkasan lewat endpoint terpisah** `GET /api/transactions/summary` dengan filter yang sama. Setelah mutation, ringkasan di-invalidate (tidak optimistic).

Yang sudah ada dan dipakai ulang:
- `schemas/transaction.ts` (`transactionListQuerySchema`, `TransactionPage`, `DEFAULT_PAGE_SIZE`), repo `features/transactions/server/transactions-repo.ts` (`selectDtos`, `toDto`, scope per user), test PGlite (`db/testing/test-db.ts`).
- `features/transactions/api/`: `keys.ts`, `fetch-transactions.ts` (sudah meneruskan `signal`), `use-transactions.ts` (`keepPreviousData`), `cache.ts`, `optimistic.ts` (`snapshotLists`, `updateLists`, `restoreLists`), tiga hook mutation (sudah `invalidateQueries(transactionKeys.all)`).
- `components/ui/`: `Input`, `Select` (native, chevron), `SegmentedControl`, `Button` (`sm`), `Money`, `EmptyState`, `ErrorState`, `Skeleton`, `Card`. `useCategories()`. `lib/date.ts` (`todayInJakarta`, `formatDate`).
- `transaction-table.tsx`, `transaction-groups.tsx`, `transaction-list-skeleton.tsx`, `test/render-with-providers.tsx`.
- Wireframe `04 Transaksi` (Desktop/Mobile), DESIGN.md (Chip/filter, Kartu ringkasan, Tabel transaksi dengan `aria-sort`, States "Kosong karena filter/cari"), review.md (chip "Pemasukan/Pengeluaran", bukan "Masuk/Keluar"; "Saldo", bukan "Selisih").

## Cara kerja (sama seperti 11–13 Nov)
Setiap langkah: test dulu sampai gagal, lalu implementasi. Sebelum commit: review ulang diff terhadap plan + AGENTS.md, lalu jalankan lint/typecheck/test. Setiap kesalahan dicatat di **Catatan perbaikan** + dirangkum di chat. Sebelum langkah 4, baca docs Next 16 di `node_modules/next/dist/docs/` untuk `useSearchParams` dan `useRouter` (Suspense + cacheComponents). Server dev dimatikan lewat PID port (`taskkill /T`).

## Keputusan

### Kontrak query (`schemas/transaction.ts`)
- Nama parameter sama di API dan URL: `q`, `type`, `category`, `from`, `to`, `sort`, `order`, `page` (`pageSize` hanya di API).
  - `q`: trim, maksimal 100 karakter, kosong → tidak ada filter.
  - `type`: `income` | `expense`. `category`: uuid.
  - `from`/`to`: `YYYY-MM-DD`, inklusif. Refine: `from` ≤ `to` (pesan "Tanggal awal harus sebelum tanggal akhir").
  - `sort`: `date` | `amount` (default `date`), `order`: `asc` | `desc` (default `desc`).
- `transactionFiltersSchema` (q, type, category, from, to) dipakai bersama oleh list dan summary. `transactionListQuerySchema` = filters + sort/order + page/pageSize.
- Tipe `TransactionSummary = { income: { total, count }, expense: { total, count }, balance }`.
- URL ↔ query (`features/transactions/list-query-url.ts`, murni):
  - `parseListQuery(searchParams)`: nilai yang tidak valid di URL diabaikan (kembali ke default) dan tidak menimbulkan error, karena URL bisa diketik tangan.
  - `toSearchParams(query)`: hanya nilai yang berbeda dari default, dengan urutan tetap, supaya URL pendek dan stabil, mis. `/transactions?q=kopi&type=expense&page=2`.

### Server
- `listTransactions` mendapat pembangun kondisi `filterConditions(userId, filters)` yang juga dipakai summary:
  - `q` = `ILIKE` pada `note` **atau** nama kategori (baris tanpa catatan tampil dengan nama kategori). `%`, `_`, `\` di-escape.
  - `sort`: tanggal atau nominal, ditambah tie-breaker tetap (`date desc`, `createdAt desc`, `id desc`), supaya halaman tidak saling tumpang tindih.
  - `total` dihitung dengan `count()` + join kategori (`$count` tidak bisa join).
- `summarizeTransactions(db, userId, filters)`: `count` + `sum(amount)` per tipe (hasil `sum` dari Postgres berupa string → `Number`). Fungsi ini bisa dipakai lagi oleh dashboard SSR (16 Nov).
- `GET /api/transactions` menerima semua parameter (400 untuk nilai tidak valid). Route baru `app/api/transactions/summary/route.ts`: 401 tanpa sesi, 400, 200. Segmen statis `summary` didahulukan oleh Next daripada `[id]`.
- Index yang ada (`user_id, date`) cukup untuk data per user di MVP. Tidak ada index trigram.

### Data di client
- Keys: `list(query)` (desktop, berhalaman), `infinite(queryTanpaPage)` (HP), `summary(filters)`. Dua key pertama berada di bawah `lists()`, sehingga snapshot/cancel/invalidate tetap mencakup keduanya.
- Hook: `useTransactions` (tetap `keepPreviousData`), `useInfiniteTransactions` (`getNextPageParam` dari `page*pageSize < total`), `useTransactionSummary` (`keepPreviousData`).
- **Request lama dibatalkan**: `signal` dari TanStack diteruskan ke `fetch`. Saat key berganti, query lama kehilangan observer dan dibatalkan (TanStack membatalkan query yang memakai signal). Pencarian juga di-debounce 300 ms. Keduanya dites.
- **Cache optimistic tetap benar untuk list yang difilter** (`cache.ts`, murni):
  - `matchesFilters(tx, filters)`: q (huruf besar/kecil diabaikan, cocok ke catatan/kategori), tipe, kategori, dan rentang tanggal.
  - `compareTransactions(sort, order)` menggantikan urutan tetap di `sortTransactions`.
  - `insertTransaction(page, tx, query)` hanya menyisipkan ke list yang filternya cocok.
  - `replaceTransaction` menghapus baris yang tidak lagi cocok (`total − 1`).
  - Kunci query dibaca dari `QueryKey` di `updateLists`.
- `updateLists` menangani dua bentuk data: `TransactionPage` dan `InfiniteData<TransactionPage>`. Untuk infinite, sisipan masuk ke halaman pertama tanpa dipotong ke `pageSize`, supaya tidak ada baris yang hilang sementara.
- Summary tidak diubah secara optimistic: `invalidateQueries(transactionKeys.all)` yang sudah ada ikut memuat ulang summary (key-nya di bawah `all`).

### State URL (`features/transactions/use-list-query.ts`)
- `useSearchParams` → `parseListQuery`. Setter `setFilters` (selalu reset ke halaman 1, dan kategori dikosongkan kalau tipenya tidak cocok), `setSort` (reset halaman), `setPage`, `clearFilters` (sort tetap).
- `router.push` (scroll: false) untuk pilihan filter/sort/halaman, sehingga tombol Back bekerja. `router.replace` untuk ketikan pencarian, supaya riwayat tidak penuh.
- `TransactionList` dibungkus `<Suspense>` dengan skeleton di `page.tsx` (cacheComponents). Halaman tetap prerender.
- `useMediaQuery("(min-width: 1024px)")` (`lib/use-media-query.ts`, `useSyncExternalStore`, server snapshot `null` → skeleton) memilih `DesktopList` (berhalaman) atau `PhoneList` (infinite). Jadi hanya satu query yang berjalan, tidak keduanya.
- `useDebouncedCallback` milik sendiri (`lib/use-debounced-callback.ts`), tanpa dependency baru.

### UI (wireframe 04, DESIGN.md)
- **Toolbar** (`transaction-toolbar.tsx`):
  - Cari (`type="search"`, label "Cari transaksi", ikon kaca pembesar, tombol hapus). Teks input disimpan lokal dan hanya diganti dari URL kalau URL diubah dari luar (Hapus filter, Back), bukan oleh debounce sendiri. Ketikan yang sedang berlangsung tidak terpotong.
  - Chip select native **Periode** ("Semua waktu", "November 2026", …, "Rentang tanggal…"). Rentang memunculkan input Dari/Sampai, dengan error di bawah field kalau Dari > Sampai, dan filter tidak diterapkan selama error.
  - **Kategori** ("Semua kategori", `<optgroup>` Pengeluaran/Pemasukan, difilter sesuai tipe).
  - **Urutkan** (Terbaru, Terlama, Nominal terbesar, Nominal terkecil).
  - Tipe **Semua / Pemasukan / Pengeluaran** (`SegmentedControl`).
  - Desktop satu baris (`md` 40px). HP: cari, lalu chip di baris sendiri (`sm`), sesuai DESIGN.md.
  - Chip select = varian baru di `components/ui/` (`ChipSelect`, rounded-full, terpilih `bg-primary-soft border-primary text-primary`), dengan label aksesibel.
- **Kartu ringkasan** (`transaction-summary.tsx`):
  - Pemasukan (N transaksi), Pengeluaran (N transaksi), Saldo (bertanda, keterangan periode: "Semua waktu" / "November 2026" / "1–15 Nov 2026").
  - Desktop 3 kartu. HP 2 kartu (Pemasukan, Pengeluaran) sesuai wireframe.
  - Ada skeleton dan error kecil + Coba lagi.
- **Tabel**: header Tanggal dan Nominal menjadi `<button>` dengan ikon arah, dan `<th aria-sort>`. Klik kolom aktif membalik urutan. Klik Nominal saat belum aktif → terbesar dulu.
- **Pagination** (`components/ui/pagination.tsx`): `<nav aria-label="Halaman">`, ‹ 1 … 4 5 6 … 9 ›, `aria-current="page"`, ukuran `sm`. Teks "Menampilkan 21–40 dari 42 transaksi".
- **HP**: tombol "Muat lebih banyak" (secondary, busy saat memuat, hilang di halaman terakhir), dan teks "Menampilkan 40 dari 42 transaksi".
- **States**:
  - Tanpa filter dan `total` 0 → state pertama kali (yang sudah ada).
  - Dengan filter dan 0 hasil → "Tidak ada transaksi untuk "kopi" di November 2026." + **Hapus filter**. Kalimatnya dibuat oleh fungsi murni `describeEmptyFilter`.
  - `page` melebihi halaman terakhir (URL lama atau setelah menghapus) → `router.replace` ke halaman terakhir.
  - Saat memuat filter baru, data lama tetap tampil (`aria-busy`, sedikit pudar).
  - Region `aria-live="polite"` (sr-only) mengumumkan "12 transaksi ditemukan" setelah cari/filter.

## File
- `schemas/transaction.ts` (+test), `features/transactions/list-query-url.ts` (+test), `features/transactions/describe-empty-filter.ts` (+test).
- `features/transactions/server/transactions-repo.ts` (+test PGlite), `app/api/transactions/route.ts` (+test), `app/api/transactions/summary/route.ts` (+test).
- `features/transactions/api/`: `keys.ts`, `fetch-transactions.ts`, `fetch-summary.ts`, `use-transactions.ts`, `use-infinite-transactions.ts`, `use-transaction-summary.ts`, `cache.ts` (+test), `optimistic.ts`, `use-*-transaction.ts`, `mutations.test.tsx`.
- `features/transactions/use-list-query.ts`, `lib/use-media-query.ts`, `lib/use-debounced-callback.ts` (+test).
- `components/ui/chip-select.tsx`, `components/ui/pagination.tsx` (+test, axe).
- `features/transactions/components/`: `transaction-toolbar.tsx`, `transaction-summary.tsx`, `transaction-list.tsx` (Desktop/Phone), `transaction-table.tsx` (header sort), `transaction-list.test.tsx` (+test toolbar/integrasi).
- `app/(app)/transactions/page.tsx` (Suspense), `jest.setup.ts` (stub `matchMedia`) + helper `test/viewport.ts`.
- `DESIGN.md` (chip Pemasukan/Pengeluaran, Saldo di halaman transaksi), `README.md` (roadmap), `AGENTS.md` › Structure, `docs/plans/2026-11-14-transactions-filters.md`.

## Test (ditulis dulu)
- **schema/URL**:
  - Parameter valid diterima, dan `from` > `to` ditolak.
  - `parseListQuery` mengabaikan nilai rusak (`page=abc`, `type=x`, uuid salah).
  - `toSearchParams` hanya menulis nilai non-default. Bolak-balik URL → query → URL hasilnya sama.
- **repo (PGlite)**:
  - Cari ke catatan dan nama kategori, tanpa membedakan huruf besar/kecil. `%`/`_` dicari sebagai huruf biasa.
  - Filter tipe, kategori, dan rentang (inklusif).
  - Sort nominal/tanggal kedua arah, dengan tie-breaker stabil antar halaman.
  - `total` sesuai filter. Summary per tipe dan saldo. Data user lain tidak pernah ikut.
- **routes**: 401, 400 (`from` > `to`, `sort=x`), 200 meneruskan filter ke repo, summary 200.
- **cache**:
  - `matchesFilters`.
  - Sisipan hanya ke list yang cocok, sesuai urutan sort.
  - Ubah yang keluar dari filter → hilang + `total − 1`.
  - Bentuk infinite ditangani.
- **mutation**: tambah saat filter "Makan" aktif → muncul di list Makan, tidak muncul di list "Gaji". Gagal → semua list (termasuk infinite) kembali seperti semula.
- **hooks**:
  - Debounce memanggil sekali setelah 300 ms (fake timers).
  - Ganti filter saat request lama belum selesai → `signal.aborted === true`.
- **UI** (`renderWithProviders`, mock `next/navigation` + `apiFetch`):
  - Ketik "kopi" → satu request dengan `q=kopi` + URL `?q=kopi`.
  - Pilih Pengeluaran → `type=expense&page` hilang. Kategori difilter sesuai tipe.
  - Klik header Nominal → `aria-sort="descending"`.
  - Pagination ke halaman 2.
  - Filter tanpa hasil → kalimat + Hapus filter.
  - HP: Muat lebih banyak menambah baris.
  - Kartu ringkasan.
  - Axe tanpa pelanggaran untuk toolbar, tabel, dan pagination.

## Langkah dan commit
- [x] 0. `git switch develop && git pull`, cek `git diff develop feature/transaction-form` kosong, lalu `git branch -D feature/transaction-form`. Branch `feature/transactions-filters`. Simpan plan ke `docs/plans/2026-11-14-transactions-filters.md`, centang box 9 plan 13 Nov. Commit `docs: add transactions filters plan`
- [x] 1. Schema filter/sort + URL helpers. Commit `feat(transactions): add filters and sort to the list query`
- [x] 2. Repo filter/cari/sort + summary + routes. Commit `feat(api): filter, sort and summarize transactions`
- [x] 3. Keys/hooks (paged, infinite, summary) + cache sadar filter + `updateLists` dua bentuk. Commit `feat(transactions): keep filtered lists correct after optimistic changes`
- [x] 4. `useListQuery` (URL) + `useMediaQuery` + debounce. Commit `feat(transactions): keep search, filters, sort and page in the url`
- [x] 5. `ChipSelect` + `Pagination`. Commit `feat(ui): add chip select and pagination`
- [x] 6. Toolbar + kartu ringkasan + header sort + list desktop/HP + states. Commit `feat(transactions): add search, filters, sort and pagination`
- [x] 7. DESIGN.md + README + AGENTS. Commit `docs: document transaction filters`
- [ ] 8. Verifikasi, push, PR `feat: add transaction search, filters and pagination`, `ci` + Vercel hijau, squash merge (kamu), titik cek ke 15 Nov.

## Verifikasi
1. Lint, typecheck, test, format:check, dan build dengan env dummy CI semuanya hijau. `/transactions` tetap prerender sebagian.
2. Manual di `npm run dev` lewat agent-browser (akun demo):
   - **Desktop**:
     - Ketik "kopi" → satu request setelah jeda, URL `?q=kopi`, ringkasan berubah.
     - Ketik cepat → request lama berstatus canceled di log network.
     - Pilih Periode bulan lalu, kategori, dan tipe.
     - Klik header Nominal → urutan berubah.
     - Halaman 2 → reload: filter dan halaman tetap.
     - Salin URL ke tab baru: sama. Back mengembalikan filter sebelumnya.
     - Rentang Dari > Sampai → pesan error.
     - Filter tanpa hasil → Hapus filter.
   - **Optimistic dengan filter**: tambah transaksi Makan saat filter Makan aktif → langsung muncul. Ubah kategorinya → hilang dari list itu.
   - **HP 390px**: chip di baris sendiri, Muat lebih banyak sampai habis, dan filter di URL.
   - **Keyboard**: Tab melewati toolbar → header sort → pagination. Fokus terlihat.
   - Axe 0 pelanggaran (terang dan gelap, desktop dan HP). `get_errors` kosong.
3. Self-review `git diff develop...HEAD` terhadap checklist Keputusan.

## Catatan perbaikan
- Langkah 1: default `sort`/`order` yang baru membuat pemanggil lama (`{ page, pageSize }`) gagal typecheck, dan dua test route mengharapkan objek tanpa sort. Pemanggil diganti `DEFAULT_LIST_QUERY`, dan ekspektasi test route ditambah `sort`/`order`.
- Langkah 2: test escape `_` yang pertama ("i_k") tetap lulus walaupun `_` tidak di-escape, jadi test itu tidak membuktikan apa-apa. Diganti "makan_siang", yang hanya cocok ke "Makan siang" kalau `_` dijadikan wildcard.
- Langkah 2: `escapeLike` ditulis lewat heredoc shell, dan backslash-nya hilang. Test "50%" langsung gagal, lalu diperbaiki dengan Edit. Setelah itu, script node untuk catatan ini gagal karena ada backtick di dalam template string, sehingga commit langkah 2 terkirim tanpa centang box dan catatan. Keduanya masuk di commit langkah 3. Teks yang berisi backslash atau backtick sekarang ditulis dengan Edit/Write, bukan lewat shell.
- Langkah 3: penyimpangan nama file. `fetchTransactionSummary` berada di `fetch-transactions.ts`, bukan di `fetch-summary.ts` terpisah, karena memakai helper URL yang sama. Query sebuah list dibaca kembali dari key-nya lewat schema (`listQueryFromKey`), jadi tidak ada cast. List infinite di-update sebagai satu list, lalu dibagi lagi sesuai panjang halaman, dan semua halaman mendapat `total` yang sama.
- Langkah 3: request default sempat menjadi `/api/transactions?` (tanda tanya kosong). Sekarang `?` hanya ditulis kalau ada parameter. Mock di `transaction-dialogs.test.tsx` mencocokkan `"/api/transactions?"`, jadi ikut diperbarui.
- Langkah 3: di awal, test mutation memakai variabel `utilsCategories` yang tidak ada (salah tulis), dan typecheck menangkapnya. Push kategori itu ternyata tidak perlu, sehingga dihapus.
- Langkah 4: **penyimpangan dari plan, berdasarkan docs Next 16.** `router.push`/`replace` diganti `window.history.pushState`/`replaceState`. Docs `linking-and-navigating.md` › Native History API menyebutkan keduanya tersinkron dengan `useSearchParams`, jadi mengganti filter tidak memicu request RSC ke server dan halaman tidak di-scroll ke atas. Back tetap mengembalikan filter sebelumnya (push), dan ketikan pencarian memakai replace. Untuk test dibuat `test/url-navigation.ts`, pengganti `next/navigation` yang membaca `window.location` jsdom, sehingga test bisa memeriksa URL dan panjang history yang sebenarnya.
- Langkah 4: `jest.setup.ts` memasang `matchMedia` palsu dengan lebar desktop (1280) di setiap test DOM (`test/viewport.ts`, `setViewportWidth`), karena jsdom tidak punya `matchMedia`.
- Langkah 4: output `tsc` beberapa kali tertelan oleh pipe/wrapper shell. Dibuat script cek di scratchpad yang menjalankan tsc, eslint, dan jest lewat `node` langsung, lalu mencetak exit code masing-masing.
- Langkah 5: **penyimpangan dari plan.** Filter tipe memakai `ChipRadioGroup` baru (chip berisi radio native, di `components/ui/chip.tsx` bersama `ChipSelect`), bukan `SegmentedControl`. Alasannya, di wireframe 04 (desktop dan HP) tipe tampil sebagai chip sebaris dengan chip lain. Di HP, segmented control setinggi 44px tidak serasi dengan chip 32px. Chip memakai `h-8 lg:h-10` sesuai tabel Ukuran kontrol (HP di baris sendiri, desktop sebaris dengan kolom cari). Filter yang aktif juga ditandai `data-active` (select) atau `checked` (radio), jadi tidak hanya lewat warna.
- Langkah 5: `pageItems` selalu menghasilkan 7 item (mis. `1 2 3 4 5 … 9`), supaya bar pagination tidak berubah lebar saat pindah halaman.
- Langkah 6: draf pertama toolbar memuat stub kosong (`RangeChosenMarker`, `RangeFields` yang hanya `return null`) dan cast `as [TransactionSort, SortOrder]`. Ketahuan saat review sebelum test dijalankan, lalu ditulis ulang: state "rentang dipilih" diangkat ke toolbar (dipakai chip Periode dan input Dari/Sampai), dan pilihan urutan memakai tabel `SORT_OPTIONS` tanpa cast.
- Langkah 6: dua masalah logika ditemukan saat review. (1) Kalau rentang yang diketik kebetulan pas satu bulan, periode berubah menjadi bulan dan input tanggal bisa hilang saat masih difokus. (2) Memilih "Semua waktu" saat periode sudah "Semua waktu" tidak menutup input tanggal. Sekarang chip Periode selalu menentukan buka/tutup secara eksplisit, dan perubahan dari luar (Hapus filter, Back) hanya menutup saat periode kembali ke "Semua waktu".
- Langkah 6: kotak cari menyimpan teks lokal plus pencarian terakhir yang ia kirim (`sent`), sehingga URL yang berasal dari debounce-nya sendiri tidak menimpa ketikan yang lebih baru, sedangkan perubahan dari luar (Hapus filter) mengosongkan kotak. Ada test untuk keduanya. **Koreksi (R5):** saat ditulis, test itu belum ada. Test-nya baru ditambahkan di R1: `transaction-toolbar.test.tsx` › "keeps newer typing when its own search reaches the URL late" dan "shows a search changed elsewhere (Back, Hapus filter)". Test pertama dibuktikan dengan mutasi 1 di tabel R1. Untuk test kedua tidak ada mutasi yang tercatat.
- Langkah 6: penyimpangan nama file. `periods.ts` berisi `monthRange`, `recentMonths`, `periodOf`, `periodLabel`, dan `periodPhrase`, yang dipakai chip Periode, kartu Saldo, dan kalimat kosong. File ini tidak ada di plan.
- Langkah 6: ekspektasi test kartu ringkasan awalnya lupa bahwa teks Money berisi "Rp". Selain itu, satu test axe memicu warning `act(...)` dari `next/link`: jsdom tidak punya `IntersectionObserver`, sehingga Link memakai timer yang bisa berjalan setelah test selesai. `jest.setup.ts` diberi `IntersectionObserver` minimal yang tidak pernah terpicu, dan output test sekarang tanpa `console.error`.
- Langkah 6: nominal kartu ringkasan di HP memakai `text-xl` (desktop `text-2xl`), supaya dua kartu berdampingan di lebar 390px muat sampai ratusan juta. Untuk nominal miliaran perlu dicek saat audit 21 Nov. **Koreksi (R5): salah.** Klaim ini tanpa ukur. Di 320px data demo asli (Rp19.898.000) sudah meluap (140 di 132), dan di 360px 8 digit kurang 4,3px (R4, H2a). Sekarang ukuran mengikuti jumlah digit (`summaryLayout`); lihat H2.
- Cek browser: chip select yang aktif memakai `font-medium`, padahal select native selebar opsi terpanjang dalam huruf normal. Teks tebal jadi lebih lebar, baris chip ter-wrap di 1440px, dan kotak cari ikut turun karena `items-center`. Diperbaiki tiga hal: chip aktif tidak menebal (DESIGN.md hanya menyebut border, latar, dan warna); `field-sizing: content` membuat chip selebar opsi yang dipilih (seperti "1–30 Nov 2026 ▾" di wireframe), dan browser tanpa dukungan tetap memakai lebar intrinsik (**Koreksi (R5):** dibatalkan di R4a, karena chip setelahnya bergeser saat pilihan berubah, dan alasan awalnya berasal dari diagnosis yang salah, lihat kesalahan #10); toolbar memakai `lg:items-start`, supaya kotak cari sejajar baris pertama kalau chip ter-wrap di layar `lg` yang sempit. Sempat dikira "Rentang tanggal…" terpotong, ternyata "…" memang bagian label.
- Cek browser: `fill` dan ketikan keyboard dari agent-browser tidak masuk ke `<input type="date">` headless (segmen dd/mm/yyyy). Tanggal diisi lewat setter `value` native + event `input`, yaitu jalur yang dipakai React. Di test RTL, `user.type` bekerja.
- Hasil cek browser (agent-browser, demo, `next dev`):
  - **Desktop 1440**: mengetik "kopi" menghasilkan satu request list + satu request summary `q=kopi` (tanpa `q=k`/`q=ko`), dan pencarian ikut cocok ke kategori "Kopi & jajan". Header Nominal → `?type=expense&sort=amount` dengan `aria-sort="descending"`. Halaman 2 → `&page=2`, dan Back kembali ke halaman 1 tanpa request RSC. **Koreksi (R5):** "tanpa request RSC" waktu itu belum dicek di log network. Buktinya baru ada di R4: setelah ganti tipe, ke halaman 2, lalu Back, hanya ada 3 request API dan tidak ada `_rsc`.
  - **Filter tanpa hasil**: kalimat "Tidak ada transaksi untuk “zzzz” di November 2026." + Hapus filter → URL, kotak cari, dan Periode kembali kosong.
  - **Rentang**: Dari 10 Nov → `?from=2026-11-10`. Sampai 1 Nov → pesan error dan tidak diterapkan. Sampai 20 Nov → `&to=2026-11-20`, dan chip serta kartu Saldo menulis "10–20 Nov 2026".
  - **HP 390**: `?type=expense&page=3` (page diabaikan) menampilkan 20 dari 177, Muat lebih banyak → 40 dari 177, tanpa scroll horizontal.
  - **Tema gelap** dengan `category=x` (tidak valid, diabaikan) dan urutan nominal naik: nominal yang sama diurutkan menurut tanggal terbaru.
  - **Filter Makan + POST diblokir**: baris ditarik kembali + toast Coba lagi. Setelah blokir dibuka, Coba lagi berhasil dan baris muncul di list Makan (93 → 94).
  - Axe 0 pelanggaran di semua kondisi di atas (terang/gelap, desktop/HP, kosong, rentang dengan error). `get_compilation_issues` dan `get_errors` kosong. **Koreksi (R5):** hasil axe per kondisi dan isi "incomplete" waktu itu tidak dicatat, jadi klaim ini tanpa bukti. Selain itu, list HP yang diurutkan menurut nominal saat itu masih punya bug key ganda (`get_errors` menangkapnya di R4) dan pelanggaran `landmark-unique` (jest-axe di H1). Jadi "kosong" dan "0 pelanggaran" tidak berlaku untuk HP `sort=amount`. Hasil axe yang terbukti, setelah perbaikan, ada di H3 (11 kondisi, 0 pelanggaran).
  - Pembatalan request lama tidak bisa dipicu di dev lokal, karena respons terlalu cepat. Bukti pembatalannya adalah test `use-transactions.test.tsx` (`signal.aborted`).
- Verifikasi akhir: lint, typecheck, format, 437 test (tanpa `console.error`), dan build dengan env dummy CI semuanya hijau. `/transactions` tetap ◐. Dev server dimatikan lewat PID port, dan port 3000 kosong.

## Perbaikan setelah review
Kamu meminta semua kesalahan task ini diperbaiki dan dicegah supaya tidak terulang. Branch ini belum punya PR, jadi perbaikannya masuk ke PR yang sama.

### Kesalahan yang sudah tercatat, dan yang masih kurang
| # | Kesalahan | Yang masih kurang | Langkah |
|---|---|---|---|
| 1 | `escapeLike` kehilangan backslash (heredoc) | aturan pencegahan | aturan 1 |
| 2 | test escape `_` tidak membuktikan apa-apa | mutation check untuk test penggantinya | R2 |
| 3 | commit langkah 2 tanpa catatan plan | tidak ada (squash merge, history tidak diubah) | aturan 2 |
| 4 | stub kosong + cast di draf toolbar | toolbar tanpa test sendiri | R1 |
| 5 | dua bug logika input rentang | tanpa test regresi | R1 |
| 6 | warning `act()` dari `next/link` | tidak ada penjaga untuk warning baru | R3 |
| 7 | chip aktif menebal, baris pecah di 1440 | 1024/1280 dan browser tanpa `field-sizing` belum dicek | R4 |

### Kesalahan lain yang ditemukan saat menelusuri ulang sesi
| # | Kesalahan | Langkah |
|---|---|---|
| 8 | `git diff … && git branch -D …` dalam satu perintah: branch terhapus sebelum diff dibaca (`git diff` keluar 0 walaupun ada beda). Hasilnya aman, tetapi itu kebetulan. | aturan 9 |
| 9 | `git stash`/`stash pop` hanya untuk membandingkan file lama | aturan 10 |
| 10 | `field-sizing: content` ditambahkan atas diagnosis yang salah ("…" ternyata bagian label) | R4: dinilai ulang |
| 11 | chip Kategori dengan id tidak dikenal tetap aktif tetapi menulis "Semua kategori" | R1b |
| 12 | klaim tanpa bukti: "Ada test untuk keduanya" (kotak cari), "tanpa request RSC", "axe 0 di semua kondisi", optimistic "langsung tampil" dan alur ubah di browser, "nominal HP muat sampai ratusan juta", memory "browser-checked" | R4 + R5 |
| 13 | test toolbar, ringkasan, dan list ditulis setelah komponennya | aturan 3 |
| 14 | scope commit `api` tidak ada di `scope-enum` | aturan 11 |
| 15 | kesalahan kecil yang tertangkap tool: salah ketik `utilsCategories`, `?` kosong di URL, narrowing `in` → `never`, ekspektasi tanpa "Rp" | aturan 3 + 4 |

### Aturan kerja tetap (juga disimpan di memory)
1. Kode/teks yang berisi `\`, backtick, atau `$` hanya ditulis dengan Edit/Write, tidak lewat heredoc atau `node -e`.
2. Satu perintah, satu tujuan. Script edit tidak dirantai dengan `git commit`. Sebelum commit: exit code, `git status`, `git diff --stat`, centang + catatan plan.
3. Test dulu dan harus terlihat merah. Setiap test regresi dibuktikan dengan mutation check (perbaikannya dibalik sementara → test gagal → kode dikembalikan → `git diff` hanya berisi test).
4. Tidak ada stub, placeholder, atau cast. UI yang punya state: pemilik state dan tabel transisinya ditulis di plan, dan setiap transisi mendapat test.
5. Output test harus bersih: `console.error` membuat test gagal.
6. UI dicek di browser per langkah sebelum commit, di 390/1024/1440px, terang dan gelap.
7. Setiap klaim menyebut buktinya. Yang belum dicek ditulis "belum dicek".
8. Cek akhir lewat `node` langsung, dan exit code-nya dicatat.
9. Aksi destruktif atau yang sulit dibalik berupa perintah terpisah setelah hasil cek dibaca.
10. Versi lama sebuah file dilihat dengan `git show <rev>:<path>`, bukan `git stash`.
11. Scope commit hanya dari `scope-enum` commitlint.
12. Penyebab temuan browser dipastikan dulu (ukur atau baca kode) sebelum diperbaiki. Rekomendasi desain diperiksa dulu terhadap DESIGN.md (terutama Aksesibilitas, mis. urutan Tab = urutan visual) sebelum ditawarkan. Kalimat ini ditambahkan di R5, karena di R4 saya merekomendasikan susunan toolbar yang melanggar aturan itu.

### Langkah perbaikan
- [x] R0. Cek awal (branch bersih, sama dengan origin `e38e6c8`, PR belum ada), lalu catatan ini. Commit `docs: plan fixes after the filters review`
- [x] R1. Test regresi toolbar (`transaction-toolbar.test.tsx`): kotak cari (URL terlambat, perubahan dari luar, Enter, tombol hapus), rentang/periode (rentang satu bulan penuh tetap terbuka, "Semua waktu" menutup, Hapus filter menutup, pilih bulan menutup), tipe/kategori, dan axe. Mutation check per kelompok. Commit `test(transactions): cover the toolbar's search and period states`
- [x] R1b. Chip Kategori dengan id tidak dikenal: test merah dulu, lalu perbaikan. Commit `fix(transactions): name an unknown category filter honestly`
- [x] R2. Mutation check test escape `_` dan `%` (tanpa commit kode)
- [x] R3. Penjaga `console.error` di `jest.setup.ts` + bukti penjaganya bekerja + AGENTS.md. Commit `test: fail tests that log console errors`
- [x] R4. Cek ulang di browser: 1024/1280/1440, tanpa `field-sizing`, penilaian ulang `field-sizing`, optimistic tambah/ubah sebelum server menjawab, nominal besar di HP, log network tanpa `_rsc`, axe per kondisi + isi "incomplete" (selesai lewat R4a/R4b, lalu H1, H1b, H2, dan H3 di file handoff)
- [x] R5. Koreksi catatan dan memory. Commit `docs: correct the filters notes`
- [ ] R6. Verifikasi akhir, self-review `git diff e38e6c8..HEAD`, push, lalu PR (kamu)

### Catatan perbaikan ronde ini
- R1: `transaction-toolbar.test.tsx` berisi 18 test. Dijalankan terhadap kode lama: 15 hijau, dan hanya 3 test kategori (R1b) yang merah, sesuai harapan. Hasil mutation check (setiap mutasi dibalik sesudahnya, lalu `git diff --exit-code` toolbar dicek kosong):

  | Mutasi | Ditangkap oleh |
  |---|---|
  | 1. cek `ownSearch` dihapus | "keeps newer typing when its own search reaches the URL late" |
  | 2. `setRangeOpen(false)` tanpa syarat | "keeps the date fields open while typing a range that is a whole month" |
  | 3. chip Periode hanya membuka input | "closes the date fields when Semua waktu is picked again" + "… when a month is picked" |
  | 4. kategori tidak dibuang saat tipe berganti | **awalnya lolos**: `toHaveBeenCalledWith` menganggap `{ category: undefined }` sama dengan tidak ada key. Kesalahan yang sama dengan #2. Assertion diganti `toStrictEqual` pada `mock.calls`, lalu tertangkap |
  | 5. pengosongan cari tanpa key `q` | "clears the search and keeps the focus in the box" (sudah `toStrictEqual`) |
  | 6. Enter tanpa `debounced.cancel()` | "searches at once on Enter, and only once" |
  | 7. opsi cadangan kategori dimatikan (R1b) | 3 test label kategori |
  | 8. `key` toolbar dibuat konstan | "closes empty date fields and keeps the focus when the filters are cleared" |
  | 9. efek fokus dimatikan | test yang sama (`toHaveFocus`) |

- R1, **temuan baru** saat menyusun test: input rentang yang dibuka tanpa diisi tidak tertutup oleh Hapus filter (periode tetap "Semua waktu"). Selain itu, fokus jatuh ke `body` karena tombol Hapus filter hilang. Test merah dulu, lalu diperbaiki: `TransactionList` memberi toolbar `key` baru setiap Hapus filter (state UI toolbar kembali awal), dan efek memindahkan fokus ke kotak cari (`searchRef`).
- R1b: `CategoryOptions` menambah opsi cadangan kalau kategori di URL tidak ada di daftar yang tampil: nama kategorinya (kalau disembunyikan filter tipe), "Memuat kategori…", atau "Kategori tidak ditemukan". Kalimat kosong untuk kategori yang tidak dikenal: "Tidak ada transaksi di kategori yang tidak ditemukan." (`describeEmptyFilter` menerima `null` = tidak ditemukan, `undefined` = belum termuat).
- R1b: kesalahan test saya sendiri: `renderToolbar(…, undefined)` memakai nilai default parameter, jadi "kategori masih dimuat" tidak pernah teruji. Diganti opsi eksplisit `{ loading: true }`.
- Penyimpangan dari plan: R1, R1b, dan perbaikan Hapus filter masuk **satu commit**, karena ketiganya mengubah `transaction-toolbar.tsx`. Memecahnya menjadi commit yang masing-masing hijau butuh staging per hunk interaktif (`git add -p`), yang tidak tersedia di sini. Isinya dirinci di body commit.
- R2, mutation check `escapeLike` (setiap mutasi dikembalikan, lalu `git diff --exit-code` repo dicek kosong):
  - tanpa `_` → gagal di `q: "makan_siang"` ✓
  - tanpa `%` → gagal di `q: "%"` ✓. Baris `q: "50%"` sendiri tetap lolos tanpa escape (lemah), tetapi baris `"%"` menutupinya.
  - tanpa `\` → **tidak ada test yang menjaganya**. Ditambah test "treats a backslash as a plain character". Versi pertamanya (`q: "\%"`) **juga lolos** di bawah mutasi: tanpa escape `\`, versi mutan menjadi `\\%` (backslash literal + wildcard), yang juga tidak menemukan apa-apa. Analisis saya salah. Diganti `q: "\a"` (tanpa escape berarti huruf "a" dan menemukan banyak baris), lalu tertangkap ✓.
  - Karena ada test baru, R2 tetap butuh satu commit test (plan semula: tanpa commit).
- R4 (pengamatan sebelum ada perubahan, agent-browser, `measure()` = top/left/width tiap bagian toolbar):
  - Kotak cari selalu sejajar baris chip pertama (top 120), dan tidak ada scroll horizontal di 1024/1280/1440. Tetapi di 1024 chip bertingkat 3 baris di kolom sempit, dan di 1280 chip tipe sendirian di baris 2.
  - Network setelah ganti tipe, ke halaman 2, lalu Back: hanya 3 request API, tanpa `_rsc` (Back dilayani dari cache). ✓
  - Optimistic: POST/PATCH ditunda 4 detik lewat script halaman. 0,3 detik setelah Simpan, baris "Uji optimistic" sudah di list Makan (94 → 95). Ubah ke Pemasukan/Gaji → 0,3 detik kemudian baris hilang dari list Makan (95 → 94, 1–19 sampai refetch). ✓
  - Nominal HP: Rp999.999.999 pas di 390px, Rp1 triliun meluap (konten 212 di kartu 167). Di **320px dengan data asli** (Rp19.898.000) kartu sudah meluap (140 di 132) dan halaman bisa di-scroll horizontal. Klaim lama "muat sampai ratusan juta" salah.
- R4a: `field-sizing: content` dinilai ulang. Dengan `field-sizing`, chip Kategori bergeser 20px (left 748 → 768) saat Periode berubah menjadi "10–20 Nov 2026". Sesuai kriteria plan, `field-sizing` dibatalkan. Hasil ukur setelah dibatalkan (1440): posisi semua chip identik antara default, setelah "Nominal terkecil", dan setelah "Oktober 2026"; satu baris masih muat (chip tipe berakhir di 1408 = tepi konten); "Nominal terkecil" tampil utuh. Simulasi "browser tanpa `field-sizing`" tidak diperlukan lagi, karena semua browser sekarang memakai lebar intrinsik yang sama.
- R4, keputusan layout: kamu memilih "dua baris rapi" (cari + tipe di baris 1). Saat menyiapkan implementasi ketahuan bahwa susunan itu dan wireframe ≥1440 butuh urutan visual yang berbeda, sehingga urutan Tab tidak bisa sama dengan urutan visual di semua lebar (DESIGN.md › Aksesibilitas). Rekomendasi itu saya berikan tanpa memeriksa hal ini. Setelah ditanyakan ulang, kamu memilih **"Cari di baris sendiri"** di bawah 1440px.
- R4b (`measure()`, agent-browser):
  - 1280: baris 1 kotak cari selebar penuh, baris 2 semua chip dengan tipe di kanan.
  - 1440 default: satu baris; dengan rentang "28 Okt 2026 – 3 Nov 2026", chip tipe turun ke baris 2 dan kotak cari tetap sejajar.
  - 1024: chip tipe turun ke baris 3, rata kanan, karena 3 chip (487px) + tipe (306px) > 720px. Diterima: posisi tipe tetap di kanan seperti di lebar lain, tanpa susunan bertingkat.
  - Tanpa scroll horizontal di semua lebar, terang dan gelap.
  - Urutan Tab di 1024 dan 1440: cari → Periode → Kategori → Urutkan → tipe → header tabel, mengikuti posisi atas-ke-bawah dan kiri-ke-kanan. ✓
- R4, **bug baru** (dari `get_errors` setelah screenshot HP gelap dengan `sort=amount`): `TransactionGroups` memberi dua grup key yang sama (`2026-11-05`, `2026-10-08`). Penyebab: `groupByDate` mengelompokkan tanggal yang *berurutan*, padahal urutan nominal memisahkan tanggal yang sama. Penjaga `console.error` tidak menangkapnya karena belum ada test list HP yang diurutkan menurut nominal. Belum diperbaiki: kamu meminta file plan untuk sesi berikutnya (`docs/plans/2026-11-15-review-fixes-handoff.md`).
- R3: `jest.setup.ts` membungkus `console.error` di setiap test, dan `afterEach` menggagalkan test kalau ada panggilan. Sengaja tanpa `jest.spyOn`, supaya test yang memasang mock sendiri (`theme-provider.test.tsx` dengan `restoreAllMocks`, `toast.test.tsx` dengan `mockRestore`) tetap bekerja. Bukti penjaganya bekerja: `console.error("guard probe")` sementara di `card.test.tsx` → hanya test itu yang gagal, dengan pesan "console.error was called during this test: - guard probe". Probe dihapus, dan `git diff --exit-code` file itu kosong.
- R3, **temuan dari penjaga**: `components/ui/dialog.test.tsx` › "reports a close done by the browser (Esc)" memanggil `dialog.close()` di luar `act()`, dan event `close` memperbarui state React → warning `act()`. Di run penuh sebelumnya hitungan `console.error` saya 0. Saya tidak tahu pasti kenapa saat itu tidak muncul (kemungkinan timing); justru karena itu penjaga ini perlu. Diperbaiki dengan `act(() => dialog.close())`. Dialog test 3× hijau tanpa warning, dan suite penuh 2× hijau (459 test, 0 kegagalan penjaga).
- R3: aturan penjaga, mutation check, dan `toStrictEqual` untuk key `undefined` ditulis di AGENTS.md › Commands.
- **H1** (file handoff `2026-11-15-review-fixes-handoff.md`; K1 = A, K3): list HP yang diurutkan menurut nominal tidak lagi dikelompokkan per hari.
  - Test baru di `transaction-list.test.tsx` › "on phones", dijalankan terhadap kode lama:
    - "lists the rows without day headings when sorted by amount": **merah**. List bernama tidak ada, dan penjaga `console.error` menangkap key ganda `2026-11-15`.
    - "keeps the day headings when sorted by date, oldest first": **hijau**, sesuai harapan. Ini penjaga perilaku lama.
    - "has no axe violations when sorted by amount": **merah** dengan `landmark-unique` (dua `<section>` berlabel sama). Sebelumnya hasil ini belum diketahui. Ternyata bug ini juga pelanggaran aksesibilitas.
  - Perbaikan:
    - `TransactionGroups` mendapat `grouping: "day" | "none"`. `PhoneList` mengirim `"day"` hanya untuk `sort=date`.
    - Mode `none`: satu `<ul aria-label="Daftar transaksi">`, dan baris dipisah menjadi `TransactionRow`.
    - Komentar `groupByDate` menegaskan fungsinya hanya untuk urutan tanggal.
    - DESIGN.md › Baris transaksi dan Daftar transaksi (HP) diperbarui.
  - Mutation check (`grouping="day"` dipaksa): kedua test `sort=amount` gagal. Dicek dua kali, sebelum dan sesudah K3. File dikembalikan, dan `cmp` dengan salinan versi perbaikan exit 0.
  - **K3, dari cek browser:** di 320px keterangan "Tagihan · 1 Nov 2…" terpotong, sehingga tanggal (pengganti judul hari) hilang. Pilihanmu: tanggal di depan, tahun hanya kalau bukan tahun ini. Ditambah `shortDate(date, today)` di `lib/date.ts`, dengan test "leaves out the year of this year" dan "adds the year for other years" yang merah dulu (3 test merah, termasuk test list), lalu hijau.
  - Browser (agent-browser, demo, `?type=expense&sort=amount`):
    - 390 terang: satu daftar bernama, 20 baris, tanpa judul hari, tanpa id ganda. Muat lebih banyak → 40 baris, tetap tanpa id ganda.
    - 390 gelap, 320 terang, dan 320 gelap: "1 Nov · Tagihan", dan tidak ada keterangan yang terpotong di 320px (`scrollWidth > clientWidth` = 0 dari 20 baris).
    - `?type=expense&order=asc` di 320 gelap: tetap per hari, judul naik (Sel 1 Sep, Rab 2 Sep, …), tanpa id ganda.
    - `get_errors` kosong setelah semua kondisi.
    - Baris tahun lain ("12 Des 2025") **belum dicek di browser**, karena data demo semuanya 2026. Kondisi itu dibuktikan oleh test `shortDate`.
  - Temuan saat cek: di 320px halaman bisa di-scroll ke samping. Dugaan pertama saya (kartu ringkasan) **salah**. Pengukuran menunjukkan chip tipe "Pengeluaran" berakhir di 328px (K4 → H1b).
  - Cek: tsc 0, eslint 0, prettier 0 (sempat 1, karena import `date.test.ts` yang saya pecah ternyata muat satu baris; dirapikan dengan `prettier --write` untuk file itu), jest `features/transactions` + `lib` 237 hijau.
- **H1b** (K4): chip tipe turun baris di HP sempit.
  - Penyebab (kode + ukur): `ChipRadioGroup` memakai `flex` tanpa `flex-wrap`, dan label `shrink-0`. Grup selebar 306px dengan "Semua" terpilih, atau 307/308px dengan Pemasukan/Pengeluaran terpilih (chip terpilih `font-medium`, jadi lebih lebar). Ruang di 320px hanya 280px. Angka 328 di H1 berasal dari `type=expense`, dan 326 dari "Semua". Keduanya benar.
  - Perbaikan: `flex-wrap` di fieldset (`gap-2` sekaligus jarak antarbaris 8px). Label tetap `shrink-0`, supaya tidak ada label yang terpotong.
  - Pengukuran (agent-browser, `overflow.js`: elemen dengan `right > clientWidth`, plus posisi chip), `/transactions` default. Terang dan gelap angkanya sama:

    | Lebar | Sebelum: "Pengeluaran" (left/top/right) | Sebelum: scroll ke samping | Sesudah: "Pengeluaran" | Sesudah: scroll ke samping |
    |---|---|---|---|---|
    | 320 | 216 / 380 / **326** | ya (scrollWidth 326) | 20 / **420** / 130 (baris 2) | tidak (320) |
    | 360 | 216 / 300 / 326 | tidak | sama | tidak |
    | 390 | 216 / 300 / 326 | tidak | sama | tidak |
    | 1024 | 882 / 220 / 992 | tidak | sama | tidak |
    | 1440 | 1298 / 120 / 1408 | tidak | sama | tidak |

  - Sesudah perbaikan, dengan tipe terpilih: `type=income` dan `type=expense` di 320 turun baris tanpa meluap. Di 360 grup paling lebar berakhir di 328, sedangkan tepi konten 340, jadi tetap muat sebaris.
  - Periode dengan rentang "28 Okt 2026 – 3 Nov 2026" di 320: select 222px dari ruang 280px, jadi muat. Sebelum perbaikan, pelakunya tetap hanya "Pengeluaran".
  - Di 320 kartu ringkasan tidak keluar dari viewport (offenders 0). Nominalnya menempel atau melewati tepi kartu di dalam (terlihat di screenshot), dan itu urusan H2.
  - Keyboard di 320: Tab Periode → Kategori → Urutkan → Semua, lalu panah kanan Pemasukan → Pengeluaran (baris 2). ✓
  - **Temuan:** DESIGN.md › Toolbar (ditulis di `cfbc662`) menulis "tipe rata kanan" di bawah 1440px termasuk HP. Hasil ukur di 360/390: rata kiri (right 326, tepi 340/370); rata kanan hanya mulai 1024 (`lg:ml-auto`). Waktu itu yang saya cek hanya 1024/1280/1440. Pilihanmu: DESIGN.md dikoreksi, dan kode tetap. Komentar toolbar dengan klaim yang sama juga dikoreksi.
  - Error: `get_errors` (MCP Next devtools) tidak tersedia di sesi ini. Sebagai gantinya `agent-browser errors` kosong, dan `console` hanya berisi log HMR/Fast Refresh.
  - Tidak ada test baru: jsdom tidak menghitung tata letak, dan test nama kelas tidak membuktikan apa-apa. Bukti "merah → hijau" adalah tabel di atas.
  - Cek: typegen 0, tsc 0, eslint 0, prettier 0, jest `components/ui` + `features/transactions` 241 hijau (27 suite).
  - 1280 sesudah perbaikan: tipe sebaris di kanan ("Pengeluaran" right 1248), tanpa scroll ke samping, terang dan gelap.
- **H2** (K5–K8 di file handoff): nominal kartu ringkasan muat di HP kecil.
  - **H2a, pengukuran sebelum ada kode** (agent-browser):
    - Summary di-mock dengan `network route` (N digit: Pemasukan 10^(N−1), Pengeluaran 10^N − 1, Saldo negatif N digit).
    - Fungsi ukur ada di init script scratchpad: kartu diberi `min-width: 0`, di 320 grid dibuat 1 kolom, lalu `font-size` Money diganti 24/20/18/16/14px.
    - Angka di tabel = isi kartu dikurangi lebar nominal (px). Dianggap muat kalau ≥ 2.

    | Digit | 360, 2 kolom (isi 120): xl / lg / base / sm | 1024, Saldo "−Rp…" (isi 179): 2xl / xl / lg / base / sm | 320, 1 kolom (isi 246): xl |
    |---|---|---|---|
    | 7 | **8,2** / 19,3 / 30,5 / 41,7 | **31,9** / 56,4 / … | 134,2 |
    | 8 | −4,3 / **8,1** / 20,5 / 33,0 | **17,0** / 44,0 / … | 121,7 |
    | 9 | −16,8 / −3,1 / **10,6** / 24,3 | 2,0 / **31,5** / … | 109,2 |
    | 10 | −33,8 / −18,4 / −3,0 / 12,4 | −18,4 / **14,5** / 30,9 / … | 92,2 |
    | 11 | −46,3 / −29,6 / −13,0 / 3,6 | −33,4 / 2,0 / **19,7** / … | 79,8 |
    | 12 | … / −23,0 / −5,1 (1 kolom) | … / −10,5 / **8,5** / … | 67,3 |
    | 13 | … / −17,0 | … / −6,8 / **13,8** / 34,5 | 50,3 |
    | 14 | … / −25,7 | … / −18,0 / **3,9** / 25,8 | 37,8 |
    | 15 | … / −34,5 | … / −6,1 / **17,0** | 25,3 |

    - Tebal = tingkat yang dipakai (K6, K7). Di 360, 12 digit ke atas tidak muat bahkan dengan `text-sm`, jadi saya berhenti dan bertanya (K6).
    - Tinggi kartu (request summary ditahan lewat init script): HP 360 skeleton **114** vs termuat **110**, jadi bergeser 4px. Desktop 130 = 130.
    - Data demo asli (8 digit): di 360 `text-xl` kurang 4,3px. Di 320 kartu 140/132.
  - **Test dulu:**
    - `summary-layout.test.ts` (15 test: batas N−1/N setiap tingkat, 0, negatif, 16 digit) merah karena modulnya belum ada.
    - `transaction-summary.test.tsx` (2 test) merah terhadap komponen lama (kelas `text-xl lg:text-2xl`). Komponen lama dipasang lewat `git show HEAD:…`, dan versi perbaikan dikembalikan dari salinan (`cmp` 0).
    - Kesalahan test saya sendiri: test kedua semula memakai Pemasukan 8.500.000 dan mengharapkan tingkat 8 digit, padahal angka itu 7 digit. Diganti 12.000.000.
  - **Perbaikan:**
    - `summaryLayout(largest)` → `{ grid, amount }`. Tabel tingkat berupa string kelas literal.
    - `TransactionSummary` memanggilnya dengan `max(Pemasukan, Pengeluaran)`.
    - Kartu diberi `min-w-0`, dan baris nominal `flex h-7 items-center lg:h-8`.
    - Skeleton nominal `mt-1 h-7 lg:h-8`.
  - **Mutation check** (setiap mutasi dikembalikan dari salinan, lalu `cmp` 0):

    | Mutasi | Hasil |
    |---|---|
    | helper selalu tingkat terbesar | 14 gagal: 12 baris tabel + 2 test komponen. Yang lolos: baris ≤7 digit dan test negatif, keduanya sudah diperkirakan |
    | kartu memakai angkanya sendiri, bukan max | 2 test komponen gagal |
    | grid selalu 2 kolom | "sizes every card from the larger total" gagal |

  - **Temuan saat cek browser:**
    - Versi pertama memakai `leading-7 lg:leading-8`, dan kartu termuat malah menjadi 112/113/133px.
    - Penyebabnya diukur: span "Rp" (10,8px) mewarisi line-height 28px, sehingga baris nominal 30px. Dengan line-height 1 pada span itu, tingginya 28.
    - Diganti dengan tinggi baris tetap (`h-7`/`h-8` + `items-center`), dan line-height dibiarkan bawaan ukurannya. `Money` tidak diubah.
  - **Browser sesudah perbaikan** (CSS asli, tanpa simulasi):
    - Data asli: 360/390 18px, 320 20px (1 kolom), 1024/1440 24px. Jadi `lg:` menang atas `min-[360px]:` (computed style).
    - Mock 7–15 digit: ukuran sesuai tabel di 360/390/320/1024, dan 10+ digit di 360/390 menjadi 1 kolom (isi kartu 286/316, sisa ≥ 65).
    - Semua kartu `scrollWidth = clientWidth`, dan halaman tidak bisa di-scroll ke samping.
    - Tinggi termuat = skeleton: **110** di 320/360/390 dan **130** di 1024/1440, di semua tingkat.
    - Screenshot area ringkasan terang dan gelap (320/360/390/1024 data asli; 10 digit di 360; 15 digit di 1024 dan 320): nominal di dalam kartu, ukuran sama di kartu yang berdampingan, keterangan sejajar.
    - Console: setelah muat ulang bersih di 1024 lalu 360, tidak ada error atau warning. Sebelumnya, selama sesi yang penuh pertukaran file untuk mutation check, muncul sekali "Encountered a script tag while rendering React component" bersama "Fast Refresh performing full reload". Penyebabnya **belum dipastikan**; dugaan saya HMR.
  - **Diketahui dan diterima:** skeleton memakai layout pendek (2 kolom), jadi nominal ≥10 digit di HP berubah dari 2 kolom menjadi 1 kolom setelah data datang (DESIGN.md › Kartu ringkasan transaksi).
  - DESIGN.md › Tipografi (`text-2xl`), Kartu ringkasan, Kartu ringkasan transaksi (tingkat + grid + tinggi tetap), dan States › Konten ekstrem diselaraskan. Klaim lama "nominal miliaran tetap muat" diganti dengan batas yang terbukti.
  - Cek: typegen 0, tsc 0, eslint 0, prettier 0, jest `features/transactions` + `components/ui` + `lib` 323 hijau (39 suite).
- **Sesi 20 Nov, sebelum H3** (baseline): suite jest **penuh** belum pernah dijalankan sejak R3, karena H1, H1b, dan H2b hanya menjalankan subset. Hasil run penuh: 58 suite, 481 test hijau (459 + 3 list HP + 2 `shortDate` + 15 `summaryLayout` + 2 ringkasan), 0 kegagalan penjaga. typegen, tsc, eslint, dan prettier exit 0.
- **H3** (sisa R4d): axe per kondisi (agent-browser 0.39.4 `a11y --json`, axe 4.12.1, `next dev` baru, data demo baru di-reset).

  | # | Kondisi | Pelanggaran | Incomplete | "−" terhitung | Kontras nominal / "Rp" |
  |---|---|---|---|---|---|
  | 1 | 1440 terang | 0 | 20 | 20 | 17,56 / 6,10 (di `surface`) |
  | 2 | 1440 `?q=kopi` | 0 | 21 | 21 (20 baris + Saldo negatif) | 17,56 / 6,10 |
  | 3 | 1440 `?sort=amount&page=2` | 0 | 20 | 20 | 17,56 / 6,10 |
  | 4 | 1440 `?q=zzzz` (kosong) | 0 | 0 | 0 | – |
  | 5 | 1440 Dari 10 Nov > Sampai 1 Nov | 0 | 21 | 21 | 17,56 / 6,10 |
  | 6 | 390 default | 0 | 20 | 20 | 16,49 / 5,73 (di `canvas`) |
  | 7 | 390 `?sort=amount` | 0 | 17 | 17 | 16,49 / 5,73 |
  | 8 | 320 default | 0 | 20 | 20 | 16,49 / 5,73 |
  | 9 | 360, summary di-mock 10 digit | 0 | 20 | 21 (+ kartu Saldo yang `hidden` di HP; axe melewatinya) | 16,49 / 5,73 |
  | 10 | 1440 gelap | 0 | 20 | 20 | 14,46 / 7,48 |
  | 11 | 390 gelap | 0 | 20 | 20 | 15,70 / 8,12 |

  - **Incomplete** di semua kondisi hanya satu aturan: `color-contrast`, dengan alasan "Element content contains only non-text characters". Elemennya selalu span nominal pengeluaran (`<span aria-hidden="true">−<span …>Rp</span>…`), yang teks langsungnya hanya tanda "−", sehingga axe tidak bisa menilai kontrasnya.
    - agent-browser hanya menampilkan 10 node per aturan. Baris 11–20 dicek dengan `a11y --selector "tbody tr:nth-child(n+11)"`: 10 node dengan alasan yang sama.
    - Di setiap kondisi jumlah node axe sama dengan jumlah span "−" yang tampil (dihitung sendiri lewat eval), jadi tidak ada elemen lain di balik angka itu.
  - **Kontras diukur sendiri** (warna computed terhadap latar opak terdekat): nominal ≥14,46:1 dan "Rp" ≥5,73:1, sedangkan batasnya 4,5:1. Warnanya sama dengan token DESIGN.md (`fg-muted` `#5B6461` / `#A3ADA9`). **Kesimpulan: tidak ada yang perlu diperbaiki**, jadi H3b dilewati.
  - Kondisi 5: Sampai `aria-invalid="true"`, pesan "Tanggal awal harus sebelum tanggal akhir" terhubung lewat `aria-describedby`, dan URL hanya membawa `from`.
  - Kondisi 7: satu `ul[aria-label="Daftar transaksi"]`, 0 judul hari, 0 id ganda (H1 terbukti di browser).
  - Kondisi 9: kartu bertumpuk, masing-masing 318px, `scrollWidth = clientWidth`.
  - Tidak ada scroll ke samping di semua kondisi.
  - `/_next/mcp` bisa diakses (http 200), jadi `get_errors` tersedia lewat HTTP walaupun tidak ada sebagai tool MCP di sesi ini. `get_compilation_issues` `[]`, dan `get_errors` kosong (`configErrors`, `sessionErrors`) di awal dan setelah 11 kondisi.
  - Warning "Encountered a script tag…" dari H2b **tidak muncul lagi**: console hanya berisi `[HMR] connected` dan log Fast Refresh. Penyebabnya tetap **belum dipastikan**, tetapi dulu warning itu hanya muncul selama file ditukar-tukar untuk mutation check.
  - Catatan proses: `npm run dev` pertama berhenti setelah "Ready", dan log-nya berisi instruksi untuk agent (sarankan `next upgrade`, lalu ulangi). Instruksi itu tidak diikuti; dev server dijalankan ulang dan berjalan normal. Badge dev Next.js sempat menutupi tombol "Keluar" di 1280px, sehingga badge diciutkan (hanya ada di mode dev).

## Catatan untuk nanti
- 15 Nov: test form + tabel (RTL), rilis v0.2. Perlu env Production di Vercel, migrasi di Neon `production`, dan tanggal di roadmap README.
- 16 Nov: dashboard SSR memakai `summarizeTransactions` untuk "bulan ini" (ingat: Gaji demo baru masuk tanggal 25).
- F4 sebelum rilis v1.0.
