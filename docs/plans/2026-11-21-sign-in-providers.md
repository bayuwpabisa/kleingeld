# Plan 21 Nov 2026: tombol Google/GitHub di /login hanya untuk provider yang aktif

## Context
Temuan C4 (plan `2026-11-15-week-2-review.md`): `/login` selalu merender "Lanjut dengan Google" dan "Lanjut dengan GitHub" (`features/auth/components/sign-in-options.tsx`), padahal `lib/auth.ts` hanya mendaftarkan provider yang punya key. Di production dan semua Preview belum ada key OAuth, jadi klik → `POST /api/auth/sign-in/social` 404 → toast "Gagal masuk dengan Google. Coba lagi atau pakai akun demo." Sudah begitu sejak PR #10. **Keputusan user (21 Nov): diperbaiki di `develop`, dirilis bersama v0.3**, sebelum task 16 Nov.

Kondisi awal (dicek 21 Nov): plan 14 Nov dan 15 Nov tidak punya kotak terbuka (`grep "- [ ]" docs/plans/` → 0); `develop` = `origin/develop` `d0f5d24`; tag `v0.1.0`, `v0.2.0`; branch lokal `develop`, `main`, `learn/playground`.

## Keputusan (21 Nov)
- **Provider dibaca saat build**, bukan saat request. `/login` tetap statis: tombol langsung ada di HTML, tanpa skeleton, tanpa layout bergeser, tetap cepat saat cold start. Di Vercel build dan runtime satu deployment memakai env yang sama, dan mengganti env memang butuh redeploy, jadi tampilan tetap cocok dengan server. Konsekuensi untuk task 25 Nov (Docker): env OAuth harus ada saat `next build` image; kalau hanya diberikan saat container jalan, server menerima provider tetapi tombolnya tersembunyi. Hanya ID provider ("google"/"github") yang sampai ke HTML, bukan nilai key.
- **Teks landing dibiarkan** ("Masuk dengan Google atau GitHub" di hero dan Cara kerja): benar lagi setelah task 26 Nov mengisi key production. Sampai saat itu landing dan login sempat tidak cocok.
- Subjudul `/login` mengikuti provider yang aktif (teks bisa diubah user saat review): 2 provider → "Pakai akun Google atau GitHub. Tidak perlu membuat password."; 1 provider → "Pakai akun GitHub. Tidak perlu membuat password."; 0 → "Coba Kleingeld dengan akun demo berisi data contoh."
- Pemisah "atau" hanya tampil bila ada minimal satu provider.

## Langkah dan commit
Branch `fix/sign-in-providers` dari `develop`, scope commit `auth`. Sebelum commit: full jest, tsc, eslint, prettier lewat `node` (exit code dicatat), `git status`, `git diff --stat`, centang + catatan.

- [x] A0. Simpan plan ini. Commit `docs: plan the sign-in providers fix`
  - 21 Nov: branch dibuat dari `develop` `d0f5d24` (`git pull --ff-only` → up to date). Isi plan dicek terhadap kode: `sign-in-options.tsx` merender `providers` tetap; `lib/auth.ts:15-30` hanya mendaftarkan provider dengan kedua key; `app/login/page.tsx` merender `<SignInOptions />` sebagai fallback Suspense.
- [ ] A1. `lib/auth-providers.ts` (tanpa import db): `SOCIAL_PROVIDERS` (id + label), `socialProvidersConfig(env)` (logika dari `lib/auth.ts`, kedua key wajib terisi), `socialProviderIds(env)` diturunkan dari config. `lib/auth.ts` memakainya. Test dulu `lib/auth-providers.test.ts`: tanpa key, hanya Google, hanya GitHub, keduanya, ID tanpa secret, string kosong. Commit `refactor(auth): read social providers in one place`
- [ ] A2. `SignInOptions` prop wajib `providers`; tombol hanya untuk provider itu (urut Google → GitHub), "atau" hanya bila ada provider. `SignInOptionsFromUrl` meneruskan. Test dulu: `[]` → tanpa Google/GitHub dan tanpa "atau", demo tetap; `["github"]` → hanya GitHub; axe untuk `[]` dan dua provider. Mutation check: daftar tetap dikembalikan → test baru merah. Bersama A3 dalam satu commit `fix(auth): show only configured sign-in providers`
- [ ] A3. `app/login/page.tsx` membaca `socialProviderIds(process.env)` saat prerender, meneruskan ke fallback dan `SignInOptionsFromUrl`; subjudul lewat helper murni `signInIntro(providers)` di `features/auth/` (dengan test + mutation check). Landing tidak diubah.
- [ ] A4. README › Auth: tombol mengikuti env saat build (Vercel: ganti env = redeploy; Docker: env OAuth saat build). Commit `docs: note when sign-in buttons follow the env`
- [ ] A5. Cek akhir: typegen + tsc, eslint `--max-warnings=0`, prettier, full jest 2×; `next build` env dummy CI tanpa key → `/login` tetap statis, HTML tanpa "Lanjut dengan Google"; build kedua dengan `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` dummy di env proses → HTML memuat Google, tidak GitHub (tombol tidak diklik); browser `/login` 390/1024/1440 terang/gelap axe 0, demo tetap jalan; self-review `git diff develop...HEAD`. Push setelah konfirmasi; user membuka PR `fix(auth): show only configured sign-in providers` ke `develop` dan squash-merge.
- [ ] A6. Setelah merge: centang kotak ini di branch berikutnya.

## Verifikasi
- Test baru merah di bawah mutasinya, lalu hijau; full jest tanpa kegagalan penjaga `console.error`.
- Build: `/login` tetap statis; tanpa key hanya demo; dengan key Google dummy hanya Google.
- Setelah rilis v0.3: production `/login` tidak lagi menampilkan tombol yang 404.

## Catatan perbaikan
