# Token Figma

Cermin token dari [DESIGN.md](../../DESIGN.md) untuk dipakai saat menggambar di Figma. Formatnya W3C Design Tokens (DTCG): setiap token punya `$type` dan `$value`.

**File ini bukan sumber.** Kalau ada nilai yang berubah, ubah dulu DESIGN.md dan [app/globals.css](../../app/globals.css), baru file di sini.

| File | Isi | Koleksi Figma |
|---|---|---|
| `kleingeld.base.tokens.json` | Spacing, radius, ukuran kontrol, font, ukuran teks, line height | `Kleingeld / Base` |
| `kleingeld.color-light.tokens.json` | 20 warna mode terang | `Kleingeld / Color`, mode Light |
| `kleingeld.color-dark.tokens.json` | 20 warna mode gelap | `Kleingeld / Color`, mode Dark |

## Cara impor

1. Di Figma, buka **Plugins → Find more plugins**. Cari plugin impor variables yang mendukung JSON **W3C/DTCG**. Cek deskripsi plugin, karena tidak semuanya mendukung format ini.
2. Impor `kleingeld.base.tokens.json` ke koleksi baru.
3. Impor `kleingeld.color-light.tokens.json`, lalu `kleingeld.color-dark.tokens.json`:
   - Kalau paketmu bisa membuat **2 mode** dalam satu koleksi: jadikan Light dan Dark sebagai dua mode di koleksi `Kleingeld / Color`.
   - Kalau hanya **1 mode** (paket Starter): buat dua koleksi, `Kleingeld / Color Light` dan `Kleingeld / Color Dark`.
4. Cek bahwa `income` menjadi alias ke `primary`. Kalau plugin tidak mendukung alias, isi manual dengan nilai `primary`.
5. Kalau plugin menolak `fontFamily`, lewati token itu. Font dipilih langsung di text style (lihat di bawah).

## Text styles (dibuat manual)

Variables tidak bisa menyimpan gaya teks utuh, jadi buat text styles ini dengan font **Geist** (tersedia di Google Fonts):

| Style | Ukuran / line height | Weight | Dipakai untuk |
|---|---|---|---|
| `text-xs` | 12 / 16 | Regular, Medium | Badge, label kecil |
| `text-sm` | 14 / 20 | Regular, Medium | Meta, label input, tabel |
| `text-base` | 16 / 24 | Regular, Medium | Body, input, tombol |
| `text-lg` | 18 / 28 | Semibold | Judul kartu |
| `text-xl` | 20 / 28 | Semibold | Judul section, judul dialog |
| `text-2xl` | 24 / 32 | Semibold | Nominal kartu ringkasan, judul halaman mobile |
| `text-3xl` | 30 / 36 | Semibold | Judul halaman desktop, saldo mobile |
| `text-4xl` | 36 / 40 | Semibold | Hero landing mobile, nominal di form |
| `text-5xl` | 48 / 52 | Semibold | Hero landing desktop |

Untuk nominal Rupiah, aktifkan **Tabular figures** (panel Type → Details → Numbers) dan buat prefix "Rp" sekitar 0.6× ukuran angka dengan warna `fg-muted`. Detailnya ada di DESIGN.md › Angka Rupiah.
