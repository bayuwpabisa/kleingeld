# Plan 21 Nov 2026: tombol macet "sedang memproses", spinner Keluar, indikator pindah halaman

## Context
User (21 Nov): semua tombol yang ada interaksinya terasa tidak memberi tanda "sedang memproses", seakan app tidak bekerja. Investigasi B1 (plan `2026-11-21-sign-in-providers.md` sesi yang sama; agent-browser + skrip timeline yang disuntik ke halaman, dev `:3000` dan production v0.2; tanpa video karena ffmpeg tidak ada):

- Windows "Show animations" nyala (`SPI_GETCLIENTAREAANIMATION` = True); spinner tombol memang berputar (`animationName` `spin`, `1s`, `infinite`).
- **Bug, juga di production:** `cacheComponents` membuat Next menyembunyikan halaman yang ditinggalkan dengan React `<Activity mode="hidden">`, bukan meng-unmount-nya, sehingga `useState` tetap (docs `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`, `03-api-reference/05-config/01-next-config-js/cacheComponents.md`).
  - `DemoSignInButton` sengaja tetap busy sampai halaman berganti. Demo login → Keluar → "Masuk" (navigasi client) → `/login` menampilkan "Menyiapkan data demo…" disabled + spinner selamanya (dev: screenshot `dev-back-to-login-2-end.png`; production: timeline 870 ms setelah klik "Masuk").
  - `SignOutButton` sama: Keluar → login demo lagi → "Keluar" di sidebar tetap pudar dan disabled (dev: `busy=Keluar` sejak `/dashboard` tampil, screenshot `dev-landing-demo-2-end.png`).
  - Reload penuh menghapusnya.
- "Keluar" di sidebar (`appearance` default, `<button>` biasa di `sign-out-button.tsx`) saat busy hanya `opacity-50`, tanpa spinner, padahal DESIGN.md › States: Busy = disabled + spinner.
- Pindah halaman: production menampilkan shell + skeleton ±430 ms setelah klik (sudah di-prefetch); dev ±960 ms tanpa tanda apa pun (dev tidak prefetch).
- Lainnya (tidak dipilih user untuk PR ini): demo login production ±7,5 dtk dengan spinner sepanjang waktu; baris optimistic hanya ditandai Ubah/Hapus pudar; simpan di HP (dev) ±860 ms tanpa tanda, production belum diukur.

Keputusan user (21 Nov): perbaiki **tombol macet**, **spinner di Keluar**, dan **indikator pindah halaman**. Satu PR fix, test dulu + mutation check.

## Rancangan

### 1. Reset state busy saat halaman disembunyikan
Pola dari docs Next: reset di cleanup `useLayoutEffect` (berjalan sinkron saat Activity menyembunyikan komponen, jadi tidak ada kilasan state lama). Satu hook kecil supaya tiga komponen tidak menulis ulang polanya: `lib/use-reset-on-hide.ts` → `useResetOnHide(reset)` (callback terbaru disimpan di ref; cleanup memanggilnya). Cleanup juga berjalan saat unmount biasa dan dua kali di StrictMode dev; keduanya aman karena reset hanya mengembalikan nilai awal.

Siapa pemilik state dan transisinya:

| Komponen | State | Transisi | Test |
|---|---|---|---|
| `DemoSignInButton` | `busy` | idle → klik → busy; gagal → idle + toast (sudah ada); berhasil → tetap busy sampai halaman berganti; **halaman disembunyikan → idle (baru)**; tampil lagi → tetap idle | baru: `<Activity>` hidden → visible setelah login berhasil → tombol aktif, label "Masuk dengan akun demo" |
| `SignOutButton` (kedua `appearance`) | `busy` | idle → klik → busy; gagal → idle + toast (cek kodenya); berhasil → ke `/` (layout `(app)` disembunyikan) → **idle (baru)** | baru: sama, untuk `appearance` default dan `"button"` |
| `SignInOptions` | `pending` (Google/GitHub) | null → klik → provider; gagal → null + toast; berhasil → browser pindah ke provider (unload penuh); **halaman disembunyikan → null (baru)** | baru: `<Activity>` hidden → visible saat pending → tombol aktif |

Kasus terpisah yang dicek di browser: klik Google → halaman Google → tombol Back browser. Itu bfcache browser, bukan Activity; kalau tombol kembali macet, ditambah reset di event `pageshow` (`persisted`) dengan test, kalau tidak dicatat "tidak perlu".

Audit state lain yang ikut terawetkan (cek di browser, keputusan dicatat; perubahan hanya untuk yang jelas macet atau rusak, yang lain ditanyakan ke user): form `/transactions/new` setelah simpan lalu dibuka lagi; dialog konfirmasi hapus di `/transactions/[id]/edit` (`confirmDelete`); toolbar transaksi (draf rentang tanggal, panel rentang terbuka, teks cari).

### 2. Spinner di "Keluar" (sidebar)
Saat busy, ikon `LogOut` diganti `LoaderCircle animate-spin` di kotak yang sama (`size-5`, tanpa layout bergeser); label tetap "Keluar"; `disabled` + `aria-busy` tetap. Varian `appearance="button"` sudah memakai `Button busy`.

### 3. Indikator pindah halaman (`useLinkStatus`)
Komponen klien kecil `NavLinkIcon` di `components/app-shell/` dipakai di dalam `<Link>` sidebar, bottom nav, dan FAB "Tambah": saat `pending` dari `useLinkStatus` (bawaan `next/link`, tanpa dependency baru), ikon diganti spinner di kotak yang sama. Mengikuti saran docs: spinner muncul dengan jeda ±100 ms (mulai `opacity: 0`) supaya navigasi cepat tidak berkedip; keyframes di `app/globals.css`. Dengan reduced motion, aturan global sudah mematikan animasi (spinner tampil diam). Spinner `aria-hidden`; pembaca layar tetap mendapat judul halaman baru. Item aktif tetap memakai penanda yang ada (`aria-current`, bar 3px, stroke 2.25).

## Langkah dan commit
Branch `fix/busy-feedback` dari `develop` `0cf90f1`, scope commit `auth` dan `ui`. Sebelum commit: full jest, tsc, eslint, prettier lewat `node` (exit code dicatat), `git status`, `git diff --stat`, centang + catatan. Berhenti setelah setiap langkah dan tunggu "lanjut".

- [x] C0. Plan ini + centang A5/A6 di `2026-11-21-sign-in-providers.md` (PR #21 → `0cf90f1`). Commit `docs: plan the busy feedback fixes`
  - 21 Nov: branch dari `develop` `0cf90f1`. Audit `useState` (grep di `app/`, `components/`, `features/`, `lib/`): yang bisa macet busy hanya `DemoSignInButton.busy`, `SignInOptions.pending`, `SignOutButton.busy`; sisanya masuk audit C2. Docs yang dibaca: `preserving-ui-state.md`, `cacheComponents.md`, `use-link-status.md` (harus di dalam `<Link>`, pending dilewati bila sudah di-prefetch, saran jeda ±100 ms dan elemen berukuran tetap). React 19.3.0 mengekspor `Activity`.
- [x] C1. `useResetOnHide` + pakai di `DemoSignInButton`, `SignInOptions`, `SignOutButton`. Test dulu (merah): transisi baru di tabel di atas, dengan `<Activity>` dari `react` 19.3. Mutation check: hook dilepas dari tiap komponen → test komponen itu merah. Browser (dev, 390/1440): alur demo → Keluar → "Masuk" → tombol demo aktif; Keluar → demo lagi → "Keluar" aktif; Google → Back browser (lihat di atas). Commit `fix(auth): reset busy sign-in buttons when their page is hidden`
  - 21 Nov: test baru (komponen dibungkus `<Activity>`, `rerender` hidden → visible): `demo-sign-in-button.test.tsx` (file baru, 1), `sign-out-button.test.tsx` (`it.each` `button` dan `nav`, 2), `sign-in-options.test.tsx` describe "SignInOptions when its page comes back" (1). Sebelum perbaikan keempatnya merah dengan alasan yang benar: tombol masih "Menyiapkan data demo…" / "not enabled". Tiap test juga memastikan state busy memang ada sebelum disembunyikan. Setelah `lib/use-reset-on-hide.ts` dipakai: 21/21 hijau di `features/auth/components`. Mutation check (reset diganti `() => {}`, dikembalikan sesudahnya): M1 demo → hanya test demo merah; M2 sign-out → hanya 2 test sign-out merah; M3 sign-in options → hanya test provider merah. Mutasi pada hook itu sendiri (misalnya `useEffect` ganti `useLayoutEffect`) tidak diuji: jsdom tidak membedakan waktunya, jadi pilihan `useLayoutEffect` bersandar pada docs Next.
  - Browser (dev `:3000`, skrip `flow-c1.sh`, sesi baru per lebar): 1440 → demo → Keluar sidebar → `/` → "Masuk" (navigasi client) → `/login`: tombol terlihat `["Masuk dengan akun demo"]` tanpa disabled/busy; demo lagi → `/dashboard`: `["Keluar"]` tanpa disabled/busy; `agent-browser errors` kosong. 390 → sama, keluar lewat `/settings`: hasil sama; screenshot `c1-390-login-again.png` normal. Google → halaman `accounts.google.com` → Back: ketiga tombol aktif, tetapi tipe navigasi `back_forward` (halaman dimuat ulang, bukan dipulihkan dari bfcache), jadi kasus bfcache sendiri **belum dicek**; tidak ditambah handler `pageshow` tanpa bukti. Dicek ulang di browser biasa saat task 26 Nov (OAuth production).
  - Cek (`check.sh`): typegen, tsc, eslint, prettier, jest semua exit 0; 62 suite / 517 test (513 + 4), 0 baris `console.error`.
- [x] C2. Audit state lain (lihat Rancangan 1), hasil + keputusan dicatat; perubahan hanya bila jelas rusak, dengan test dulu. Commit hanya bila ada perubahan.
  - 21 Nov, audit di browser (dev `:3000`, sesi demo baru):
    - T1 `/transactions/new` (390): isi Rp11.111 Transport "Audit C2 simpan" → Simpan → list → "Tambah transaksi" lagi → **form masih berisi nilai lama** (screenshot `c2-new-after-save.png`) → bisa tersimpan dua kali. Rusak.
    - T2 draf tanpa simpan → keluar lewat bottom nav "Budget" → "Tambah" lagi → isian tetap ada. Percobaan pertama lewat "Dashboard" tidak sah (link tertutup badge dev tools Next, klik tidak terjadi). **Keputusan user: draf dipertahankan.**
    - T3 `/transactions/[id]/edit` (390): "Hapus transaksi" → sheet terbuka → Back → kembali ke transaksi yang sama → **sheet "Hapus transaksi ini?" terbuka lagi sendiri**. Efek samping dicek: setelah Back tidak ada `dialog[open]:modal`, scroll lock tidak aktif, list bisa digulir (`scrollY` 600). **Keputusan user: sheet ditutup saat halaman ditinggalkan.**
    - T4 toolbar (1440): cari "bakso" → `?q=bakso` → Dashboard → "Transaksi" (`/transactions` tanpa `q`) → kotak cari kosong, sesuai URL. Panel "Rentang tanggal…" terbuka tanpa tanggal → keluar → kembali: panel tetap terbuka, ringkasan "Semua waktu" (filter belum berlaku). Ini panel filter; docs Next menyebutnya state yang layak dipertahankan. Tidak diubah.
    - Belum dicek: dialog desktop (Redux `transactionEditor`, di layout `(app)`) saat tombol Back ditekan dengan dialog terbuka. Bukan state halaman yang terawetkan Activity, jadi di luar audit ini.
  - Perbaikan: `NewTransactionScreen` memberi `key` pada form dan menaikkannya di `useResetOnHide`, hanya bila form sudah disubmit (ref `saved`). Reset terjadi saat halaman disembunyikan, bukan saat Simpan, supaya form tidak kosong sendiri selama list dimuat. Kalau server gagal setelah submit, isian tidak dipulihkan (sama dengan sebelum Next 16: halaman di-unmount); toast gagal tetap muncul dari mutation. `EditTransactionScreen`: `useResetOnHide(() => setConfirmDelete(false))`.
  - Test dulu di `transaction-screens.test.tsx`: "starts empty when opened again after saving" (merah: `Received: 12.000`), "keeps an unsaved draft when the page comes back" (hijau sejak awal, penjaga keputusan draf), "closes the delete sheet when the page is left" (merah: dialog masih ada). Setelah perbaikan 9/9 hijau. Mutation check (dikembalikan sesudahnya): M4 selalu reset (`&& false`) → hanya test draf merah; M5 key tidak naik → hanya "starts empty…" merah; M6 reset sheet dilepas → hanya test sheet merah.
  - Browser setelah perbaikan (390, `flow-c2-phone.sh` versi field terlihat saja): T1 dibuka lagi → `amount=`, `Pilih kategori`, `note=` (kosong); T2 → draf Rp22.222 "Audit C2 draf" tetap; T3 pada transaksi "Audit C2 simpan" (sekaligus bukti simpan berhasil) → Back → kembali → tidak ada sheet. Tepat setelah Back, halaman tersembunyi masih punya `dialog[open]` (update di `<Activity>` hidden ditunda React sampai tampil); tidak terlihat dan tidak mengunci scroll. `agent-browser errors` kosong.
  - Cek (`check.sh`): run pertama prettier exit 1 (format file test), diperbaiki dengan `prettier --write` untuk file itu, lalu `check.sh` ulang: semua exit 0; 62 suite / 520 test (517 + 3), 0 baris `console.error`.
- [ ] C3. Spinner di "Keluar" sidebar. Test dulu: busy → spinner ada, ikon `LogOut` tidak; mutation check. Browser 1440 terang/gelap. Commit `fix(auth): show a spinner while signing out from the sidebar`
- [ ] C4. `NavLinkIcon` + `useLinkStatus` di sidebar, bottom nav, FAB. Test dulu dengan `useLinkStatus` di-mock (pending → spinner, tidak → ikon); mutation check. Browser: dev (tanpa prefetch) klik item → spinner tampil sampai halaman berganti, 390/1024/1440 terang/gelap, axe 0; layout tidak bergeser (ukuran kotak ikon sama). Commit `feat(ui): show a pending spinner on app navigation links`
- [ ] C5. Cek akhir: typegen + tsc, eslint, prettier, full jest 2×, build, self-review `git diff develop...HEAD`. Push setelah konfirmasi; user membuka PR dan squash-merge.

## Verifikasi
- Setiap test baru merah di bawah mutasinya, lalu hijau; full jest tanpa kegagalan penjaga `console.error`.
- Alur yang tadi macet (demo → Keluar → Masuk; Keluar → demo → Keluar) tidak macet di dev, dan setelah rilis di production.
- Indikator nav tidak menggeser layout dan tidak berkedip pada navigasi cepat.

## Catatan perbaikan
- Plan C0 menulis "Keluar" sidebar memakai `appearance` default. Salah: default `SignOutButton` adalah `"button"` (tombol penuh, sudah ber-spinner); sidebar memakai `appearance="nav"` (`<button>` biasa tanpa spinner). Terlihat saat membaca `sign-out-button.tsx` di C1. C3 berlaku untuk `appearance="nav"`.
- Investigasi B1 (sebelum C0): (1) satu perintah `agent-browser` mengklik "Keluar" saat sudah di `/login`, sehingga tidak berbuat apa-apa; hasilnya tidak dipakai. Output sign-out production terpotong (`tail -3`), jadi durasinya tidak dikutip. (2) Skrip bantu di scratchpad sempat diubah dengan `sed` (aturan kerja 1: hanya Edit/Write); perubahan dicek dan benar, selanjutnya memakai Edit.
