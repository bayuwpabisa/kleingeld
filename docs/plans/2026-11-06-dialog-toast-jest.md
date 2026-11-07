# Plan 6 Nov 2026 (dikerjakan 7 Nov): Dialog dan Toast aksesibel + Jest, RTL, jest-axe (±2 jam)

## Context
Tugas jadwal 6 Nov (Pekan 1): **"Dialog dan Toast aksesibel (focus trap, Esc) + setup Jest, RTL, jest-axe; test pertama"**. Output yang diminta: *test komponen pertama jalan di CI*. Tugas ini mundur satu hari. 7 Nov (layout + dark mode + landing) menyusul, dan 8 Nov (buffer) dipakai untuk mengejar.

Kondisi `develop` (`ef35c14`): `components/ui/` sudah berisi Button, Input, Select (lewat `field.tsx`) dan Card, tapi belum punya test. Lalu ada `lib/cn.ts`, `lucide-react`, dan halaman showcase `/dev/ui`. Aturan Dialog dan Toast sudah ada di DESIGN.md (bagian Komponen, Bentuk, States). CI (`.github/workflows/ci.yml`) belum punya langkah test.

Sisa dari 5 Nov: centang progres 6 di `docs/plans/2026-11-05-ui-components.md` di branch ini.

## Keputusan
- **Dialog pakai `<dialog>` native + `showModal()`, tanpa dependency** (bukan Radix). Browser sudah memberi semuanya: halaman di belakang jadi inert (fokus terkunci di dialog), Esc memicu event `cancel`, ada `::backdrop` untuk scrim, dan dialog muncul di top layer tanpa portal. Kita cukup menambah tiga hal: (1) komponen controlled (`open` + `onOpenChange`), dengan `useEffect` yang memanggil `showModal()`/`close()`; (2) `cancel` di-`preventDefault()` lalu memanggil `onOpenChange(false)`, supaya state tetap dipegang React; (3) elemen pemicu disimpan saat dibuka dan difokuskan lagi saat ditutup, jadi tidak bergantung pada perilaku browser. Klik di scrim juga menutup dialog (`event.target === dialog`).
- **Toast pakai React Context (`ToastProvider` + `useToast`)**, bukan Redux dulu. Redux Toolkit baru dipasang 12 Nov. API `useToast().show(...)` tidak bergantung pada tempat state disimpan, jadi kalau nanti dipindah ke slice Redux, pemakainya tidak berubah. Hanya satu toast tampil sekaligus; toast baru menggantikan yang lama.
- **Dependency dev baru**, semuanya untuk test:
  - `jest`, `jest-environment-jsdom`, `@types/jest`
  - `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`
  - `@testing-library/user-event`, untuk simulasi keyboard yang realistis (Tab, Esc, Enter)
  - `jest-axe` + `@types/jest-axe`, untuk cek aksesibilitas otomatis
  - Tidak memakai `ts-node`, karena config ditulis sebagai `jest.config.mjs` dengan JSDoc `@type`. File setup dan test tetap TS lewat transform SWC dari `next/jest`.
- **Test diletakkan di samping komponennya** (`components/ui/button.test.tsx`), bukan di `__tests__/`. Komponen dan test-nya mudah ditemukan bersama, dan pola ini nanti juga dipakai di `features/`.
- **Test-first untuk Dialog dan Toast.** Test ditulis dulu dan dipastikan gagal, baru komponennya dibuat. Untuk Button/Input/Select/Card (yang sudah ada), test ditulis sebagai pengaman.

## Setup Jest
- `jest.config.mjs`: `nextJest({ dir: "./" })`, `testEnvironment: "jsdom"`, `setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]`, `moduleNameMapper` `^@/(.*)$` → `<rootDir>/$1`, `testPathIgnorePatterns` untuk `.next/` dan `node_modules/`.
- `jest.setup.ts`: impor `@testing-library/jest-dom` dan `expect.extend(toHaveNoViolations)`. jsdom belum mengimplementasikan `HTMLDialogElement.showModal/close` (cek dulu setelah install). Kalau memang belum ada, tambahkan stub kecil yang menyetel atribut `open` dan memicu event `close`. Stub ini diberi komentar bahwa focus trap yang sebenarnya diverifikasi di browser.
- `package.json`: script `"test": "jest"` dan `"test:watch": "jest --watch"`.
- CI: tambah langkah `Test` (`npm test -- --ci`) setelah Typecheck di `.github/workflows/ci.yml`.
- Dokumen: di `AGENTS.md` (bagian Commands), ganti "add the script when Jest is set up" menjadi perintah yang sebenarnya, dan sebutkan bahwa test diletakkan di samping komponen.

## API komponen (`components/ui/`)
- **`dialog.tsx`** (`"use client"`): `Dialog` dengan props `open`, `onOpenChange(open)`, `title` (wajib), `description?`, `children` (isi + tombol).
  - `aria-labelledby` menunjuk ke judul (`text-xl font-semibold`) dan `aria-describedby` ke deskripsi; id-nya dari `useId`.
  - Tombol tutup berupa ikon `X` dengan `aria-label="Tutup"`, ukuran 44px di mobile.
  - Fokus awal jatuh ke kontrol pertama (perilaku bawaan `showModal`). Dengan `autoFocus`, pemakai bisa memilih kontrol lain.
  - Gaya: `bg-surface shadow-overlay`, scrim `backdrop:bg-black/40`. Di desktop (`lg`), dialog di tengah dengan lebar `max-w-[560px]` dan `rounded-2xl`. Di mobile, dialog menjadi bottom sheet: menempel di bawah, lebar penuh, `rounded-t-2xl`.
  - `DialogActions`: tempat tombol. Di desktop: batal (secondary) di kiri, primary di kanan. Di mobile: primary penuh di atas, batal di bawahnya (`flex-col-reverse lg:flex-row lg:justify-end`).
  - Scroll halaman dikunci saat dialog terbuka lewat `html:has(dialog[open]) { overflow: hidden }` di `app/globals.css`.
- **`toast.tsx`** (`"use client"`): `ToastProvider` dan `useToast()` → `{ show({ message, action? }), dismiss() }`, dengan `action = { label, onClick }`.
  - Live region `role="status"` (`aria-live="polite"`) **selalu ada di DOM**, dan hanya isinya yang berganti, supaya screen reader membacanya.
  - Toast hilang sendiri setelah 4 detik. Timer berhenti saat kursor di atas toast atau fokus ada di dalamnya, lalu berjalan lagi setelahnya (WCAG 2.2.1).
  - Gaya: `bg-fg text-canvas shadow-overlay rounded-xl`. Posisinya kiri bawah di desktop, dan di atas area bottom nav di mobile (offset bottom nav dirapikan 7 Nov saat layout jadi).
  - Aksi ("Urungkan") memakai `text-canvas font-medium underline` dengan target sentuh ≥24px. Ada juga tombol tutup ikon `X` dengan `aria-label="Tutup"`. Tidak memakai `text-primary`.
  - `useToast` di luar provider melempar error yang jelas.
- **`app/layout.tsx`**: `<body>` dibungkus `ToastProvider`. Layout tetap Server Component; hanya provider yang client.

## Test (`*.test.tsx` di samping komponen)
- **Button**: label dirender; nilai default `type="button"`; `busy` → disabled + `aria-busy` + label tetap ada; `onClick` tidak terpanggil saat disabled; axe 0 pelanggaran.
- **Input / Select**: klik label memfokuskan kontrol (`getByLabelText`); `error` → `aria-invalid` dan `aria-describedby` berisi pesan (`toHaveAccessibleDescription`); `hint` juga terbaca; Select memilih opsi lewat keyboard/`selectOptions`; axe.
- **Card**: `as="section"` merender elemen yang benar; axe.
- **Dialog**: `open` → `getByRole("dialog", { name: judul })` dan deskripsinya terbaca; Esc dan tombol "Tutup" memanggil `onOpenChange(false)`; setelah ditutup, fokus kembali ke tombol pemicu; axe saat terbuka.
- **Toast**: `show()` → pesan muncul di `role="status"`; dengan fake timers, toast hilang setelah 4 detik; hover/fokus menahan timer; klik "Urungkan" memanggil `onClick` lalu menutup toast; `show()` kedua menggantikan yang pertama; axe.

## Halaman `/dev/ui`
Tambah komponen client `app/dev/ui/overlay-demo.tsx` dan pasang di `page.tsx`. Isinya:
- tombol "Hapus transaksi" yang membuka dialog konfirmasi ("Hapus transaksi?", Batal + Hapus `danger`); setelah dikonfirmasi muncul toast "Transaksi dihapus" · Urungkan
- tombol yang memunculkan toast tanpa aksi ("Transaksi disimpan")

## Progres (centang saat selesai)
- [x] 0. Branch `feature/dialog-toast-jest` dari `develop` terbaru. Simpan plan ini ke `docs/plans/2026-11-06-dialog-toast-jest.md` dan centang progres 6 di plan 5 Nov. Commit `docs: add dialog, toast and jest plan`
- [ ] 1. Install dependency dev, `jest.config.mjs`, `jest.setup.ts`, script, test Button/Input/Select/Card, langkah CI, `AGENTS.md`. Commit `test: set up jest, testing library and jest-axe`
- [ ] 2. Test Dialog (gagal dulu), lalu `dialog.tsx` + CSS scroll lock. Commit `feat(ui): add accessible dialog`
- [ ] 3. Test Toast (gagal dulu), lalu `toast.tsx` + provider di layout. Commit `feat(ui): add toast with undo action`
- [ ] 4. Demo di `/dev/ui`. Commit `feat(ui): show dialog and toast on dev page`
- [ ] 5. Verifikasi (di bawah), push, PR `feat(ui): add dialog, toast and first component tests` ke `develop`. Tunggu check `ci` hijau (termasuk langkah Test) dan cek preview, lalu squash merge (kamu)

## Verifikasi
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` semuanya lolos. Satu test sengaja dibuat gagal untuk memastikan Jest memang mendeteksi kegagalan, lalu dikembalikan.
- `npm run dev`, lalu buka `/dev/ui` dengan skill next-dev-loop (agent-browser + `agent-browser a11y` untuk axe), di light dan dark (emulasi):
  - Dialog: Tab dan Shift+Tab berputar di dalam dialog dan tidak keluar ke halaman. Esc menutup. Fokus kembali ke "Hapus transaksi". Klik scrim menutup. Halaman di belakang tidak bisa di-scroll. Di 375px dialog tampil sebagai bottom sheet dengan tombol primary di atas.
  - Toast: muncul di kiri bawah, hilang setelah ±4 detik, tertahan saat di-hover. "Urungkan" bisa dicapai dengan Tab dan menjalankan aksinya.
  - axe: 0 pelanggaran.
- Di PR: log CI menampilkan langkah Test dengan jumlah test yang lolos. Preview Vercel bisa membuka `/dev/ui`.
- Setelah merge, perbarui memori progres: 6 Nov selesai, berikutnya 7 Nov (layout responsif, dark mode, landing SSG).
