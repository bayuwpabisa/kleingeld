# Contributing

Aturan branch, commit, dan PR untuk Kleingeld.

## Branch

```
main      ●─────────────────●──────────  rilis (production di Vercel), tag v0.x
           \               /
develop     ●───●───●───●─●────────────  integrasi
                 \     /
feature/*         ●───●                  fitur baru, dari develop
```

| Branch | Dibuat dari | Merge ke | Isi |
|---|---|---|---|
| `main` | — | — | Kode rilis. Hanya menerima PR dari `develop` atau `hotfix/*`. |
| `develop` | `main` | `main` | Integrasi semua fitur. Default branch di GitHub. |
| `feature/<nama>` | `develop` | `develop` | Fitur atau dokumen baru |
| `fix/<nama>` | `develop` | `develop` | Bug yang ada di `develop` |
| `hotfix/<nama>` | `main` | `main` dan `develop` | Bug di production |

Nama branch pakai kebab-case, misalnya `feature/transaction-form`, `fix/budget-rounding`.

`main` dan `develop` dilindungi: tidak bisa push langsung, tidak bisa force push, dan tidak bisa dihapus. Semua perubahan lewat PR.

## Commit

Format [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): deskripsi singkat
```

- **type:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **scope** (opsional): `transactions`, `budgets`, `bills`, `dashboard`, `auth`, `ui`, `db`
- **deskripsi:** huruf kecil, kalimat perintah, tanpa titik di akhir

Contoh:

```
feat(transactions): add transaction form with zod validation
fix(budgets): round progress to whole percent
docs: add git flow guide
```

Perubahan yang merusak kompatibilitas ditandai dengan `!` (`feat(db)!: rename amount column`) atau footer `BREAKING CHANGE: ...`.

Satu commit untuk satu tugas.

## Alur PR

1. `git switch develop && git pull`
2. `git switch -c feature/<nama>`
3. Commit kecil-kecil, lalu `git push -u origin feature/<nama>`
4. Buka PR ke `develop`. Isi template, dan pastikan judul PR mengikuti format commit di atas.
5. Cek checklist di template, lalu **Squash and merge**. Judul PR menjadi pesan commit di `develop`.
6. Branch feature terhapus otomatis setelah merge.

## Rilis

1. Buka PR `develop` → `main`, lalu pilih **Create a merge commit** (jangan squash, supaya `main` dan `develop` tidak bercabang).
2. Beri tag di `main`: `git tag v0.x && git push origin v0.x`
3. Buat GitHub Release dari tag tersebut.

## Hook commit

Hook dipasang otomatis oleh Husky saat `npm install`.

| Hook | Yang dicek |
|---|---|
| `pre-commit` | lint-staged menjalankan `eslint --fix --max-warnings=0` lalu `prettier --write` pada file `.js/.mjs/.ts/.tsx` yang di-stage, dan `prettier --write` pada `.json/.css`. Commit gagal kalau masih ada error atau warning ESLint. |
| `commit-msg` | commitlint menolak pesan yang tidak sesuai format di atas. Scope di luar daftar hanya memberi peringatan. |

```
git commit -m "update stuff"           # ditolak: tidak ada type
git commit -m "Feat: Add form."        # ditolak: type dan deskripsi harus huruf kecil, tanpa titik
git commit -m "feat(ui): add button"   # lolos
```

Jangan melewati hook dengan `--no-verify`. Kalau hook gagal, perbaiki penyebabnya.

Perintah manual:

- `npm run lint` — ESLint seluruh proyek
- `npm run typecheck` — `next typegen && tsc --noEmit`; `next typegen` membuat tipe route dulu supaya route ikut dicek (tidak ada di hook karena lambat; dicek CI)
- `npm run format` / `npm run format:check` — Prettier seluruh proyek. Markdown dan `docs/` sengaja tidak diformat.

## Struktur folder

Kode fitur ada di `features/<nama>/`. Isi standar, aturan impor, dan pola akses data aman ada di [features/README.md](features/README.md).

## CI dan preview

Setiap PR ke `develop` atau `main`, dan setiap push ke kedua branch itu, menjalankan workflow [CI](.github/workflows/ci.yml) di GitHub Actions. Job `ci` menjalankan langkah berikut berurutan, dengan Node versi [.nvmrc](.nvmrc):

1. `npm ci`
2. `npm run lint -- --max-warnings=0`
3. `npm run typecheck`
4. `npm run format:check`
5. `npm run build`

Kalau satu langkah gagal, buka tab **Checks** di PR untuk melihat langkah mana yang gagal beserta log-nya. Untuk menjalankan pengecekan yang sama di lokal sebelum push:

```
npm run lint && npm run typecheck && npm run format:check && npm run build
```

Vercel terhubung lewat integrasi GitHub. Setiap push ke branch selain `main` mendapat preview deploy, dan bot Vercel menulis link preview di PR. `main` adalah production.

PR baru boleh di-merge setelah check `ci` hijau. Saat repo masih private di plan Free, aturan ini belum dipaksa GitHub. Setelah repo public, `ci` dijadikan status check wajib di ruleset `develop` dan `main`.
