# Kleingeld (Kantong) — Scope MVP v1

Aplikasi pencatat keuangan pribadi: transaksi, budget per kategori, serta tagihan dan cicilan. Jadwal lengkap: Notion "Kantong - Jadwal Portofolio" (28 Okt–29 Nov 2026).

## Keputusan

| Topik | Keputusan | Alasan |
|---|---|---|
| Mata uang | Rupiah saja | Lebih sederhana. Nominal disimpan sebagai integer tanpa desimal. |
| Tagihan berulang | Transaksi dibuat saat tagihan ditandai dibayar | Tidak perlu cron job, dan user tetap memegang kendali. |
| Akun demo | Bisa diedit, data di-reset berkala | Recruiter bisa mencoba semua fitur. Data di-seed ulang setiap login demo dan setiap hari. |
| Fitur di jadwal Notion | Pencarian, dark mode, dan grafik tren bulanan masuk v1 | Sudah terhitung di estimasi jam harian pada jadwal. |
| Stack | Next.js 16, TypeScript strict, Tailwind v4, Neon Postgres, Drizzle ORM, Better Auth, Zod, TanStack Query, Redux Toolkit, React Hook Form, Recharts, Jest + RTL, Cypress, Docker, Vercel | Mengikuti jadwal Notion. |
| API | Route Handlers REST dengan skema Zod bersama server dan client | Kontrak type-safe, validasi dan otorisasi per user. |

## Must-have (v1)

**Auth**
- Login dengan Google atau GitHub, dan logout
- Tombol Coba Demo untuk recruiter, berisi data contoh

**Kategori**
- Kategori bawaan (Makan, Transport, Tagihan, dll.), plus tambah/ubah/hapus kategori sendiri

**Transaksi**
- Tambah, ubah, dan hapus pemasukan/pengeluaran (nominal, kategori, tanggal, catatan)
- Daftar transaksi dengan pencarian (debounce), filter tanggal/kategori/tipe, sort, dan pagination server-side; filter tersimpan di URL

**Budget**
- Atur batas budget per kategori per bulan
- Lihat terpakai vs batas, dengan peringatan saat mendekati (≥80%) atau melewati batas

**Tagihan dan cicilan**
- Buat tagihan bulanan dan cicilan (dengan jumlah total angsuran)
- Tandai sudah dibayar, yang otomatis membuat transaksi
- Daftar tagihan yang akan jatuh tempo dan sisa cicilan

**Dashboard**
- Ringkasan bulan ini: pemasukan, pengeluaran, saldo
- Grafik pengeluaran per kategori dan grafik tren bulanan (dengan alternatif aksesibel)
- Status budget dan tagihan terdekat

**Tampilan**
- Layout responsif mobile-first (sidebar desktop, bottom nav mobile)
- Dark mode

**Non-fungsional**
- Aksesibel (WCAG AA), unit dan e2e test, CI, Lighthouse mobile ≥ 90, security headers, Docker, dan sudah ter-deploy

## Stretch (kalau waktu tersisa)
- Export CSV
- Banyak dompet/rekening
- Aplikasi mobile React Native (Expo)
- Endpoint GraphQL untuk laporan bulanan
- Ringkasan pengeluaran bulanan dengan AI
- Dukungan dua bahasa (Indonesia dan Inggris)
- Backend NestJS menggantikan Route Handlers

## Di luar v1
- Patungan

## User stories
1. As a user, I want to sign in with Google or GitHub so that I don't need another password.
2. As a recruiter, I want to try a demo account so that I can explore the app without signing up.
3. As a user, I want to record income and expenses with a category, date, and note so that I know where my money goes.
4. As a user, I want to search and filter transactions by date, category, and type so that I can review specific spending.
5. As a user, I want to manage my own categories so that they match my habits.
6. As a user, I want to set a monthly budget per category so that I can control my spending.
7. As a user, I want a warning when I'm close to or over a budget so that I can adjust in time.
8. As a user, I want to add recurring bills and installments so that I don't forget to pay them.
9. As a user, I want to mark a bill as paid and have it recorded as a transaction so that I don't enter it twice.
10. As a user, I want a dashboard of this month's income, expenses, budgets, and upcoming bills so that I see my finances at a glance.
11. As a user, I want to see my spending trend over several months so that I can notice changes in my habits.
12. As a user, I want a dark mode so that the app is comfortable to use at night.
