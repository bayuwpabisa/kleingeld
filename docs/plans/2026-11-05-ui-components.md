# Plan 5 Nov 2026 — Komponen UI dasar aksesibel: Button, Input, Select, Card (±1,5 jam)

## Context
Tugas jadwal hari ini (Pekan 1): **"Komponen UI dasar aksesibel: Button, Input, Select, Card"** → output: *4 komponen reusable dengan label, focus state, ARIA*.

Kondisi `develop` (`2233d22`): token warna/radius/shadow sudah ada di `app/globals.css`, aturan komponen di `DESIGN.md` (bagian Komponen, Bentuk, Aksesibilitas), `:focus-visible` global sudah ada. `components/` masih kosong, belum ada library ikon. Jest baru dipasang besok (6 Nov), jadi test komponen ini ditulis besok sebagai "test pertama".

Sisa dari 4 Nov (memori, item b) ikut dikerjakan di branch ini: centang progres 6 di `docs/plans/2026-11-04-ci-preview.md`, dan perbarui paragraf terakhir "CI dan preview" di `CONTRIBUTING.md` (repo sudah public, ruleset `protect-main-develop` aktif, `ci` sudah status check wajib).

## Keputusan
- **Select pakai `<select>` native** (jawaban pertanyaanmu soal UX): untuk app ini native lebih baik. Di HP (target utama, mobile-first) muncul picker bawaan OS yang besar dan mudah disentuh; keyboard (panah, ketik huruf untuk lompat), screen reader, autofill, dan integrasi form/RHF jalan tanpa kode tambahan; dark mode ikut `color-scheme`. Custom listbox baru unggul kalau opsi butuh konten kaya (ikon, pencarian, multi-pilih), dan dibayar dengan dependency, client JS, dan risiko bug aksesibilitas di mobile. Kalau nanti pemilih kategori butuh ikon, itu jadi komponen khusus fitur (misalnya grid ikon dengan radio), bukan Select generik.
- **Dependency baru: `lucide-react`** — sudah ditetapkan di DESIGN.md ("dipasang saat membangun komponen pertama"). Dipakai untuk chevron Select, ikon error field, dan spinner busy. Tidak menambah `clsx`/`tailwind-merge`/`cva`: varian cukup object map, dan helper `cn` 3 baris.
- **Server Component secara default.** Keempat komponen tanpa state/effect, jadi tidak perlu `"use client"` (`useId` boleh di Server Component). Tetap bisa dipakai di client component (form RHF).
- **React 19: `ref` sebagai prop biasa** (tanpa `forwardRef`), supaya `register()` dari RHF langsung jalan di Input dan Select. Semua props elemen asli diteruskan (`...props`).
- **Ukuran kontrol** sesuai DESIGN.md: `md` = `h-11 lg:h-10`, `sm` = `h-8`. Radius `rounded-lg`, Card `rounded-xl`.
- **`className` hanya untuk layout** (lebar, margin, grid), bukan menimpa warna, karena tanpa tailwind-merge urutan class tidak menentukan pemenang. Dicatat di komentar `cn`.
- **Halaman showcase `/dev/ui`** (pilihanmu): semua varian dan state, `robots: noindex`, dihapus sebelum v1 bersama playground. Bisa dibuka di preview Vercel.

## API komponen (`components/ui/`)
- **`lib/cn.ts`** — `cn(...classes)` gabung class, buang nilai falsy.
- **`button.tsx`** — `Button` + `buttonClasses({ variant, size })` (diekspor supaya `<Link>` bisa bergaya tombol).
  - `variant`: `primary | secondary | quiet | danger` (kelas persis dari DESIGN.md › Button), `size`: `md | sm`.
  - `type="button"` default (cegah submit tak sengaja).
  - `busy`: `disabled` + `aria-busy="true"` + spinner `LoaderCircle` `aria-hidden` di kiri label, label tetap.
  - disabled: `disabled:opacity-50 disabled:cursor-not-allowed`; transisi warna mati otomatis lewat reduced-motion global.
- **`field.tsx`** (internal, dipakai Input dan Select) — label di atas (`text-sm font-medium`), `hint` opsional (`text-sm text-fg-muted`), `error` opsional (`text-sm text-danger` + ikon `CircleAlert` `aria-hidden`). Membuat id dengan `useId()` (atau memakai `id` dari props) dan mengembalikan `aria-describedby` (hint + error) dan `aria-invalid`.
- **`input.tsx`** — `Input` props: `label` (wajib, `string`), `hint?`, `error?`, sisanya props `<input>`. Gaya: `bg-surface border border-border-strong rounded-lg px-3 text-base`, placeholder `text-fg-muted`, saat error `border-danger`. `<label htmlFor>` terhubung ke input.
- **`select.tsx`** — `Select` props sama dengan Input + `placeholder?` (jadi `<option value="" disabled>`), `children` = `<option>`. `appearance-none`, ruang kanan untuk `ChevronDown` (`pointer-events-none`, `aria-hidden`).
- **`card.tsx`** — `Card` props: `as?: "div" | "section" | "article" | "li"` (default `div`), `variant?: "default" | "muted"`. Gaya datar `bg-surface border border-border rounded-xl p-4 lg:p-6`, `muted` = `bg-surface-muted` (kartu saldo mobile). Heading diserahkan ke pemakai (kalau `section`/`article`, beri judul + `aria-labelledby`).

## Halaman `/dev/ui` (`app/dev/ui/page.tsx`)
Server Component, `metadata.robots = { index: false }`. Bagian: Button (4 varian × 2 ukuran, disabled, busy, link bergaya tombol), Input (default, dengan hint, error, disabled, `inputMode="numeric"`), Select (placeholder, error, disabled), Card (default, muted, contoh kartu ringkasan "Pemasukan / Rp 8.500.000" dari wireframe). Dark mode dicek lewat DevTools (emulate `prefers-color-scheme: dark`), karena toggle tema baru 7 Nov.

## Progres (centang saat selesai)
- [x] 0. Branch `feature/ui-base-components` dari `develop` terbaru; simpan plan ke `docs/plans/2026-11-05-ui-components.md`
- [x] 1. Sisa 4 Nov: centang progres 6 di plan CI, perbarui paragraf CONTRIBUTING — commit `docs: mark ci preview done and document enforced checks`
- [x] 2. `lucide-react` + `lib/cn.ts` + `Button` — commit `feat(ui): add accessible button`
- [x] 3. `Field` + `Input` + `Select` — commit `feat(ui): add input and select with labelled field`
- [x] 4. `Card` — commit `feat(ui): add card`
- [x] 5. Halaman `/dev/ui` — commit `feat(ui): add dev showcase page for base components`
- [x] 6. Verifikasi (di bawah), push, PR `feat(ui): add accessible button, input, select and card` ke `develop`, CI hijau + cek preview, squash merge (kamu)

## Verifikasi
- `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` lolos.
- `npm run dev`, buka `/dev/ui` (skill next-dev-loop untuk cek error runtime/console):
  - Tab melewati semua kontrol berurutan, outline fokus terlihat, tombol disabled/busy dilewati, Select bisa dibuka dan dipilih dengan keyboard.
  - Klik label memfokuskan input/select-nya; field error punya `aria-invalid="true"` dan `aria-describedby` yang menunjuk ke pesan error (cek di DevTools › Accessibility).
  - Light dan dark (emulasi DevTools) memakai token, tidak ada warna mentah; lebar mobile 375px kontrol `h-11`, desktop `h-10`.
  - Opsional: Lighthouse › Accessibility di halaman `/dev/ui` = 100.
- Di PR: check `ci` hijau, link preview Vercel membuka `/dev/ui`.
- Test otomatis (RTL + jest-axe) untuk Button/Input/Select ditulis besok saat Jest dipasang (tugas 6 Nov).
- Setelah selesai, perbarui memori progres (5 Nov selesai, berikutnya 6 Nov: Dialog, Toast, Jest).
