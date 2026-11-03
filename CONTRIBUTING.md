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

## Menyusul

- 3 Nov: Husky, lint-staged, dan commitlint mengecek format commit secara otomatis.
- 4 Nov: CI di GitHub Actions menjadi status check wajib sebelum merge.
