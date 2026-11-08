# Plan 4 Nov 2026 — CI GitHub Actions + Vercel preview deploy (±1,5 jam)

## Context
Tugas jadwal hari ini (Pekan 1): **"CI GitHub Actions (lint, typecheck, build di setiap PR) + Vercel preview deploy"** → output: *PR pertama lolos CI dengan link preview*.

Kondisi `develop` sekarang (`717f42c`, PR #3 sudah di-squash-merge):
- **Sudah ada:** script `lint`, `typecheck`, `format:check`, `build`; Husky + lint-staged + commitlint; `.gitattributes` `eol=lf`.
- **Belum ada:** folder `.github/workflows/`, versi Node yang dikunci, project Vercel.
- `CONTRIBUTING.md` bagian "Menyusul" menjanjikan CI sebagai status check wajib hari ini.

## Keputusan
- **Satu job `ci`** di `.github/workflows/ci.yml`, urutan: `npm ci` → `lint` → `typecheck` → `format:check` → `build`. Satu job lebih cepat daripada empat job paralel (tiap job harus `npm ci` sendiri) dan cukup untuk proyek sekecil ini. Kalau satu langkah gagal, langkah berikutnya tidak jalan; nama langkah di tab Checks menunjukkan mana yang gagal.
- **Trigger:** `pull_request` ke `develop` dan `main`, plus `push` ke `develop` dan `main` supaya hasil squash merge juga dicek. `concurrency` membatalkan run lama di PR yang sama saat ada push baru.
- **`permissions: contents: read`**: workflow tidak butuh izin tulis.
- **Node 24** (sama dengan laptop) lewat `.nvmrc`, dibaca `actions/setup-node` (`node-version-file`). `package.json` `engines.node: "24.x"` supaya Vercel memakai versi yang sama.
- **Cache:** `actions/setup-node` dengan `cache: npm` untuk `~/.npm`, plus `actions/cache` untuk `.next/cache` sesuai `node_modules/next/dist/docs/01-app/02-guides/ci-build-caching.md`.
- **`HUSKY=0`** di CI: hook git tidak perlu dipasang di runner.
- **`typecheck` jadi `next typegen && tsc --noEmit`.** Di clone baru belum ada `next-env.d.ts` dan `.next/types` (keduanya di-ignore), jadi `tsc` saja tidak mengecek tipe route. Docs Next 16 (`06-cli/next.md`, bagian `next typegen`) menyarankan pola ini untuk CI.
- **Vercel lewat integrasi GitHub** (bukan Vercel CLI di Actions): setiap push ke branch selain `main` dapat preview URL dan komentar di PR; `main` = production. Tidak perlu token atau secret di repo. Kamu yang menghubungkan repo di dashboard Vercel.
- **Status check wajib:** repo masih private di plan Free, jadi ruleset/branch protection tidak diterapkan GitHub. CONTRIBUTING mencatat aturannya ("PR harus hijau sebelum merge"), dan check `ci` dijadikan required saat repo dibuat public.

## Progres (centang saat selesai)
- [x] 0. Simpan plan ke `docs/plans/2026-11-04-ci-preview.md`
- [x] 1. Branch `feature/ci-preview` dari `develop`
- [x] 2. Workflow CI + `.nvmrc` + `engines`
- [x] 3. Script `typecheck` dengan `next typegen`
- [x] 4. Dokumentasi (CONTRIBUTING, AGENTS.md)
- [x] 5. Verifikasi di clone bersih
- [x] 6. Hubungkan Vercel (kamu), push, PR ke `develop`, CI hijau + link preview

## Langkah
### 2. Workflow — commit `ci: add github actions workflow for lint, typecheck and build`
`.github/workflows/ci.yml`, `.nvmrc` (`24`), `engines` di `package.json`.

### 3. Typecheck — commit `build: generate route types before typecheck`
`"typecheck": "next typegen && tsc --noEmit"`.

### 4. Dokumentasi — commit `docs: document ci checks and vercel previews`
- `CONTRIBUTING.md`: bagian baru **"CI dan preview"** (apa yang dicek, cara baca hasil, link preview Vercel, cara menjalankan pengecekan yang sama di lokal); hapus bagian "Menyusul".
- `AGENTS.md` Commands: keterangan `typecheck` baru.
- Plan ini, progres dicentang.

### 5. Verifikasi di clone bersih
`git clone` repo lokal ke folder sementara, lalu `npm ci` dan semua langkah CI dengan `HUSKY=0`. Ini meniru runner GitHub (tanpa `.next`, tanpa `next-env.d.ts`).

### 6. Vercel dan PR
1. vercel.com → **Add New → Project** → import `bayuwpabisa/kleingeld` (izinkan Vercel GitHub App mengakses repo ini). Framework terdeteksi Next.js, build command bawaan. Belum ada env var.
2. Settings → Git: Production Branch = `main`.
3. Setelah itu push `feature/ci-preview`, buka PR ke `develop` dengan judul `ci: add github actions workflow and vercel previews`, isi template.
4. Tunggu check `ci` hijau dan komentar bot Vercel berisi preview URL, buka URL-nya, lalu squash merge.

## Verifikasi
- Di clone bersih: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` lolos.
- Di PR: tab Checks menampilkan job `ci` sukses; komentar Vercel berisi preview URL dan halaman bisa dibuka.
- Uji gagal (opsional): commit dengan error tipe di branch uji → check `ci` merah di langkah `Typecheck`.
- Setelah selesai, perbarui memori progres (4 Nov selesai, berikutnya 5 Nov: komponen UI dasar).
