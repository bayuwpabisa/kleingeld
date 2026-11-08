# Plan 8 Nov 2026: Buffer + review pekanan, merge develop → main, progres di README, rilis v0.1 (±1 jam)

## Context
Tugas jadwal 8 Nov (akhir Pekan 1): **"Buffer + review pekanan; merge develop ke main; progres di README"**. Output: *rilis v0.1 di Vercel*.

Kondisi sekarang:
- `origin/develop` = `6828ae7` (PR #5, app shell + dark mode + landing, 60 test). Branch lokal `feature/weekly-review` berisi 1 commit `6ba4241` (centang box 7 plan 7 Nov), belum di-push.
- `origin/main` = `76bfd4f` (wireframe), tertinggal 8 commit, dan merupakan ancestor `develop` → merge bersih. Production Vercel (`kleingeld.vercel.app`) masih menampilkan isi `main` lama.
- `package.json` sudah `0.1.0`. Belum ada tag.
- `README.md` masih template Create Next App.

Temuan review pekanan (utang kecil, semua dokumen):
- `CONTRIBUTING.md` › CI dan preview menyebut 5 langkah, padahal `ci.yml` punya 6 (langkah `Test` ditambah 6 Nov). Perintah lokal juga belum memuat `npm test`.
- Box yang sudah selesai tapi belum dicentang: `docs/plans/2026-11-02-git-flow.md` box 3 (pengaturan GitHub, selesai 4 Nov) + baris verifikasi; `docs/plans/2026-11-03-tooling.md` box 7.
- `/dev/ui` ikut ke production (noindex). Dibiarkan sampai sebelum v1, sesuai keputusan 5 Nov.

## Keputusan
- **README dalam bahasa Inggris** (pilihan kamu). CONTRIBUTING dan plans tetap Indonesia. README ini versi progres; versi lengkap untuk recruiter dikerjakan 27 Nov.
- Tag **`v0.1.0`** (annotated, sama dengan `package.json`), dibuat di `main` setelah PR rilis di-merge dengan **Create a merge commit** (sesuai CONTRIBUTING › Rilis).
- Tidak ada `CHANGELOG.md`; catatan rilis ditulis di GitHub Release.
- Tidak menyinkronkan merge commit `main` kembali ke `develop`; rilis berikutnya tetap merge bersih.
- Nama target perusahaan tidak masuk README (repo publik).

## Isi README (Inggris, ±80–100 baris)
1. Judul + satu kalimat: personal finance app (transactions, monthly budgets per category, recurring bills and installments), portfolio project. Badge CI (`actions/workflows/ci.yml/badge.svg?branch=develop`).
2. **Live demo**: link `kleingeld.vercel.app` + catatan bahwa v0.1 berisi landing page dan app shell; data dan login menyusul.
3. **Status / Roadmap**: tabel rilis — v0.1 (8 Nov, foundation: tooling, CI, UI kit, app shell, dark mode, landing) ✅; v0.2 (15 Nov: database, auth + demo, transactions API/list/form/table); v0.3 (22 Nov: dashboard, charts, budgets, bills, performance, a11y audit); v1.0 (29 Nov: unit + e2e tests, Docker, production deploy, full README). Di bawahnya checklist singkat isi v0.1.
4. **Tech stack**: dua kelompok, *in use* (Next.js 16 App Router, TS strict, Tailwind v4, Jest + RTL + jest-axe, ESLint/Prettier/Husky/commitlint, GitHub Actions, Vercel) dan *planned* (Neon + Drizzle, Better Auth, Zod, TanStack Query, Redux Toolkit, RHF, Recharts, Cypress, Docker).
5. **Getting started**: Node 24 (`.nvmrc`), `npm ci`, `npm run dev`; belum perlu env vars.
6. **Scripts**: tabel `dev`, `build`, `lint`, `typecheck`, `test`, `format`/`format:check`.
7. **Project structure**: `app/`, `components/`, `features/`, `lib/`, `docs/` (singkat).
8. **Docs**: link ke `docs/mvp-scope.md`, `DESIGN.md`, `CONTRIBUTING.md`, `docs/plans/`, `docs/wireframe/`.

## Progres (centang saat selesai)
- [ ] 0. Di `feature/weekly-review`: simpan plan ini ke `docs/plans/2026-11-08-weekly-review.md`. Commit `docs: add weekly review and v0.1 release plan`
- [ ] 1. Review pekanan: CONTRIBUTING (langkah `Test` di daftar CI dan perintah lokal; contoh tag `v0.1.0` annotated di bagian Rilis), centang box basi di plan 2 Nov dan 3 Nov. Commit `docs: sync contributing with ci and tick finished plan steps`
- [ ] 2. Tulis ulang README sesuai isi di atas. Commit `docs: rewrite readme with project status`
- [ ] 3. Verifikasi lokal (di bawah), push, PR `docs: weekly review and readme for v0.1` ke `develop`. Tunggu `ci` hijau, lalu squash merge (kamu)
- [ ] 4. PR rilis `develop` → `main`, judul `chore(release): v0.1.0`, isi = catatan rilis. Tunggu `ci` hijau, pilih **Create a merge commit** (kamu)
- [ ] 5. `git fetch`, `git switch main && git pull`, `git tag -a v0.1.0 -m "v0.1.0: foundation"`, `git push origin v0.1.0` (aku minta konfirmasi sebelum push). Kamu buat GitHub Release dari tag dengan catatan rilis yang aku siapkan
- [ ] 6. Cek production, perbarui memori; hapus branch lokal `feature/weekly-review` (cek `git diff develop feature/weekly-review` kosong, lalu `-D`)

## Verifikasi
- Lokal sebelum push: `npm run lint && npm run typecheck && npm test && npm run format:check && npm run build` lolos.
- README tampil benar di GitHub (badge, tabel, link relatif ke docs tidak 404).
- Setelah merge ke `main`: deployment Production Vercel dari `main` sukses; `https://kleingeld.vercel.app/` menampilkan landing baru, `/dashboard` dan `/settings` jalan di 375px dan 1280px, pilihan tema Gelap bertahan setelah reload. `agent-browser a11y` di URL production: 0 pelanggaran di `/` dan `/dashboard`.
- `git ls-remote --tags origin` memuat `v0.1.0` yang menunjuk merge commit di `main`; GitHub Release v0.1.0 terlihat.
