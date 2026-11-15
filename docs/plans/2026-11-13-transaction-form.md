# Plan 13 Nov 2026: Form tambah/ubah/hapus transaksi, optimistic + rollback, toast (±2 jam, kenyataannya lebih)

## Context
Tugas jadwal 13 Nov: **"Form tambah/edit transaksi: RHF + Zod, format Rupiah, mutation optimistic + rollback, toast"**. Output: *tambah/edit/hapus terasa instan dan aman saat gagal*.

Status: PR #12 (daftar transaksi) sudah di-squash-merge ke develop (`723d33d`). Ukuran "Rp" tetap 0,6× (sudah kamu cek, aman). Target hari ini: 13–14 Nov + rilis v0.2, dengan titik cek.

Keputusanmu untuk task ini:
- **Hapus = dialog konfirmasi + toast "Transaksi dihapus" · Urungkan** (sesuai DESIGN.md). Urungkan membuat ulang transaksi dengan data yang sama (id baru). Kalimat dialog di wireframe 08 ("tidak bisa dikembalikan") diganti.
- **Form = Redux + halaman**: di desktop, satu dialog form global di layout app, dibuka lewat slice Redux `transactionEditor`. Di HP, halaman `/transactions/new` dan `/transactions/[id]/edit`. Kedua tempat memakai komponen form yang sama.

Yang sudah ada dan dipakai ulang:
- `schemas/transaction.ts`: `transactionInputSchema`/`transactionUpdateSchema`, `TransactionDto`, `TransactionPage`, `MAX_*`.
- API `POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/[id]`, dan format error `ApiError` (`lib/api/client.ts`: status, code, fieldErrors).
- `features/transactions/api/`: `transactionKeys` (`all`, `lists()`, `list(q)`, `detail(id)`), `fetchTransactions`, `useTransactions`.
- `components/ui/`: `Dialog` + `DialogActions` (native `<dialog>`, bottom sheet di HP, fokus kembali ke pemicu), `Input`/`Select` (+`field.tsx`: `Field`, `fieldAria`, `controlClasses`), `SegmentedControl` (radio native), `Button` (varian `danger`, `quiet-danger`, ukuran `sm`), `Money`, `CategoryIcon`, `ErrorState`, `EmptyState`, `Skeleton`.
- `useToast().show({ message, action })` (Redux), `lib/store/store.ts` (`rootReducer` di level modul), `test/render-with-providers.tsx`.
- `features/transactions/components/transaction-table.tsx` (desktop) dan `transaction-groups.tsx` (HP), `components/app-shell/add-transaction-link.tsx` (link desktop di header), FAB di `bottom-nav.tsx` → `/transactions/new`.
- `lib/db` repo pattern + PGlite (`db/testing/test-db.ts`), `lib/api/http.ts`, `lib/session.ts › getCurrentUser`.
- Wireframe `07 Form Transaksi` dan `08 Konfirmasi Hapus` (Desktop/Mobile), DESIGN.md (Input nominal `text-4xl` + border bawah, Segmented control, Dialog, Toast, States).

## Cara kerja (sama seperti 11–12 Nov)
Setiap langkah: test dulu sampai gagal, lalu implementasi. Sebelum commit: review ulang diff terhadap plan + AGENTS.md, lalu jalankan lint/typecheck/test. Setiap kesalahan dicatat di **Catatan perbaikan** + dirangkum di chat. Perintah shell dicek dulu (tanpa `2>/dev/null` yang menyembunyikan error). Server dev/prod dimatikan lewat PID port (`taskkill /T`), bukan hanya `TaskStop`.

## Keputusan
- **Dependency** (versi dirilis ≥2 minggu): `react-hook-form@7.91.0`, `@hookform/resolvers@6.0.2` (mendukung Zod 4). Sesuai stack di AGENTS.md.
- **`GET /api/categories`** (dibutuhkan untuk select kategori): repo `listCategories(db, userId)` (urut tipe lalu nama, scope per user), route 401/200, tipe `CategoryDto { id, name, type, icon }` di `schemas/category.ts`, dan hook `useCategories()` (`staleTime` 5 menit). Ada test PGlite (hanya kategori milik user) dan test route.
- **Form `TransactionForm`** (`features/transactions/components/transaction-form.tsx`), dipakai di dialog dan halaman:
  - RHF + `zodResolver(transactionInputSchema)` dengan generik input/output (karena ada transform pada `note`). Validasi saat submit, lalu ulang saat field berubah (`mode: "onSubmit"`, `reValidateMode: "onChange"`). Fokus pindah ke field pertama yang error.
  - Field sesuai wireframe 07: segmented Pengeluaran/Pemasukan; **Nominal** (`AmountInput`); **Kategori** (`Select`, difilter sesuai tipe; kalau tipe diganti dan kategori tidak cocok, kategori dikosongkan); **Tanggal** (`Input type="date"`, default hari ini WIB lewat `todayInJakarta`); **Catatan (opsional)** (`Textarea` baru, maksimal 200).
  - Mode tambah: judul "Tambah transaksi", tombol "Simpan". Mode ubah: "Ubah transaksi", "Simpan perubahan", plus "Hapus transaksi" (`quiet-danger`).
  - Pesan "Isi nominal" untuk nominal kosong: schema nominal diberi pesan khusus saat input `undefined`, dengan test.
- **`AmountInput`** (`components/ui/amount-input.tsx`): `inputMode="numeric"`, tampil "Rp" + angka berformat titik saat diketik ("35000" → "35.000"), mengembalikan number atau `undefined`, label "Nominal". Gaya DESIGN.md: `text-4xl`, tanpa kotak, border bawah `border-strong` (merah saat error). Karakter selain angka diabaikan, dan nilai di atas `MAX_AMOUNT` ditolak lewat Zod.
- **Mutation optimistic** (`features/transactions/api/`), semuanya `onMutate` → `cancelQueries(lists)` → snapshot → ubah cache; `onError` → kembalikan snapshot + toast; `onSettled` → `invalidateQueries(transactionKeys.all)`:
  - `useCreateTransaction`: baris sementara (`id` diawali `optimistic-`, kategori diambil dari cache kategori) disisipkan ke setiap list halaman 1 dalam urutan tanggal, `total + 1`. Sukses → toast "Transaksi disimpan".
  - `useUpdateTransaction`: ganti item di list (urut ulang kalau tanggal berubah) dan detail. Sukses → "Transaksi disimpan".
  - `useDeleteTransaction`: hapus dari list, `total − 1`. Sukses → toast "Transaksi dihapus" · **Urungkan** → `createTransaction` dengan data yang sama → toast "Transaksi dikembalikan".
  - Gagal → toast "Transaksi gagal disimpan/dihapus." (+ pesan API untuk error 400, mis. kategori tidak cocok), dengan aksi **Coba lagi** untuk error jaringan/5xx (menjalankan ulang variabel yang sama). 401 sudah ditangani global.
  - Fungsi cache murni di `features/transactions/api/cache.ts` (`insertTransaction`, `replaceTransaction`, `removeTransaction`, `sortTransactions`), dites terpisah.
  - **"Instan"**: dialog atau halaman ditutup begitu submit lolos validasi client, dan baris langsung muncul atau berubah di daftar. Error yang hanya diketahui server (jarang, karena schema sama) dilaporkan lewat toast, bukan di bawah field.
- **Redux `transactionEditor`** (`lib/store/transaction-editor-slice.ts`): `{ editor: { mode: "closed" } | { mode: "create" } | { mode: "edit"; id } ; deleteId: string | null }`, dengan aksi `editorOpened`, `editorClosed`, `deleteRequested`, `deleteClosed`. Hanya id dan mode yang masuk store, datanya tetap dari TanStack Query.
- **Desktop**: `TransactionEditorDialog` + `DeleteTransactionDialog` dipasang sekali di `app/(app)/layout.tsx`.
  - Tombol header "Tambah transaksi" (`AddTransactionLink` → `AddTransactionButton`, client) dispatch `editorOpened({ mode: "create" })`.
  - Tabel mendapat kolom **Aksi** dengan tombol "Ubah" dan "Hapus" (`quiet`, `sm`, label aksesibel "Ubah Makan siang"). "Hapus transaksi" di form ubah juga membuka dialog konfirmasi.
  - Data untuk mode ubah: `useTransaction(id)` (`GET /api/transactions/[id]`, `placeholderData` dari cache list).
- **HP**: halaman `app/(app)/transactions/new/page.tsx` (FAB) dan `app/(app)/transactions/[id]/edit/page.tsx` (klik baris: baris di `transaction-groups.tsx` menjadi `<Link>`), dengan judul halaman dan link "← Transaksi". Setelah simpan → `router.push("/transactions")`. "Hapus transaksi" → `DeleteTransactionDialog` (bottom sheet), dan setelah dihapus kembali ke daftar. Edit dengan id yang tidak ada → state "Transaksi tidak ditemukan" + link kembali.
- **Dialog hapus** (wireframe 08): pratinjau baris (ikon, judul, "Makan · 1 Nov 2026", Money), kalimat "Saldo dan budget Makan bulan ini akan dihitung ulang.", lalu Batal (secondary) dan Hapus (`danger`). Dialog langsung tertutup saat Hapus ditekan (optimistic).
- Halaman dan header tetap statis. Semua yang membaca data berada di Client Component.

## File
- `package.json`/lock.
- `schemas/category.ts`, `schemas/transaction.ts` (pesan nominal kosong) + test.
- `features/categories/server/categories-repo.ts` (+test PGlite), `app/api/categories/route.ts` (+test), `features/categories/api/use-categories.ts` (+`keys.ts`).
- `components/ui/textarea.tsx`, `components/ui/amount-input.tsx` (+test).
- `features/transactions/components/transaction-form.tsx` (+test), `delete-transaction-dialog.tsx`, `transaction-editor-dialog.tsx`, `add-transaction-button.tsx`, `edit-transaction-screen.tsx`, `new-transaction-screen.tsx` (+test integrasi).
- `features/transactions/api/cache.ts` (+test), `use-transaction.ts`, `use-create-transaction.ts`, `use-update-transaction.ts`, `use-delete-transaction.ts`, `mutations.ts` (fungsi fetch POST/PATCH/DELETE) (+test hook).
- `lib/store/transaction-editor-slice.ts` (+test), `lib/store/store.ts` (tambah reducer di `rootReducer`).
- `features/transactions/components/transaction-table.tsx` (kolom Aksi), `transaction-groups.tsx` (baris → Link).
- `app/(app)/layout.tsx` (dialog global), `app/(app)/transactions/new/page.tsx`, `app/(app)/transactions/[id]/edit/page.tsx`, `app/(app)/transactions/page.tsx` + `dashboard/page.tsx` (tombol header).
- `DESIGN.md` (kalimat dialog hapus + Urungkan), `README.md` (React Hook Form → *in use*), `AGENTS.md` › Structure, `docs/plans/2026-11-13-transaction-form.md`.

## Test (ditulis dulu)
- **categories**: repo hanya mengembalikan kategori milik user, dengan urutan benar; route 401 tanpa sesi, 200 dengan data.
- **AmountInput**: ketik "35000" → tampil "35.000", nilai 35000; huruf diabaikan; kosong → `undefined`; label dan `aria-invalid` saat error.
- **TransactionForm**: submit kosong → "Isi nominal" + "Pilih kategori", fokus ke nominal; isian valid → `onSubmit` dengan nilai yang sudah di-parse (note di-trim); ganti tipe → kategori difilter dan dikosongkan; mode ubah terisi + tombol Hapus; axe tanpa pelanggaran.
- **cache helpers**: sisip sesuai urutan tanggal (hanya halaman 1), ganti + urut ulang, hapus, `total` ikut berubah.
- **mutation hooks** (mock `apiFetch`): baris optimistic terlihat sebelum request selesai; gagal → cache kembali seperti semula + toast + "Coba lagi"; sukses → invalidate; hapus → Urungkan memanggil POST dengan data lama.
- **editor slice**: buka/tutup/hapus.
- **Integrasi** (`renderWithProviders`): klik "Tambah transaksi" → dialog → isi → Simpan → dialog tertutup, baris baru muncul, toast; Ubah → dialog terisi; Hapus → konfirmasi → baris hilang → Urungkan → POST.
- **Halaman HP**: `/transactions/[id]/edit` dengan id tidak ada → "Transaksi tidak ditemukan".

## Langkah dan commit
- [x] 0. `git switch develop && git pull`, cek `git diff develop feature/transactions-list` kosong, lalu `git branch -D feature/transactions-list`. Branch `feature/transaction-form`. Simpan plan ke `docs/plans/2026-11-13-transaction-form.md`, centang box 7 plan 12 Nov. Commit `docs: add transaction form plan`
- [x] 1. Install RHF + resolvers. Commit `build: add react hook form`
- [x] 2. `GET /api/categories` + hook. Commit `feat(api): add categories endpoint`
- [x] 3. Textarea + AmountInput + pesan nominal kosong. Commit `feat(ui): add amount input and textarea`
- [x] 4. `TransactionForm`. Commit `feat(transactions): add transaction form`
- [x] 5. Fungsi cache + mutation optimistic + toast + Urungkan. Commit `feat(transactions): add optimistic create, update and delete`
- [x] 6. Slice editor + dialog global + kolom Aksi + tombol header. Commit `feat(transactions): add and edit transactions in a dialog on desktop`
- [x] 7. Halaman HP new/edit + baris → link + hapus lewat sheet. Commit `feat(transactions): add and edit transactions on phones`
- [x] 8. DESIGN.md + README + AGENTS. Commit `docs: document the transaction form`
- [ ] 9. Verifikasi, push, PR `feat: add transaction form`, `ci` + Vercel hijau, squash merge (kamu), titik cek ke 14 Nov.

## Verifikasi
1. Lint, typecheck, test, format:check, dan build dengan env dummy CI semuanya hijau.
2. Manual di `npm run dev` lewat browser (agent-browser, demo):
   - desktop: Tambah → dialog → submit kosong (pesan di bawah field, fokus ke nominal) → isi → Simpan → baris langsung muncul + toast; Ubah → simpan perubahan; Hapus → konfirmasi → baris hilang → Urungkan → baris kembali;
   - gagal: blokir `POST/PATCH/DELETE /api/transactions*` → baris optimistic kembali seperti semula + toast + Coba lagi;
   - HP 390px: FAB → `/transactions/new` → simpan → kembali ke daftar; klik baris → edit → hapus lewat bottom sheet; id palsu → "Transaksi tidak ditemukan";
   - keyboard: Tab di dalam dialog, Esc menutup, fokus kembali ke tombol pemicu; segmented control dengan panah;
   - axe 0 pelanggaran di dialog form, dialog hapus, dan halaman HP, terang dan gelap; `get_errors` kosong.
3. Self-review `git diff develop...HEAD` terhadap checklist Keputusan.

## Catatan perbaikan
- Langkah 2: `categoryKeys` diletakkan di `use-categories.ts`, tidak di `keys.ts` terpisah, karena hanya satu key. Urutan kategori dibuat di JS (`Intl.Collator("id-ID")`), karena enum Postgres mengurutkan `income` sebelum `expense` dan collation Neon dan PGlite bisa berbeda.
- Langkah 3: `controlClasses` memakai tinggi tetap `h-11`, dan tanpa tailwind-merge tinggi itu tidak bisa ditimpa untuk textarea. Ditambah parameter bentuk `"single" | "multi"`. Ditambah juga pesan "Pilih tanggal" untuk tanggal kosong (tidak ada di plan, tetapi sejalan dengan "Isi nominal").
- Langkah 4: test fokus gagal. RHF memfokuskan error menurut urutan registrasi, dan `register("categoryId")` (dipanggil saat render parent) terdaftar sebelum `Controller` nominal (terdaftar saat child dirender). `shouldFocusError` dimatikan, lalu fokus diatur di `onInvalid` mengikuti urutan visual (`FIELD_ORDER`).
- Langkah 4: review ulang menemukan cast `undefined as unknown as number` untuk nominal default. Diganti tipe `DefaultValues<FormValues>` dari RHF, yang memang mengizinkan field kosong, sehingga tidak ada cast.
- Langkah 4: urutan tombol mengikuti konvensi `DialogActions` yang sudah ada (DOM = urutan desktop, HP dibalik dengan `flex-col-reverse` supaya Simpan di atas). Di HP urutan Tab tidak sama persis dengan urutan visual, sama seperti `DialogActions`. Dicatat untuk audit a11y 21 Nov.
- Langkah 5: penyimpangan nama file dari plan. Fungsi fetch tulis ada di `requests.ts` (bukan `mutations.ts`), dan langkah optimistic yang dipakai bersama (snapshot, restore, cari di cache, kategori dari cache, toast gagal) ada di `optimistic.ts`, supaya tiga hook tidak menyalin logika yang sama. Mutation update menerima `{ id, values }` berisi semua field form (PATCH dengan isi lengkap, sah menurut schema update).
- Langkah 5: callback mutation (`onMutate`/`onError`/`onSuccess`/`onSettled`) sengaja ditaruh di opsi `useMutation`, bukan di `mutate()`. Callback di `mutate()` tidak jalan kalau komponennya sudah unmount, padahal form ditutup atau halaman pindah tepat saat submit.
- Langkah 6: **bug sebelum test dijalankan.** `EditForm` di dialog merender form *tambah* selama data transaksi belum termuat, sehingga Simpan di dialog "Ubah transaksi" justru menambah transaksi baru. Diganti `TransactionFormSkeleton`.
- Langkah 6: **bug nyata yang ditemukan test integrasi.** Mengosongkan nominal di form ubah lalu mengetik ulang mengirim `3.500.040.000` ("35000" + "40000"). Penyebabnya `useController` milik RHF mengembalikan nilai *default* saat nilai field `undefined`, sehingga nominal transaksi lama tidak pernah bisa dikosongkan. Diperbaiki: di dalam form, nominal kosong disimpan sebagai `NaN` (Zod menolaknya dengan "Isi nominal"), dan API `AmountInput` tidak berubah. Ditambah test form "nominal bisa dikosongkan dan diketik ulang" yang gagal sebelum diperbaiki. Penyebabnya ditelusuri dengan log debug sementara di test, yang lalu dikembalikan dari backup (`git diff` kosong).
- Langkah 6: `useTransaction` memakai `placeholderData` berupa fungsi, sehingga TanStack salah menebak tipe data (TS2769). Generik `useQuery<TransactionDto>` ditulis eksplisit.
- Langkah 6: tombol Ubah/Hapus dinonaktifkan untuk baris yang masih tersimpan sementara (`optimistic-…`), karena id itu belum ada di server. `AddTransactionLink` diganti `AddTransactionButton` (membuka dialog lewat Redux) di halaman Transaksi dan Dashboard. Ditambah `TransactionFormLoader` (skeleton/error kategori) yang dipakai bersama dialog dan halaman HP.
- Langkah 7: dokumentasi Next 16 (`use-params.md` › Cache Components) mengonfirmasi `useParams` di route dinamis tanpa `generateStaticParams` akan suspend, dan tanpa `<Suspense>` build gagal. `EditTransactionScreen` dibungkus Suspense dengan skeleton form, dan halaman lainnya tetap prerender. Ditambah `BackLink` ("‹ Transaksi") di kedua halaman. Baris HP yang masih tersimpan sementara tidak dijadikan link.
- Cek browser: Next dev melaporkan `usePathname()` di luar `<Suspense>` pada `/transactions/[id]/edit`. Sidebar dan bottom nav memakai `usePathname` untuk menu aktif, dan masalah ini baru muncul karena itu route dinamis pertama di dalam `(app)`. Diperbaiki: hanya bagian yang membaca pathname yang dibungkus Suspense, dengan fallback daftar menu yang sama tanpa penanda aktif (`isActivePath(null)` → false, ada test). Route statis tidak berubah. `get_errors` kosong lagi, dan menu aktif tetap ditandai di halaman ubah dan dashboard.
- Hasil cek browser (agent-browser, demo): desktop Tambah → submit kosong (pesan di bawah field, fokus ke Nominal) → simpan → baris langsung muncul + toast; Esc menutup dialog dan fokus kembali ke "Ubah"; Ubah dengan nominal dikosongkan lalu diketik ulang → 31.000; Hapus → baris hilang → Urungkan → kembali; POST diblokir → baris ditarik kembali + toast Coba lagi → buka blokir → Coba lagi berhasil. HP 390px: FAB → /transactions/new → simpan → kembali ke daftar; klik baris → halaman ubah → hapus lewat bottom sheet → kembali; Urungkan setelah halaman ubah tertutup tetap berhasil; id palsu → "Transaksi tidak ditemukan". Axe 0 pelanggaran (dialog form dengan error, dialog hapus, halaman HP, dialog ubah gelap).

## Catatan untuk nanti
- 14 Nov: filter/sort/cari/pagination di URL; fungsi cache harus tetap benar untuk list dengan filter (sisipan optimistic hanya ke list tanpa filter, atau cukup invalidate); kartu ringkasan + endpoint agregat diputuskan di plan 14 Nov.
- Pengaturan kategori (tambah/ubah ikon) belum dijadwalkan di MVP. `CategoryIcon` memakai daftar ikon yang ada.
- F4 sebelum rilis v1.0.
