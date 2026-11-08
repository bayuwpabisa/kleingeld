# Plan 7 Nov 2026 (dikerjakan 8 Nov): Layout responsif, dark mode (Context API), landing SSG (±2 jam)

## Context
Tugas jadwal 7 Nov (Pekan 1): **"Layout responsif mobile-first (sidebar desktop, bottom nav mobile), dark mode dengan Context API, landing page SSG"**. Output: *landing + kerangka app tampil baik di HP dan desktop*. Tugas mundur satu hari; 8 Nov (buffer, merge develop → main, rilis v0.1) menyusul setelah ini.

Kondisi `origin/develop` (`658563d`): PR #4 (dialog, toast, Jest) sudah di-squash-merge. Ada `components/ui/` (Button + `buttonClasses`, Input, Select, Card, Dialog, Toast), `ToastProvider` di `app/layout.tsx`, token light/dark di `app/globals.css` (`data-theme` di `<html>` menang, tanpa atribut ikut OS; varian `dark:` sudah mengikuti keduanya). `app/page.tsx` masih template Create Next App. Toast di mobile memakai `bottom-20` permanen (menunggu bottom nav). Belum ada route app selain `/dev/ui`.

Acuan: wireframe `docs/wireframe/mvp-v1/{Desktop,Mobile}/01 Landing.png`, `03 Dashboard.png`, `09 Pengaturan.png`; DESIGN.md (Spacing dan layout, Navigasi, Segmented control, Dark mode); panduan Next 16 `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.

## Keputusan
- **Route app pakai path Inggris**, sama dengan folder `features/` dan API nanti (`/api/transactions`); label tetap Indonesia. Route group `app/(app)/` berisi `dashboard`, `transactions`, `transactions/new`, `budgets`, `bills`, `settings`. Semua masih halaman placeholder (judul + deskripsi + kartu "sedang dibangun"); isinya dibuat 12–19 Nov.
- **Tema = React Context + `localStorage`, bukan cookie.** Membaca cookie di root layout membuat seluruh app dinamis (cacheComponents), jadi landing tidak bisa SSG. Kunci `theme`, nilai `"light"` / `"dark"`; tanpa nilai = Sistem (atribut dihapus, CSS ikut OS).
  - `lib/theme.ts`: konstanta kunci, tipe `ThemePreference = "light" | "dark" | "system"`, `readTheme()`, `applyTheme(pref)` (set/hapus `data-theme` + simpan/hapus localStorage, dibungkus try/catch), `subscribe()` (event `storage` antar-tab + event kustom di tab yang sama), dan string `themeScript` untuk `<head>`, dibangun dari konstanta yang sama.
  - `components/theme/theme-provider.tsx` (`"use client"`): `ThemeProvider` + `useTheme()` → `{ theme, setTheme }`. State dibaca lewat `useSyncExternalStore` (server snapshot `"system"`), bukan setState di effect (aturan `react-hooks/set-state-in-effect`). `useLayoutEffect` memasang ulang atribut setelah remount Strict Mode di dev (sesuai panduan Next). `useTheme` di luar provider melempar error yang jelas.
  - `app/layout.tsx`: `<html suppressHydrationWarning>` tanpa `data-theme` default, `<head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>`, provider membungkus `ToastProvider`. Metadata `title: { default: "Kleingeld", template: "%s · Kleingeld" }`.
- **Pemilih tema hanya di Pengaturan** (sesuai wireframe), sebagai `SegmentedControl` Terang / Gelap / Sistem.
- **`SegmentedControl` dibangun dari radio native** (`<fieldset>` + `<legend>` + `<input type="radio" className="sr-only peer">` + label). Semantik radio group, panah kiri/kanan, dan Tab gratis dari browser. Gaya sesuai DESIGN.md › Segmented control (track `surface-muted`, pill aktif `bg-surface border-border-strong font-medium`, ukuran `md`, fokus terlihat lewat `peer-focus-visible`). Props: `legend`, `name`, `options: {value, label}[]`, `value`, `onChange`, `hideLegend?`.
- **App shell** (`components/app-shell/`):
  - `nav-items.ts`: satu daftar (Dashboard `LayoutDashboard`, Transaksi `ArrowLeftRight`, Budget `PiggyBank`, Tagihan `CalendarClock`, Pengaturan `Settings`). Sidebar memakai kelimanya; bottom nav memakai 4 pertama.
  - `nav-link.tsx` (`"use client"`, `usePathname`): `aria-current="page"` saat aktif (cocok persis atau prefix `href + "/"`), gaya aktif sesuai DESIGN.md (teks `primary`, `font-medium`, stroke 2.25, bar 3px `bg-primary`; sidebar juga `bg-primary-soft`). Varian `sidebar` dan `bottom`.
  - `sidebar.tsx`: `hidden lg:flex fixed inset-y-0 left-0 w-60 bg-surface border-r`, logo + `<nav aria-label="Navigasi utama">`. Profil + "Keluar akun" ditambah 10 Nov bersama auth.
  - `bottom-nav.tsx`: `lg:hidden fixed bottom-0 h-16` + safe-area inset, 4 item (min 44px) + FAB tengah 56px `bg-primary` (Link ke `/transactions/new`, `aria-label="Tambah transaksi"`). Diberi `data-bottom-nav`.
  - `mobile-header.tsx`: `lg:hidden sticky top-0 h-14`, logo + link ikon ke `/settings` (`aria-label="Pengaturan"`). Ini menjawab catatan review "lingkaran di header mobile belum berlabel".
  - `app/(app)/layout.tsx` (Server Component): skip link "Lewati ke konten" → `<main id="konten">`, konten `lg:pl-60`, `mx-auto max-w-300 px-5 lg:px-8 py-6 lg:py-8`, `pb-24 lg:pb-8` supaya tidak tertutup bottom nav.
  - `components/app-shell/page-header.tsx`: h1 (`text-2xl lg:text-3xl font-semibold tracking-[-0.01em]`) + deskripsi `fg-muted` + slot aksi; dipakai semua placeholder.
- **Logo** `components/brand/logo.tsx`: kotak 28px `rounded-lg bg-primary` + wordmark "Kleingeld" weight 600. Simbol final masih keputusan terbuka di DESIGN.md.
- **Offset toast**: `globals.css` → `:root:has([data-bottom-nav]) { --bottom-nav-space: calc(4rem + env(safe-area-inset-bottom)) }`; toast memakai `bottom-[calc(var(--bottom-nav-space,0px)+1rem)] lg:bottom-6`. Di landing toast tidak lagi melayang 80px.
- **Landing `app/page.tsx` tetap Server Component tanpa data request → prerender statis.** Bagian: header (logo, anchor Fitur/Cara kerja, "Masuk", "Mulai gratis"; FAQ dibuang karena tidak ada section-nya), hero (`text-4xl lg:text-5xl`, "Mulai gratis" + "Coba akun demo", catatan kecil), bingkai pratinjau `rounded-2xl border bg-surface-muted` sebagai placeholder screenshot (diganti screenshot asli setelah dashboard berdata), `#fitur` (3 Card dengan ikon Lucide), `#cara-kerja` (3 langkah bernomor, `<ol>`), CTA penutup (CTA diseragamkan: "Mulai gratis" + "Coba akun demo", sesuai review), footer. Gutter 20px, kontainer `max-w-320`.
  - **Tujuan CTA sebelum auth ada**: semua ke `/dashboard` supaya preview v0.1 bisa dijelajah; 10 Nov diganti ke `/login` dan aksi demo.
  - Hapus `public/{next,vercel,file,globe,window}.svg` bawaan template (cek dulu tidak dipakai di tempat lain).

## Test (`*.test.tsx`, test ditulis dulu dan dipastikan gagal)
- **theme-provider**: tanpa storage → `"system"` dan `<html>` tanpa `data-theme`; `setTheme("dark")` → atribut + localStorage; `setTheme("system")` → keduanya dihapus; nilai tersimpan terbaca saat mount; nilai tidak valid di storage diabaikan; `useTheme` di luar provider melempar error.
- **segmented-control**: `getByRole("radiogroup", { name })` (fieldset+legend), radio terpilih sesuai `value`, klik dan panah kanan memanggil `onChange`, axe.
- **nav-link / bottom-nav / sidebar** (mock `next/navigation` `usePathname`): item aktif punya `aria-current="page"`, yang lain tidak; `/transactions/new` mengaktifkan Transaksi; FAB punya nama aksesibel; axe.
- **settings page**: memilih "Gelap" menyetel `data-theme="dark"`.
- **landing**: satu h1, CTA "Mulai gratis" dan "Coba akun demo" ada, anchor `#fitur`/`#cara-kerja` menunjuk section yang ada, axe.

## Progres (centang saat selesai)
- [x] 0. `git switch develop && git pull`; hapus branch lokal `feature/dialog-toast-jest` (cek `git diff develop feature/dialog-toast-jest` kosong, lalu `-D`). Branch `feature/layout-theme-landing`. Simpan plan ini ke `docs/plans/2026-11-07-layout-theme-landing.md`, centang progres 5 di plan 6 Nov. Commit `docs: add layout, theme and landing plan`
- [ ] 1. `lib/theme.ts` + `ThemeProvider`/`useTheme` + script di `<head>` + test. Commit `feat(theme): add theme provider with stored preference`
- [ ] 2. `SegmentedControl` + test + demo di `/dev/ui`. Commit `feat(ui): add segmented control`
- [ ] 3. App shell (logo, nav, sidebar, bottom nav, mobile header, page header), `app/(app)/layout.tsx`, halaman placeholder, offset toast + test. Commit `feat(app): add responsive app shell with sidebar and bottom nav`
- [ ] 4. Pengaturan: bagian Tampilan dengan pemilih tema + test. Commit `feat(settings): let users pick light, dark or system theme`
- [ ] 5. Landing statis + test, hapus SVG template. Commit `feat(landing): add static landing page`
- [ ] 6. DESIGN.md (Dark mode: script `<head>` sudah ada; Navigasi: header mobile berisi link Pengaturan), AGENTS.md › Structure (`components/app-shell/`, `components/theme/`, route group `(app)`). Commit `docs: describe app shell and theme setup`
- [ ] 7. Verifikasi (di bawah), push, PR `feat: add app shell, dark mode and landing page` ke `develop`. Tunggu `ci` hijau, cek preview, lalu squash merge (kamu)

## Verifikasi
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` lolos. Di output build, `/` dan halaman `(app)` bertanda statis (○ / prerender), bukan dinamis (ƒ).
- `npm run dev` + skill next-dev-loop (agent-browser, `agent-browser a11y`), di 375px dan 1280px, light dan dark:
  - Landing: tidak ada scroll horizontal di 375px, hero → CTA → pratinjau berurutan di mobile, dua kolom di desktop, anchor Fitur/Cara kerja melompat.
  - App: sidebar tampil hanya ≥1024px, bottom nav + header mobile hanya di bawahnya; item aktif berganti saat pindah halaman (`aria-current`); konten terakhir tidak tertutup bottom nav; skip link muncul saat Tab pertama.
  - Tema: pilih Gelap di Pengaturan → reload → tetap gelap tanpa kedipan terang; pilih Sistem → ikut emulasi `prefers-color-scheme`; tidak ada error hydration di console; tab lain ikut berganti.
  - Toast dari `/dev/ui` di mobile tidak lagi melayang 80px di halaman tanpa bottom nav.
  - axe: 0 pelanggaran di landing, dashboard, dan settings (light + dark).
- Di PR: preview Vercel membuka `/`, `/dashboard`, `/settings` dengan benar di HP.
- Setelah merge: perbarui memori progres (7 Nov selesai), lanjut tugas 8 Nov (review pekanan, merge develop → main, progres di README, rilis v0.1).
