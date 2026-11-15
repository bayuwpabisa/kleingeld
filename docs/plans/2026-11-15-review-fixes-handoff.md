# Plan lanjutan: sisa perbaikan setelah review task 14 Nov (untuk sesi berikutnya)

## Context
Pada 15 Nov kamu meminta semua kesalahan task 14 Nov (cari, filter, sort, dan pagination transaksi) diperbaiki, dan dipastikan tidak terulang. Sebagian besar sudah selesai (lihat Status). Saat cek ulang di browser ditemukan satu **bug baru** di list HP. Kamu meminta file plan ini supaya sisa pekerjaannya dieksekusi di sesi berikutnya.

Plan lengkap ronde perbaikan, tabel 15 kesalahan, dan catatan per langkah ada di [2026-11-14-transactions-filters.md](2026-11-14-transactions-filters.md) › "Perbaikan setelah review".

## Status saat file ini ditulis
- Branch `feature/transactions-filters`, **7 commit di depan origin (6 perbaikan + commit file ini, `bdef128`), belum di-push**. PR belum dibuka (PR terakhir #13). Working tree bersih.

  | Commit | Isi |
  |---|---|
  | `12d9f9c` | docs: plan perbaikan setelah review |
  | `f2ea288` | 18 test toolbar (dengan mutation check); chip Kategori jujur untuk kategori tak dikenal; Hapus filter me-reset toolbar dan memindahkan fokus ke kotak cari |
  | `cb97690` | test escape `\` di pencarian |
  | `8b6947b` | `jest.setup.ts` menggagalkan test yang memanggil `console.error`; warning `act()` di test dialog diperbaiki |
  | `dd0c011` | chip filter lebar tetap (`field-sizing` dibatalkan) |
  | `cfbc662` | di bawah 1440px kotak cari punya baris sendiri (urutan Tab = urutan visual) |
  | `bdef128` | docs: file plan ini |

- Sudah terbukti di browser (dicatat dengan angka di plan 14 Nov):
  - tanpa request `_rsc` saat filter, halaman, atau Back berubah;
  - optimistic tambah/ubah terlihat sebelum server menjawab;
  - layout 1024/1280/1440, terang dan gelap;
  - urutan Tab.
- Dev server dan browser sudah dimatikan (port 3000 kosong).
- Akun demo berisi baris uji ("Uji optimistic", "Uji filter Makan", "Tes form desktop", "Harus gagal"). Login demo berikutnya me-reset data demo (`seedDemoUser`). Kalau sesi browser memakai cookie lama, login demo dulu.

## Aturan kerja (wajib, juga di memory `self-review-and-fix-log`)
1. Kode/teks yang berisi `\`, backtick, atau `$` hanya ditulis dengan Edit/Write.
2. Satu perintah, satu tujuan. Sebelum commit: exit code, `git status`, `git diff --stat`, centang + catatan plan.
3. Test dulu dan harus terlihat merah. Setiap test regresi dibuktikan dengan mutation check (perbaikan dibalik → test gagal → kembalikan → `git diff --exit-code` file sumber).
4. Tidak ada stub, placeholder, atau cast. UI yang punya state: pemilik state dan transisinya ditulis dulu, dan setiap transisi mendapat test.
5. `console.error` menggagalkan test (sudah ditegakkan `jest.setup.ts`).
6. UI dicek di browser per langkah sebelum commit: 390/1024/1440 (+320/360 untuk kartu ringkasan), terang dan gelap, plus `get_errors`.
7. Setiap klaim menyebut buktinya. Yang belum dicek ditulis "belum dicek".
8. Cek lewat `node` langsung, dan exit code-nya dicatat.
9. Aksi destruktif atau push berupa perintah terpisah setelah hasil cek dibaca.
10. Versi lama file dilihat dengan `git show <rev>:<path>`, bukan `git stash`.
11. Scope commit hanya dari `scope-enum` commitlint.
12. Penyebab temuan dipastikan (ukur atau baca kode) sebelum diperbaiki. **Rekomendasi desain diperiksa dulu terhadap DESIGN.md (terutama Aksesibilitas) sebelum ditawarkan.**

## Keputusan yang diambil di awal sesi
**K1. List HP saat urutannya bukan tanggal** (bug H1). Ditanyakan lewat AskUserQuestion sebelum menulis kode:
- **A (rekomendasi): tanpa grup hari.** Saat `sort=amount`, list menjadi satu `<ul>` polos, dan tanggal pindah ke baris keterangan ("Makan · 1 Nov 2026"). Saat `sort=date` (naik/turun), list tetap dikelompokkan per hari.
- B: tetap dikelompokkan, key dan `id` judul dibuat unik (`tanggal-urutan`). Judul hari akan muncul berulang.

Sebelum menawarkan A, cek dulu bahwa A tidak melanggar DESIGN.md (Baris transaksi, States, Aksesibilitas: daftar tanpa judul tetap punya nama, misalnya `aria-label="Daftar transaksi"`).

**Hasil (sesi 15 Nov, lanjutan):**
- Cek DESIGN.md untuk A: urutan Tab tidak berubah, dan list tetap bernama (`aria-label="Daftar transaksi"`, sama dengan tabel desktop). DESIGN.md › "Daftar transaksi (HP)" (grup per hari) dan › "Baris transaksi" (keterangan = kategori) harus ikut diperbarui.
- Kamu memilih **K1 = A**.
- **K2. Kartu ringkasan 1 kolom (di bawah 360px):** ukuran bertahap hanya berlaku saat 2 kolom (360–1023px). Di bawah 360px nominal tetap `text-xl`, karena kartunya ±248px. Desktop (`lg`) mendapat ukuran hasil ukur sendiri.
- Eksekusi dibagi per bagian, dan setiap bagian berhenti untuk konfirmasimu: H0 → H1 → H2a (ukur) → H2b (kode) → H3 → H4 → H5a (cek akhir) → H5b (push).
- **K3 (saat cek browser H1):** di 320px keterangan "Tagihan · 1 Nov 2…" terpotong, sehingga tanggal hilang. Kamu memilih **tanggal di depan, tahun hanya kalau bukan tahun ini**: "1 Nov · Tagihan".
- **K4 (temuan baru di 320px):** chip tipe butuh 308px, padahal ruangnya 280px, sehingga halaman bisa di-scroll ke samping. Kamu memilih **chip boleh turun baris** (`flex-wrap`). Dikerjakan sebagai H1b, commit terpisah sebelum H2.

**Koreksi plan ini sebelum eksekusi** (hasil cek ulang di awal sesi):
1. H0 menulis "6 di depan origin". Yang benar 7, karena commit file ini ikut dihitung.
2. H1 tidak menyebut DESIGN.md. Sekarang sudah ditambahkan.
3. H1 menulis "semua test harus merah". Test `sort=date` sudah hijau karena perilakunya sudah benar, jadi dicatat sebagai penjaga, bukan test regresi. Hasil axe sebelum perbaikan belum diketahui.
4. H2 tidak menjelaskan cara menggabungkan kelas `lg:`. `cn` tidak memakai tailwind-merge, jadi helper mengembalikan satu string lengkap.
5. H2 hanya mengukur sampai 13 digit. Total ringkasan adalah jumlah banyak transaksi, jadi bisa lebih dari `MAX_AMOUNT`. Pengukuran ditambah 14 dan 15 digit.
6. Menurut perkiraan kasar, 13 digit dengan `text-sm` tetap tidak muat di 360px (isi kartu ±122px). Karena itu H2 dipecah: ukur dulu, lalu berhenti dan bertanya kalau tidak ada ukuran yang muat.
7. `agent-browser network route` belum pernah dicek. Sudah dicek di H0, dan perintahnya ada di 0.39.4.
8. DESIGN.md punya tiga baris kartu ringkasan yang tidak selaras (Kartu ringkasan `text-2xl`, Kartu ringkasan transaksi `text-xl`, dan Konten ekstrem "miliaran tetap muat"). Ketiganya diselaraskan di H2b.
9. Catatan per langkah semula dikumpulkan di H4. Itu melanggar aturan 2. Sekarang setiap commit membawa centang dan catatannya sendiri, dan H4 hanya mengoreksi klaim lama.
10. H4 belum memuat klaim "`get_errors` kosong" di plan 14 Nov. Klaim itu tidak berlaku untuk HP `sort=amount`, jadi sudah ditambahkan.
11. H5 menjalankan `tsc` tanpa `next typegen` dulu, berbeda dengan CI. Sekarang `next typegen` dijalankan dulu.
12. Push dipisah dari cek akhir (H5b).
13. Aturan 12 versi baru (kalimat DESIGN.md) baru ada di file ini. Memory `self-review-and-fix-log` sudah diperbarui di H0, dan plan 14 Nov diperbarui di H4.

## Langkah
- [x] **H0. Mulai sesi**
  - Baca file ini, memory `self-review-and-fix-log`, dan bagian "Perbaikan setelah review" di plan 14 Nov.
  - `git fetch`, lalu `git status -sb`: harus 7 di depan origin (atau sama, kalau sudah di-push) dan bersih.
  - Cek PR belum dibuka (`curl -s "https://api.github.com/repos/bayuwpabisa/kleingeld/pulls?state=all&per_page=1"`).
  - Tanyakan K1.
  - Cek `agent-browser network --help` dan `agent-browser a11y --help`.
  - Buat ulang helper di scratchpad (scratchpad tidak terbawa antar sesi): script cek `node` (typegen, tsc, eslint, jest, prettier) dan fungsi `measure()` (lihat Lampiran).
  - Hasil: fetch exit 0; `ahead 7`, bersih, tip `bdef128`; PR terakhir #13 (`feat: add transaction form`, merged), jadi PR task ini belum ada; agent-browser 0.39.4 punya `network route <url> --body <json>` dan `a11y --json` (violations + incomplete); helper `check.sh` dan `measure.js` ditulis dengan Write; K1 = A, K2 = ukuran bertahap hanya saat 2 kolom.

- [x] **H1. Bug list HP: key grup ganda saat diurutkan menurut nominal** (catatan dan bukti: plan 14 Nov › "Catatan perbaikan ronde ini" › H1)
  - Bukti bug: `get_errors` di `/transactions?type=expense&sort=amount` (390px) → "Encountered two children with the same key, `2026-11-05`" dari `transaction-groups.tsx:31` (`<section key={group.date}>`).
  - Penyebab: `groupByDate` (`features/transactions/group-by-date.ts`) mengelompokkan tanggal yang *berurutan*. Urutan nominal memisahkan tanggal yang sama, sehingga satu tanggal menjadi beberapa grup dengan key dan `id` judul (`transaksi-${date}`) yang sama.
  - Test dulu, di `transaction-list.test.tsx` › "on phones", lalu dijalankan dan hasil per test dicatat apa adanya:
    - `sort=amount` dengan baris bertanggal [hari ini, kemarin, hari ini]: tidak ada error key, tidak ada judul hari, ada 3 item di satu list bernama "Daftar transaksi", dan setiap baris menyebut kategori · tanggal. **Diharapkan merah** (penjaga `console.error` menangkap key ganda, dan judul hari masih ada).
    - `sort=date&order=asc`: tetap dikelompokkan per hari, dengan urutan judul naik. **Diharapkan hijau**: ini penjaga perilaku lama, bukan test regresi.
    - axe di list HP `sort=amount`. Hasil sebelum perbaikan **belum diketahui**.
  - Implementasi (K1=A):
    - `TransactionGroups` mendapat prop `grouping: "day" | "none"`, dan `PhoneList` mengirim `query.sort === "date" ? "day" : "none"`.
    - Isi baris dipisah menjadi `TransactionRow`, supaya kedua mode memakai markup yang sama.
    - Mode `none` merender satu `<ul aria-label="Daftar transaksi">` dengan keterangan `${category.name} · ${formatDate(date)}` (`lib/date.ts`).
    - Baris tetap berupa `<Link>`, dan baris optimistic tetap `<div>` seperti sekarang.
    - Komentar di `group-by-date.ts` menegaskan bahwa fungsi itu hanya untuk list yang diurutkan menurut tanggal.
    - DESIGN.md › "Daftar transaksi (HP)" dan "Baris transaksi": saat diurutkan menurut nominal, list menjadi satu daftar dan tanggal ada di keterangan.
  - Mutation check: paksa `grouping="day"` untuk semua urutan → test `sort=amount` harus gagal.
  - Browser (390 dan 320, terang dan gelap): `sort=amount`, `sort=date&order=asc`, Muat lebih banyak di `sort=amount` (halaman 2 bergabung tanpa key ganda), dan `get_errors` kosong.
  - Centang H1 dan tulis catatannya di plan 14 Nov › "Catatan perbaikan ronde ini" di commit yang sama.
  - Commit `fix(transactions): list phones by amount without day groups`.

- [ ] **H1b. Chip tipe turun baris di HP sempit** (K4)
  - Penyebab (dibaca dari kode dan diukur): `ChipRadioGroup` (`components/ui/chip.tsx`) memakai `flex` tanpa `flex-wrap`, dan setiap chip `shrink-0`. Di 320px: 75 + 105 + 112 + 2×8 = 308px, sedangkan ruangnya 280px. Chip "Pengeluaran" berakhir di 328px.
  - Tata letak tidak bisa diuji di jsdom, jadi buktinya pengukuran browser (`overflow.js`) di 320/360/390/1024/1440, terang dan gelap, sebelum dan sesudah perubahan. Test chip yang ada tetap hijau.
  - DESIGN.md › Chip/filter: grup tipe boleh turun baris.
  - Commit `fix(ui): let the type chips wrap on narrow phones`.

- [ ] **H2a. Ukur ambang ukuran nominal** (keputusanmu: ukuran huruf mengikuti panjang angka, 2 kolom mulai 360px, 1 kolom di bawahnya; K2: ukuran bertahap hanya saat 2 kolom). Bagian ini tanpa kode produksi dan tanpa commit.
  - Bukti masalah (R4): di 320px dengan data asli Rp19.898.000, konten 140px di kartu 132px dan halaman bisa di-scroll horizontal. Di 390px, Rp1 triliun memakai 212px di kartu 167px.
  - **Ambang diukur dulu, tidak ditebak.**
    - Di browser, jawaban summary di-mock (`agent-browser network route "**/api/transactions/summary*" --body '…'`) dengan nominal 8 sampai 15 digit. Total bisa melebihi `MAX_AMOUNT`, karena total adalah jumlah banyak transaksi.
    - Ukuran huruf diganti lewat eval (`text-2xl`=24px, `text-xl`=20px, `text-lg`=18px, `text-base`=16px, `text-sm`=14px), lalu `scrollWidth` vs `clientWidth` kartu diukur di 360px dengan 2 kolom (dua kolom tersempit).
    - Di desktop 1024 (kartu `lg` tersempit) diukur juga, termasuk Saldo negatif ("−Rp…"). Di 320 (1 kolom) dicek bahwa `text-xl` muat.
    - Dicek juga bahwa di Tailwind v4 aturan `lg:` menang atas `min-[360px]:` di ≥1024 (computed style).
    - Hasilnya ditulis sebagai tabel di catatan.
  - **Berhenti dan bertanya** kalau digit terpanjang tidak muat di 360px bahkan dengan `text-sm`. Pilihannya disajikan bersama angkanya.

- [ ] **H2b. Kartu ringkasan: implementasi**
  - Test dulu: `features/transactions/summary-amount.test.ts` untuk `summaryAmountClass(amount)` (string kelas lengkap per tingkat jumlah digit `Math.abs(amount)`: batas N−1/N digit, saldo negatif, 0, dan di atas digit terbesar) memakai ambang dari tabel. Test harus merah sebelum fungsi ditulis.
  - Implementasi:
    - `features/transactions/summary-amount.ts`: tabel tingkat berupa string literal (supaya terbaca Tailwind), hasilnya `text-xl min-[360px]:<tingkat> lg:<tingkat lg>`. Kelas ukurannya cukup satu string, karena `cn` tidak memakai tailwind-merge.
    - `transaction-summary.tsx`: `className` Money memakai helper itu; grid `grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-4`; kartu diberi `min-w-0`.
    - Saldo tetap `hidden lg:block`.
  - Mutation check: helper selalu mengembalikan ukuran terbesar → test gagal.
  - Browser: 320/360/390/1024 dengan data asli dan mock (Rp99.999.999 sampai 15 digit), terang dan gelap. Setiap kartu: `scrollWidth ≤ clientWidth`, halaman tanpa scroll horizontal, dan screenshot.
  - DESIGN.md: › Kartu ringkasan, › Kartu ringkasan transaksi (ukuran bertahap + grid), dan › States "Konten ekstrem" diselaraskan.
  - Centang H2a/H2b, lalu tulis catatan dan tabel di commit yang sama.
  - Commit `fix(transactions): fit summary amounts on small phones`.

- [ ] **H3. Axe per kondisi** (sisa R4d)
  - `agent-browser a11y --json` di:
    - default 1440;
    - hasil cari "kopi";
    - `sort=amount&page=2`;
    - filter tanpa hasil;
    - rentang Dari > Sampai (error tampil);
    - HP 390 default dan `sort=amount`;
    - HP 320 default;
    - gelap 1440 dan 390.
  - Catat jumlah violations per kondisi. Untuk "incomplete": catat rule id, elemen, dan alasannya (biasanya `color-contrast` yang tidak bisa dihitung di atas latar transparan), lalu putuskan apakah ada yang perlu diperbaiki. Kalau perlu: berhenti dan lapor dulu, lalu test atau screenshot, perbaikan, dan commit terpisah. Kalau tidak perlu: catatan dan centang masuk satu commit docs.

- [ ] **H4. Koreksi catatan dan memory** (R5)
  - `docs/plans/2026-11-14-transactions-filters.md`:
    - baris "Ada test untuk keduanya" (Langkah 6, kotak cari) → sebut test buktinya: `transaction-toolbar.test.tsx` › "keeps newer typing when its own search reaches the URL late" dan "shows a search changed elsewhere (Back, Hapus filter)";
    - "Back … tanpa request RSC" → tambahkan bukti dari cek network R4;
    - "Axe 0 pelanggaran di semua kondisi di atas" → ganti dengan hasil H3;
    - "`get_errors` kosong" (baris yang sama) → tidak berlaku untuk HP `sort=amount`, karena di kondisi itu ada bug key ganda (H1);
    - aturan 12 di "Aturan kerja tetap" → tambahkan kalimat tentang DESIGN.md;
    - "`field-sizing: content` membuat chip selebar opsi" (cek browser) → tandai dibatalkan di R4a;
    - "nominal kartu ringkasan di HP memakai `text-xl` … muat sampai ratusan juta" → tandai salah, dan rujuk H2.
  - Centang R4 dan R5 di bagian "Perbaikan setelah review". Catatan H1–H3 sudah masuk di commit masing-masing, jadi bagian ini hanya mengoreksi klaim lama.
  - Memory `kleingeld-mvp-plan`:
    - hapus "browser-checked" dan "chips use field-sizing: content";
    - ganti "summary cards text-xl on phones" dengan hasil H2;
    - tambahkan status ronde perbaikan (commit, push, PR).
  - Commit `docs: correct the filters notes`.

- [ ] **H5a. Verifikasi akhir** (R6), tanpa push
  - `node` langsung, exit code dicatat:
    - `next typegen` (seperti `npm run typecheck` dan CI), lalu tsc;
    - eslint `--max-warnings=0`;
    - prettier `--check`;
    - jest penuh **2×** (0 kegagalan penjaga);
    - build dengan env dummy CI (`DATABASE_URL=postgres://ci:ci@localhost:5432/ci`, `BETTER_AUTH_SECRET=ci-placeholder-secret-not-used-anywhere-0000`, `BETTER_AUTH_URL=http://localhost:3000`), dan `/transactions` tetap ◐.
  - Self-review `git diff e38e6c8..HEAD` terhadap plan ini dan AGENTS.md.
  - Dev server dimatikan lewat PID port.

- [ ] **H5b. Push** (setelah kamu konfirmasi)
  - Push dengan perintah terpisah setelah semua cek dibaca, lalu `git status -sb` harus sama dengan origin.
  - Kamu membuka PR `feat: add transaction search, filters and pagination` ke `develop` dan squash-merge. Setelah merge: centang box 8 plan 14 Nov di branch task 15 Nov.
  - Ringkasan chat akhir mengoreksi klaim lama secara terbuka: "muat sampai ratusan juta" salah; optimistic dan tanpa-RSC sekarang terbukti; "browser-checked" terlalu luas.

## File
- H1: `features/transactions/components/transaction-groups.tsx`, `transaction-list.tsx` (`PhoneList`), `transaction-list.test.tsx`, `features/transactions/group-by-date.ts` (komentar), `DESIGN.md`.
- H2: baru `features/transactions/summary-amount.ts` (+test); `features/transactions/components/transaction-summary.tsx`; `DESIGN.md`.
- H4: `docs/plans/2026-11-14-transactions-filters.md`, memory `kleingeld-mvp-plan.md`.
- Dipakai ulang: `lib/date.ts` (`formatDate`), `test/viewport.ts` (`setViewportWidth`, `PHONE_WIDTH`), `test/url-navigation.ts` (`setUrl`), helper `respond()` di `transaction-list.test.tsx`.

## Verifikasi
- H1: test merah lalu hijau, mutation check tercatat, dan `get_errors` kosong di `sort=amount` (390/320).
- H2: tabel ukuran hasil ukur, test merah lalu hijau, mutation check, dan semua kartu `scrollWidth ≤ clientWidth` di 320/360/390/1024 tanpa scroll horizontal.
- H3: hasil axe per kondisi + penjelasan "incomplete".
- H5a: semua exit code 0, jest 2× hijau, build ◐, `git status` bersih.
- H5b: push sukses, branch sama dengan origin.

## Lampiran: helper scratchpad
Ditulis ulang dengan Write di scratchpad sesi baru.

- Cek: `node node_modules/next/dist/bin/next typegen`, `node node_modules/typescript/bin/tsc --noEmit -p .`, `node node_modules/eslint/bin/eslint.js . --max-warnings=0`, `node --experimental-vm-modules --disable-warning=ExperimentalWarning node_modules/jest/bin/jest.js [pola]`, `node node_modules/prettier/bin/prettier.cjs --check .`. Output tiap perintah ke file, lalu cetak `exit=$?`.
- agent-browser: `export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix next-dev-loop)"` dan `AGENT_BROWSER_RESTORE` dengan nilai yang sama. Buka dengan `--restore --enable react-devtools`.
- `measure()` (eval): untuk `form[role=search]`, setiap `select[aria-label]`, dan `[role=radiogroup]`, cetak `top/left/width` dari `getBoundingClientRect()`, plus `scrollWidth > clientWidth` milik `document.documentElement`.
- Kartu ringkasan: untuk `section[aria-labelledby=ringkasan-transaksi] > div` yang tampil, cetak `clientWidth` dan `scrollWidth`.
- `<input type="date">` headless: isi lewat setter `value` native + event `input` (`fill`/keyboard tidak masuk).
