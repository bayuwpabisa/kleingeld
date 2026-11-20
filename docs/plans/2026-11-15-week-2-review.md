# Plan 15 Nov 2026 (dikerjakan mulai 21 Nov): review pekan 2, test form dan tabel, rilis v0.2

## Context
Tugas jadwal 15 Nov (akhir Pekan 2): **"Buffer + review; test form dan tabel (RTL)"**. Output: *test lolos di CI, rilis v0.2*. Jadwal tergeser ±6 hari (task 14 Nov selesai 20 Nov, PR #14, develop `ccdffef`).

Kondisi sekarang (dicek 21 Nov):
- Branch `feature/week-2-review` dari `develop` `ccdffef`, berisi `b8fb4d5` (centang box 8/R6 plan 14 Nov dan H5a/H5b handoff). Belum di-push.
- Test form dan tabel sudah banyak (481 test di seluruh repo): `transaction-form.test.tsx` 8 test, `transaction-list.test.tsx` 31 (termasuk 4 kasus axe `it.each`), `transaction-toolbar.test.tsx` 18, `transaction-dialogs.test.tsx` 5, `transaction-screens.test.tsx` 6, `transaction-summary.test.tsx` 2 (ukuran kartu). Jadi bagian test task ini = **menutup celah**, bukan mulai dari nol.
- `package.json` masih `0.1.0`. README: status v0.1, v0.2 "In progress", tanggal roadmap lama.
- `npm audit --omit=dev`: `next` 16.4.3 kena 7 advisory moderate (antara lain GHSA-mfr8-8qww-v76h, GHSA-f3mh-rxg3-f5g2, GHSA-rhh4-g77r-r9qj), diperbaiki di 16.4.6. `drizzle-kit` (lewat `@esbuild-kit`) juga moderate, tetapi hanya dipakai untuk migrasi, tidak ikut ke server production.
- Neon `production` belum punya skema (migrasi `0000_init`, `0001_auth` baru diterapkan di branch `dev`). Vercel Production belum punya env apa pun. Begitu `main` berisi kode database, build production gagal tanpa `DATABASE_URL` (`db/index.ts` throw).

### Celah test yang ditemukan
- **Form** (`transaction-form.tsx`): hanya "Isi nominal" + fokus ke Nominal yang diuji. Belum ada: nominal 0, nominal di atas Rp1 triliun (`AmountInput` menerima 15 digit), catatan 201 karakter, tanggal kosong, fokus ke field salah selain Nominal (`FIELD_ORDER`), error hilang setelah diperbaiki (`reValidateMode: "onChange"`), tipe Pemasukan ikut terkirim, catatan yang dikosongkan saat edit menjadi `null`, transaksi tanpa catatan → textarea kosong.
- **Tabel** (`transaction-table.tsx`): tidak punya test sendiri. Belum ada: `aria-sort="ascending"`, klik Tanggal saat urut nominal → tanggal terbaru, baris yang masih disimpan (`optimistic-…`) dengan Ubah/Hapus disabled, Ubah/Hapus mengisi `transactionEditor` di store.
- **Ringkasan** (`transaction-summary.tsx`): state gagal ("Ringkasan gagal dimuat." + Coba lagi) belum diuji, padahal komentarnya menjanjikan list tetap tampil.

### Temuan review pekanan (dokumen)
- `CONTRIBUTING.md` › Commit: daftar scope tidak memuat `deps`, padahal `commitlint.config.mjs` punya.
- `CONTRIBUTING.md` › Rilis: tidak memperingatkan bahwa tombol merge GitHub default-nya **Squash** (penyebab PR #7 v0.1 ter-squash dan butuh PR #8). Contoh tag masih `v0.1.0` (boleh tetap, tapi tambahkan catatan versinya mengikuti `package.json`).
- `/dev/ui` dan `app/playground/` masih ikut ke production: tetap dihapus sebelum v1.0 (keputusan 5 Nov), tidak diubah di sini.
- `summaryLayout` menghasilkan `text-xl lg:text-xl` untuk 10 digit: tidak berbahaya, dibiarkan.

## Keputusan (21 Nov)
- **Login production v0.2: demo saja.** Google/GitHub tersembunyi otomatis tanpa key (`lib/auth.ts`); diaktifkan di task 26 Nov.
- **Next.js 16.4.3 → 16.4.6 di PR sendiri** sebelum rilis (branch `fix/next-16-4-6`), bersama `eslint-config-next` dan `@next/env` di versi yang sama.
- **Roadmap README: geser target.** v0.2 ✅ dengan tanggal rilis sebenarnya; v0.3 target 28 Nov; v1.0 target 5 Des (satu task per hari mulai 22 Nov, termasuk buffer). Alasan: README dibaca recruiter; target yang sudah lewat dengan status "Planned" terlihat terbengkalai, sedangkan tanggal yang sudah terjadi adalah fakta. Target diperbarui setiap rilis.
- **Test celah: keempat kelompok** (form error + fokus, form nilai yang dikirim, tabel, ringkasan gagal). Perilakunya sudah ada, jadi "merah dulu" dibuktikan dengan **mutation check** per test (aturan 3): kode yang dijaga dibalik sementara → test gagal → dikembalikan → `git diff` hanya berisi test.
- Tag `v0.2.0` (annotated) di merge commit `main`, PR rilis dengan **Create a merge commit**.

## Langkah dan commit
Setiap langkah: berhenti setelah selesai dan tunggu "lanjut". Sebelum commit: full jest, tsc, eslint, prettier lewat `node` (exit code dicatat), `git status`, `git diff --stat`, centang + catatan.

### A. `feature/week-2-review` → PR ke `develop`
- [x] A0. Simpan plan ini + "Catatan perbaikan" (tiga koreksi draf catatan H5a/H5b, satu koreksi draf plan ini). Commit `docs: add week 2 review and v0.2 release plan`
  - 21 Nov: plan dicek ulang terhadap kode sebelum commit. Diubah: daftar test di Context ditambah `transaction-summary.test.tsx`; dugaan mutasi kedua A2 dibalik (kemungkinan lolos, alasannya ditulis, belum dijalankan); A4 dipecah ke dua file; A1 memakai `user.paste` untuk 201 karakter. Cek: jest 58 suite / 481 test, typecheck, lint, format:check, semua exit 0.
- [x] A1. Form: error lain + fokus. Test di `transaction-form.test.tsx`:
  - nominal "0" → "Nominal harus lebih dari 0"; 13 digit `1000000000001` → "Nominal maksimal Rp1.000.000.000.000";
  - catatan 201 karakter (nominal + kategori valid) → "Catatan maksimal 200 karakter", fokus ke Catatan (isi lewat `user.click` + `user.paste`, karena 201 ketukan `user.type` lambat; textarea tidak punya `maxLength`);
  - tanggal dikosongkan (nominal valid, kategori kosong) → fokus ke Kategori, "Pilih tanggal" tampil; hanya tanggal yang salah → fokus ke Tanggal;
  - setelah submit gagal, mengetik nominal menghapus "Isi nominal" tanpa submit ulang.
  - Mutation: `FIELD_ORDER` dibalik; `reValidateMode: "onSubmit"`; `.max(MAX_NOTE_LENGTH)` dihapus sementara di schema (test schema boleh ikut gagal, yang dicatat adalah test form).
  - Commit `test(transactions): cover the form's other errors and focus`
  - 21 Nov: 5 test baru (`it.each` nominal 0 dan 13 digit, catatan 201, fokus urut atas-bawah, error hilang saat diperbaiki); form 8 → 13. Tanggal dan "hanya tanggal salah" digabung dalam satu test (submit pertama fokus Kategori, setelah kategori dipilih fokus Tanggal). Mutation, tiap mutasi dijalankan lalu dikembalikan dengan `git checkout` file sumber: `FIELD_ORDER` dibalik → gagal "moves focus…" dan test lama "says what is missing…"; `"date"` dikeluarkan dari `FIELD_ORDER` (tambahan, karena pembalikan tidak memengaruhi kasus "hanya tanggal salah") → gagal "moves focus…"; `reValidateMode: "onSubmit"` → gagal "clears an error…"; `.max(MAX_NOTE_LENGTH)` dihapus → gagal "rejects a note…"; tambahan `.positive` dihapus → gagal "rejects an amount of 0"; `.max(MAX_AMOUNT)` dihapus → gagal "rejects an amount of 1000000000001". Setelah semua mutasi, `git status` hanya berisi file test. Cek: jest 58 suite / 486 test, typecheck, lint, format:check, semua exit 0.
- [x] A2. Form: nilai yang dikirim.
  - ganti ke Pemasukan + Gaji → `onSubmit` menerima `type: "income"`, `categoryId: GAJI` (`toStrictEqual` pada `mock.calls`);
  - edit, catatan dikosongkan → `note: null`;
  - transaksi dengan `note: null` → textarea kosong, dan submit tanpa perubahan mengirim `note: null`.
  - Mutation: `setValue("type", next)` dihapus; `note ?? ""` diganti `note`. Dugaan (dicek dari kode, **belum dijalankan**): mutasi kedua lolos. Textarea memakai `register("note")` (uncontrolled), jadi tidak ada warning React; `textarea.value = null` menjadi `""` di DOM; dan schema `.nullish()` menerima default `null`, sehingga submit tetap mengirim `note: null`. Kalau benar, dicatat sebagai mutasi setara: `?? ""` hanya untuk tipe (`FormValues.note: string`) dan dijaga `tsc`, tidak dipaksakan lewat test.
  - Commit `test(transactions): check the values the form sends`
  - 21 Nov: 3 test baru, form 13 → 16. `toStrictEqual` pada `mock.calls` dengan satu argumen per panggilan (form memanggil `onSubmit(values)` saja; tebakan awal `expect.anything()` sebagai argumen kedua membuat ketiganya gagal, lalu dihapus). Mutation: `setValue("type", next)` dihapus → gagal "sends an income…" dan test lama "offers only categories…". `note ?? ""` → `note`: **lolos**, sesuai dugaan. Dicek lebih jauh di bawah mutasi itu: `npm test -- features/transactions` 16 suite / 197 test lolos, dan `tsc --noEmit` exit 0. Jadi dugaan "dijaga `tsc`" **salah**: `FormValues` = `z.input` schema, dan `.nullish()` membuat `note` menerima `null`. `?? ""` tidak mengubah perilaku yang bisa diamati (textarea uncontrolled, `null` → `""` di DOM, schema menerima `null`). Kode tidak diubah di A2 (hanya test); dibiarkan atau dihapus diputuskan terpisah. Cek: jest 58 suite / 489 test, typecheck, lint, format:check, semua exit 0.
- [x] A3. Tabel: `transaction-table.test.tsx` baru (`renderWithProviders`, store asli):
  - `aria-sort` hanya di kolom aktif, `"ascending"` untuk `order: "asc"`;
  - klik Nominal saat urut nominal turun → `{ sort: "amount", order: "asc" }`; klik Tanggal saat urut nominal → `{ sort: "date", order: "desc" }`;
  - baris `optimistic-…` → Ubah/Hapus disabled; baris biasa enabled;
  - klik "Ubah Makan siang" → `store.getState().transactionEditor` berisi `{ mode: "edit", id }`; "Hapus Makan siang" → id hapus;
  - tanpa catatan: judul = nama kategori; axe 0.
  - Mutation: `saving` selalu `false`; urutan baru selalu `desc`; `aria-sort` selalu `"descending"`.
  - Commit `test(transactions): cover the table on its own`
  - 21 Nov: `transaction-table.test.tsx` baru, 6 test (aria-sort, klik header, baris `optimistic-…`, Ubah/Hapus ke store, judul tanpa catatan, axe dengan baris yang masih disimpan). Draf pertama mencari baris lewat `getByRole("row", { name })` dan gagal (baris tidak bernama); diganti `getByTitle("Transport")`, karena hanya kolom catatan yang punya `title`. Mutation, masing-masing dikembalikan dengan `git checkout`: `saving = false` → gagal "waits with the actions…"; `order: "desc"` selalu → gagal "flips the sorted column…"; `"ascending"` → `"descending"` → gagal "marks only the sorted column…"; tambahan: `transactionTitle` tanpa nama kategori → gagal "names a row…" dan "waits…"; Hapus tanpa dispatch → gagal "opens the edit dialog…"; Ubah dengan `{ mode: "create" }` → gagal "opens the edit dialog…". Prettier memformat ulang satu `expect` (pemecahan baris). Cek: jest 59 suite / 495 test, typecheck, lint, format:check, semua exit 0.
- [ ] A4. Ringkasan gagal, di dua file karena `TransactionSummary` sendiri tidak merender tabel: `transaction-summary.test.tsx` → summary 500 → "Ringkasan gagal dimuat." (`role="alert"`); Coba lagi → kartu tampil, alert hilang. `transaction-list.test.tsx` → summary 500, tabel tetap tampil. Mutation: cabang `!data && isError` dihapus. Commit `test(transactions): cover a failed summary`
- [ ] A5. Review pekanan + README + versi:
  - CONTRIBUTING: scope `deps`; Rilis: peringatan default Squash, versi tag = `package.json`.
  - `package.json` + `package-lock.json` → `0.2.0` (`npm version 0.2.0 --no-git-tag-version`).
  - README: status v0.2 (apa yang bisa dicoba di live demo: masuk dengan akun demo, transaksi), roadmap (v0.2 ✅ + tanggal rilis yang direncanakan, v0.3 28 Nov, v1.0 5 Des), daftar "What v0.2 contains", jumlah test terbaru.
  - Commit `docs: weekly review and readme for v0.2`
- [ ] A6. Verifikasi akhir (jest penuh 2×, build dengan env dummy CI, `/transactions` ◐, self-review `git diff ccdffef..HEAD`), push (perintah terpisah, setelah konfirmasimu), PR `test: cover transaction form and table edge cases` ke `develop`, `ci` + Vercel hijau, squash merge (kamu).

### B. `fix/next-16-4-6` → PR ke `develop`
- [ ] B1. Dari `develop` terbaru. Baca catatan rilis 16.4.4–16.4.6 dan docs di `node_modules/next/dist/docs/` yang relevan. `npm install --save-exact next@16.4.6 @next/env@16.4.6` dan `eslint-config-next@16.4.6` (dev). Cek `npm audit --omit=dev` tidak lagi menyebut `next`, dan `package-lock` hanya memakai registry.npmjs.org.
- [ ] B2. Cek penuh (typegen, tsc, eslint, prettier, jest penuh, build dummy CI ◐) + browser `next dev` 390/1024/1440 terang dan gelap: `/`, `/login`, masuk demo, `/transactions` (cari, filter, tambah, ubah, hapus + Urungkan), `get_errors` kosong. Commit `fix(deps): upgrade next to 16.4.6`. Push (setelah konfirmasi), PR, `ci` + Vercel hijau, squash merge (kamu).

### C. Rilis v0.2
- [ ] C1. **Kamu, sebelum PR rilis** (urutan penting: env dulu, karena build production membaca env saat build):
  1. Neon › branch `production` › Connect: salin connection string pooled dan direct (`sslmode=verify-full`).
  2. Migrasi production dari terminalmu sendiri (nilai tidak pernah masuk ke file atau chat): `$env:DATABASE_URL_UNPOOLED = "<direct production>"; npm run db:migrate; Remove-Item Env:DATABASE_URL_UNPOOLED`. Env shell menang atas `.env.local` (`@next/env` tidak menimpa variabel yang sudah ada, dicek di `node_modules/@next/env`).
  3. Vercel › Settings › Environment Variables, **Production** saja: `DATABASE_URL` (pooled production), `BETTER_AUTH_SECRET` (baru, beda dari Preview), `BETTER_AUTH_URL=https://kleingeld.vercel.app`.
  - Aku mengecek hasilnya tanpa membaca nilai: Neon console › Tables menampilkan `users`, `categories`, `transactions`, `sessions`, `accounts`, `verifications` (kamu kirim screenshot atau sebutkan), dan nama variabel di Vercel.
- [ ] C2. PR `develop` → `main` judul `chore(release): v0.2.0`, isi catatan rilis (aku siapkan). `ci` hijau, pilih **Create a merge commit** (kamu).
- [ ] C3. `git switch main && git pull`, `git tag -a v0.2.0 -m "v0.2.0: transactions"`, push tag (perintah terpisah, setelah konfirmasi). Kamu membuat GitHub Release dari tag dengan catatan rilis yang aku siapkan.
- [ ] C4. Cek production (agent-browser, `https://kleingeld.vercel.app`): `/` → Coba akun demo → `/transactions` berisi data demo; tambah, ubah, hapus + Urungkan; filter di URL bertahan setelah reload; keluar akun → `/transactions` dialihkan ke `/login`; axe di `/`, `/login`, `/transactions` (390 dan 1440, terang dan gelap); tombol Google/GitHub tidak tampil.
- [ ] C5. Memory diperbarui (status, langkah berikutnya: task 16 Nov), hapus branch lokal yang sudah di-merge (diff dicek dulu, `-D` terpisah), hapus memory `next-session-15nov-start`.

## Verifikasi
- Setiap test baru: tercatat merah di bawah mutasinya, lalu hijau; full jest tanpa kegagalan penjaga `console.error`.
- A6/B2: semua exit code 0, jest 2× hijau, build ◐.
- C: deployment Production Vercel dari `main` sukses; alur demo jalan di production; axe 0 pelanggaran; `git ls-remote --tags origin` memuat `v0.2.0` di merge commit `main`.

## Catatan perbaikan
- Langkah awal (21 Nov), draf catatan H5a/H5b sebelum commit `b8fb4d5`: (1) "58 suite", "`git status` bersih", dan "terhadap plan ini dan AGENTS.md" ditulis tanpa bukti dari sesi 20 Nov, lalu dihapus; (2) kelas ganda `text-xl lg:text-xl` ditulis "9–10 digit", padahal dicek di `summary-layout.ts` hanya 10 digit (9 digit punya `min-[360px]:text-base`); (3) "`git status -sb` sama dengan origin" setelah push tidak tercatat buktinya, lalu dihapus.
- Draf plan ini (21 Nov): jumlah test `transaction-list.test.tsx` ditulis 28 karena `it.each` (4 kasus axe) dihitung satu test. Jest menjalankan 27 `it` + 4 kasus = 31.
- A2 (21 Nov): plan menulis mutasi `note ?? ""` "dijaga `tsc`" tanpa menjalankan `tsc`. Saat dijalankan di bawah mutasi itu, `tsc` exit 0 (tipe input `note` menerima `null`).
