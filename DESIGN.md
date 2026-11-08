# Kleingeld: Design System v1

Sumber keputusan visual untuk semua halaman. Token di sini sama dengan yang ada di [app/globals.css](app/globals.css). Di kode, selalu pakai nama token (`bg-surface`, `text-fg-muted`), jangan hex mentah.

Wireframe acuan: [docs/wireframe/mvp-v1/](docs/wireframe/mvp-v1/). Cermin token untuk Figma: [docs/design-tokens/](docs/design-tokens/).

## Arah

**Tenang, rapi, dan angka jadi fokus**, dengan akar lokal.

- Referensi rasa: Monarch (banyak ruang, kartu ber-border, ringkasan angka di depan). Kleingeld sengaja berbeda: Monarch hangat dengan aksen oranye, sedangkan Kleingeld sejuk dengan aksen hijau tua dan lebih datar (border, bukan shadow).
- Warna utama **Pinus** diambil dari hijau uang kertas Rp20.000. Kleingeld berarti "uang receh", jadi warnanya sebaiknya terasa seperti uang, bukan biru/ungu SaaS.
- Boldness hanya dipakai di satu tempat: **tampilan angka Rupiah**. Sisanya tenang.

Kontras semua token dan palet grafik sudah dihitung (WCAG dan validator dataviz), bukan dikira-kira.

## Warna

Netral sedikit kehijauan supaya serasi dengan Pinus. Ada satu warna merek (Pinus), dua warna status (kuning dan merah), dan satu warna tambahan khusus grafik (indigo).

| Token (Tailwind) | Light | Dark | Peran |
|---|---|---|---|
| `canvas` | `#F7F8F7` | `#0F1312` | Latar app dan halaman |
| `surface` | `#FFFFFF` | `#171C1B` | Kartu, dialog, sheet, input |
| `surface-muted` | `#EFF1F0` | `#202725` | Area terisi (kartu saldo), skeleton, track meter, hover baris |
| `border` | `#DDE1DF` | `#2C3432` | Pembatas dan tepi kartu (dekoratif) |
| `border-strong` | `#848C89` | `#6B7572` | Tepi input, select, checkbox (wajib ≥3:1) |
| `fg` | `#161A19` | `#E8ECEA` | Teks utama, **nominal pengeluaran** |
| `fg-muted` | `#5B6461` | `#A3ADA9` | Label, meta, placeholder, teks sekunder |
| `primary` | `#0B6E5F` | `#4CC3AE` | Tombol utama, link, nav aktif, fokus |
| `primary-hover` | `#095A4E` | `#6FD3C1` | Hover/pressed tombol utama |
| `primary-soft` | `#E3F1EE` | `#14302B` | Latar nav aktif, chip terpilih, banner info |
| `on-primary` | `#FFFFFF` | `#0F1312` | Teks di atas `primary` |
| `income` | = `primary` | = `primary` | **Nominal pemasukan** di daftar dan tabel (lihat Angka Rupiah) |
| `warning` | `#8A5300` | `#F2B54A` | Teks status "hampir habis" (≥80%) |
| `warning-fill` | `#B87500` | `#F2B54A` | Isi meter budget ≥80% |
| `warning-soft` | `#FBF0DC` | `#33280F` | Latar banner peringatan |
| `danger` | `#C2362F` | `#F0736A` | "Lewat batas" (>100%), error, aksi Hapus |
| `danger-soft` | `#FBE9E7` | `#3A1D1B` | Latar banner error |
| `on-danger` | `#FFFFFF` | `#0F1312` | Teks di atas `danger` |

Aturan:
- **Satu hijau di seluruh UI.** Tombol dan pemasukan memakai `primary` yang sama. Pengecualiannya hanya seri grafik, yang memakai versi Pinus lebih jenuh (lihat Grafik). Pengeluaran tetap `fg` (netral). Merah hanya untuk lewat batas, error, dan hapus, supaya peringatan tetap menonjol.
- Status tidak boleh hanya warna. Setiap status punya **ikon dan label teks** ("85% · hampir habis", "112% · lewat batas").
- Kontras sudah dihitung untuk semua pasangan di atas: teks ≥4.5:1, batas UI dan isi meter ≥3:1, di kedua mode.

### Alternatif yang dipertimbangkan dan ditolak

**Langsung ala Monarch** (latar abu hangat, aksen oranye `#C84A1C`/`#E85D2A`, pemasukan hijau terpisah). Ditolak karena: (1) oranye, kuning, dan merah berdekatan, sehingga peringatan budget (fitur inti) kurang menonjol, (2) oranye terang dengan teks putih tidak lolos 4.5:1, (3) terlalu mirip Monarch.

## Grafik

| Token | Light | Dark | Peran |
|---|---|---|---|
| `chart-income` | `#00806A` | `#2FA08C` | Seri pemasukan |
| `chart-expense` | `#4F6BD8` | `#7C8CEB` | Seri pengeluaran, dan bar per kategori |

- Dicek dengan validator dataviz di kedua mode: lolos lightness band, chroma, CVD (ΔE ≥14), normal vision (ΔE ≥18), dan kontras ≥3:1. Warna seri sengaja lebih jenuh daripada warna UI karena seri grafik butuh chroma ≥0.10. Abu netral untuk pengeluaran gagal (tidak terbedakan oleh pembaca protan).
- **Tren bulanan**: bar berkelompok, pemasukan vs pengeluaran per bulan, 6 bulan. Ada legend (2 seri) dan label nilai hanya di bulan berjalan.
- **Per kategori**: **bar horizontal berperingkat, bukan donut**. Satu warna (`chart-expense`), terbesar di atas, maksimal 5 kategori + "Lainnya". Alasannya, kategori buatan user jumlahnya tidak terbatas dan donut buruk untuk membandingkan nilai yang mirip. Akibatnya, **kategori tidak butuh warna sendiri**, cukup ikon.
- Grid dan sumbu memakai `border` dan `fg-muted`. Teks di grafik memakai token teks, bukan warna seri. Satu sumbu Y saja.
- Setiap grafik punya tooltip saat hover/fokus dan tombol **"Lihat sebagai tabel"**.

## Tipografi

Satu keluarga: **Geist Sans** (variable font, dimuat lewat `next/font`, satu file untuk semua weight). Tanpa monospace.

| Token Tailwind | Ukuran / line height | Dipakai untuk |
|---|---|---|
| `text-xs` | 12 / 16 | Badge, label kecil, tanggal di chip |
| `text-sm` | 14 / 20 | Meta, label input, tabel, teks sekunder |
| `text-base` | 16 / 24 | Body, input, tombol |
| `text-lg` | 18 / 28 | Judul kartu, judul dialog mobile |
| `text-xl` | 20 / 28 | Judul section, judul dialog |
| `text-2xl` | 24 / 32 | Nominal di kartu ringkasan, judul halaman mobile |
| `text-3xl` | 30 / 36 | Judul halaman desktop, nominal saldo mobile |
| `text-4xl` | 36 / 40 | Hero landing (mobile), nominal di form |
| `text-5xl` | 48 / 52 | Hero landing (desktop) |

- Weight: 400 (body), 500 (label, tombol, nav), 600 (judul, nominal). Tidak memakai 700 atau lebih.
- Judul: tracking `-0.01em` untuk ukuran ≥24px. Sentence case, tidak ada ALL CAPS.
- Panjang baris paragraf maksimal ~70 karakter (`max-w-prose`).

### Angka Rupiah (elemen khas)

Semua nominal ditampilkan lewat satu komponen `Money` supaya konsisten:
- `tabular-nums`, weight 600.
- Prefix **"Rp" lebih kecil** (≈0.6em), weight 500, warna `fg-muted`, sejajar baseline angka. Angkanya yang dibaca, mata uangnya tidak berteriak.
- **Tanda dan warna** (satu-satunya tempat aturan ini ditulis). Tanda dan warna selalu berpasangan:

  | Konteks | Pemasukan | Pengeluaran |
  |---|---|---|
  | Daftar dan tabel (pemasukan dan pengeluaran bercampur) | "+", warna `income` | "−", warna `fg` |
  | Kartu ringkasan berlabel (Pemasukan, Pengeluaran, Total budget, dan sejenisnya) | tanpa tanda, `fg` | tanpa tanda, `fg` |
  | Saldo (pemasukan − pengeluaran) | positif: tanpa tanda, `fg` | negatif: "−", tetap `fg` (merah hanya untuk lewat batas dan error) |

  "−" memakai U+2212, bukan hyphen.
- Format: `Intl.NumberFormat("id-ID")`, tanpa desimal. Nilai disimpan sebagai integer.
- Untuk pembaca layar: label lengkap, misalnya "pengeluaran 35.000 rupiah".

## Spacing dan layout

- Skala Tailwind berbasis 4px. Jarak umum: 8 (dalam komponen), 12–16 (antar elemen kartu), 24 (antar kartu/section di app), 64–96 (antar section landing).
- **Mobile (mulai dari 0)**: gutter 20px, header atas 56px, bottom nav 64px + FAB tengah, konten 1 kolom.
- **Desktop (`lg` ≥1024px)**: sidebar 240px tetap, konten dengan padding 32px dan lebar maksimal 1200px, grid 12 kolom untuk dashboard.
- Landing: kontainer 1280px, teks hero rata kiri, gambar di kanan (desktop) atau di bawah CTA (mobile).
- Dialog: lebar 480–560px (desktop). Di mobile, form menjadi halaman penuh dan konfirmasi menjadi bottom sheet.

## Bentuk dan kedalaman

| Elemen | Radius | Tailwind |
|---|---|---|
| Input, select, tombol, item nav | 8px | `rounded-lg` |
| Kartu, banner | 12px | `rounded-xl` |
| Dialog, bottom sheet, gambar hero | 16px | `rounded-2xl` |
| Chip, segmented control, badge, avatar, FAB | penuh | `rounded-full` |

- Kartu **datar**: `bg-surface border border-border`, tanpa shadow.
- Shadow hanya untuk elemen yang melayang: dialog, sheet, popover, toast (`shadow-overlay`). Scrim dialog `rgb(0 0 0 / 0.4)`.
- Tanpa gradient dekoratif dan tanpa glassmorphism.

## Komponen

Semua komponen punya state: default, hover, `focus-visible` (outline 2px `primary`, offset 2px, global di `globals.css`), disabled (opacity 50%, `cursor-not-allowed`), dan busy jika memicu request.

- **Ukuran kontrol**: dua ukuran, supaya kontrol yang sebaris selalu sejajar.

  | Ukuran | Desktop | Mobile | Dipakai untuk |
  |---|---|---|---|
  | `md` | 40px (`h-10`) | 44px (`h-11`) | Tombol, input, select, segmented control, dropdown chip di toolbar (sebaris dengan kolom cari) |
  | `sm` | 32px (`h-8`) | 32px (`h-8`) | Tombol Bayar, pagination, chip filter mobile (di baris sendiri) |

  Baris yang mencampur ukuran memakai `items-center`. Batas minimal di mobile ada di bagian Aksesibilitas (aksi utama 44px).
- **Status terpilih**: setiap status punya pembeda yang kontrasnya ≥3:1 atau pembeda non-warna, bukan hanya latar lembut.
  - Nav (sidebar dan bottom nav): `text-primary`, `font-medium`, stroke ikon 2.25, dan bar 3px `bg-primary` (lihat Navigasi).
  - Chip: `bg-primary-soft border-primary text-primary`. Border primary 6.16:1 terhadap `surface`.
  - Segmented control: pill aktif ber-border `border-strong` dan teks lebih tebal (lihat Segmented control).
- **Button**
  - `primary`: `bg-primary text-on-primary`, hover `bg-primary-hover`. Satu per area.
  - `secondary`: `bg-surface border border-border-strong text-fg`, hover `bg-surface-muted`.
  - `quiet`: teks saja (`text-fg` atau `text-primary`), hover `bg-surface-muted`.
  - `danger`: `bg-danger text-on-danger`, khusus konfirmasi hapus. "Hapus transaksi" di form memakai quiet dengan `text-danger`.
  - Ukuran `md` (lihat Ukuran kontrol). Saat busy: disabled + spinner kecil, label tetap.
- **Input, select, textarea**: `bg-surface border border-border-strong`, input dan select berukuran `md`, textarea minimal 88px, label di atas (`text-sm font-medium`), error di bawah (`text-sm text-danger` + ikon), border jadi `danger`.
- **Input nominal**: `text-4xl` dengan komponen Money, tanpa kotak, hanya border bawah `border-strong`, `inputmode="numeric"`.
- **Segmented control** (Pengeluaran/Pemasukan, Terang/Gelap/Sistem, jenis tagihan): track `surface-muted`, ukuran `md`. Item tidak aktif: teks `fg-muted` weight 400. Item aktif: pill `bg-surface` dengan border `border-strong` (3.45:1 terhadap pill, 3.04:1 terhadap track) dan teks `fg` weight 500, tanpa shadow. Pakai `role="radiogroup"`.
- **Chip/filter**: `rounded-full border border-border`, ukuran sesuai tabel Ukuran kontrol, terpilih `bg-primary-soft border-primary text-primary`. Dropdown chip diberi ikon chevron.
- **Kartu ringkasan**: label `text-sm text-fg-muted`, nominal `text-2xl` Money, keterangan `text-sm text-fg-muted`. Kartu saldo mobile memakai `bg-surface-muted`.
- **Baris transaksi**: ikon kategori dalam lingkaran 40px `bg-surface-muted`, judul `text-base`, kategori `text-sm text-fg-muted`, nominal rata kanan. Seluruh baris bisa diklik/ditekan (membuka form ubah).
- **Baris tagihan**: blok tanggal 48px `bg-surface-muted` (tanggal `text-lg` 600, bulan `text-xs`), nama, keterangan, nominal, tombol **"Bayar"** (`primary`, ukuran `sm` 32px).
- **Meter budget**: track 8px `bg-surface-muted` `rounded-full`.

  | State | Isi | Label | Kartu |
  |---|---|---|---|
  | < 80% | `primary` | "45% terpakai", `fg-muted` | border biasa |
  | ≥ 80% | `warning-fill` | ikon segitiga + "85% · hampir habis", `warning` | border `warning-fill` |
  | > 100% | `danger` (penuh) | ikon lingkaran-seru + "112% · lewat batas", `danger` | border `danger` |

  Elemen: `role="meter"` dengan `aria-valuenow`, `aria-valuemax`, `aria-valuetext`.
- **Navigasi**: item aktif selalu memakai `aria-current="page"`.
  - Sidebar desktop: `bg-surface border-r border-border`. Isinya logo, 5 item, lalu profil + **"Keluar akun"** di bawah. Item tidak aktif `fg-muted` weight 400. Item aktif `bg-primary-soft text-primary font-medium`, stroke ikon 2.25, dan bar 3px `bg-primary` di sisi kiri. Latar `primary-soft` saja tidak cukup (1.09:1 terhadap latar).
  - Header mobile (56px): logo di kiri, ikon Pengaturan berlabel "Pengaturan" di kanan, karena Pengaturan tidak ada di bottom nav.
  - Bottom nav mobile: 4 item + FAB tengah `bg-primary` 56px. Lucide hanya punya ikon garis, jadi item aktif ditandai dengan ikon dan label `text-primary`, stroke ikon 2.25 (normal 1.75), label `font-medium`, dan bar 3px `bg-primary rounded-full` di atas ikon. Penandanya tidak hanya warna.
- **Banner demo**: `bg-primary-soft`, ikon info, teks `text-sm`, aksi "Daftar" (quiet `primary`).
- **Dialog / bottom sheet**: judul `text-xl` 600, tombol tutup berlabel "Tutup", fokus terkunci di dalam, Esc menutup, fokus kembali ke pemicu. Tombol: batal (secondary) di kiri primary (desktop). Di mobile, primary penuh di atas dan batal di bawahnya.
- **Tabel transaksi (desktop)**: header `text-sm text-fg-muted`, kolom sortable memakai `<button>` dengan ikon arah dan `aria-sort`. Baris 56px, nominal rata kanan. Pagination di bawah.
- **Toast**: kiri bawah (desktop) atau atas bottom nav (mobile), `bg-fg text-canvas`, 4 detik, `role="status"`. Untuk hapus disediakan aksi **"Urungkan"** dengan gaya `text-canvas font-medium underline` dan target sentuh minimal 24px. Jangan pakai `text-primary` di toast (hanya 2.85:1 di light, 1.81:1 di dark).

## States

Setiap layar yang memuat data harus punya state ini. Pakai komponen di atas, jangan membuat gaya baru.

| State | Pola | Contoh copy |
|---|---|---|
| Pertama kali (user baru) | Ilustrasi ikon kecil, satu kalimat tujuan, satu tombol primary | "Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi." + **Tambah transaksi** |
| Kosong karena filter/cari | Sebut filternya, tawarkan reset | "Tidak ada transaksi untuk "kopi" di November." + **Hapus filter** |
| Loading | Skeleton berbentuk konten (`bg-surface-muted`, pulse halus, mati jika reduced motion). Layout tidak bergeser. | |
| Error muat | Kotak di area yang gagal saja, bukan seluruh layar | "Transaksi gagal dimuat. Periksa koneksi lalu coba lagi." + **Coba lagi** |
| Validasi | Saat keluar field atau submit, pesan di bawah field | "Nominal harus lebih dari 0." |
| Busy | Tombol disabled + spinner, tidak bisa dikirim dua kali | |
| Sukses | Toast singkat, nama aksi sama dengan tombolnya | "Transaksi disimpan", "Tagihan ditandai dibayar. Transaksi dibuat." |
| Hapus | Dialog konfirmasi + toast dengan Urungkan | "Transaksi dihapus" · **Urungkan** |
| Konten ekstrem | Judul panjang di-truncate (teks lengkap di `title`/detail), nominal miliaran tetap muat (kolom nominal `whitespace-nowrap`) | |

## Aksesibilitas

Target WCAG 2.2 AA.
- Kontras: teks ≥4.5:1, teks besar dan batas komponen ≥3:1. Semua token di atas sudah lolos di kedua mode.
- Target sentuh minimal 24×24px.
- **Aksi utama di mobile** (FAB, item bottom nav, tombol submit form, tombol di dialog/sheet) minimal 44px. Aksi per baris (Bayar, chip, pagination) memakai ukuran `sm` 32px, yang tetap di atas minimum 24px.
- Fokus selalu terlihat (global `:focus-visible`). Urutan tab mengikuti urutan visual.
- `prefers-reduced-motion` mematikan animasi dan transisi (global).
- Status tidak hanya warna (ikon + teks). Grafik punya alternatif tabel.
- Bahasa halaman `lang="id"`.

## Ikon dan gambar

- Satu set ikon: **Lucide** (`lucide-react`, dipasang saat membangun komponen pertama). Stroke 1.75, ukuran 16/20/24. Tidak memakai emoji sebagai ikon.
- Ikon kategori: user memilih dari daftar kurasi ±20 ikon Lucide (makan, transport, tagihan, hiburan, belanja, gaji, dan seterusnya). **Skema `categories` butuh kolom `icon`, tidak butuh kolom warna.**
- Landing dan login memakai **screenshot asli aplikasi** (dashboard dengan data demo) dalam bingkai `rounded-2xl border`, bukan ilustrasi stok.
- Logo: wordmark "Kleingeld" Geist 600 + simbol sederhana (dibuat terpisah).

## Copy

- Menyapa dengan "kamu", sentence case, kata kerja aktif, tanpa basa-basi.
- Satu aksi, satu nama, dari tombol sampai toast ("Tandai dibayar" → "Tagihan ditandai dibayar").
- Error menjelaskan apa yang terjadi dan apa yang bisa dilakukan, tanpa minta maaf dan tanpa kode error.
- Istilah tetap: **Dashboard** (bukan Beranda), **Pemasukan / Pengeluaran** (bukan Masuk/Keluar), **Keluar akun** untuk logout, **Saldo** untuk pemasukan − pengeluaran.

## Dark mode

- Pilihan user: Terang, Gelap, Sistem (di Pengaturan). Atribut `data-theme="light|dark"` di `<html>`. Tanpa atribut, mode mengikuti OS.
- Token dark didefinisikan ulang dengan nilai yang dipilih sendiri, bukan inversi otomatis. Varian Tailwind `dark:` sudah mengikuti kedua cara (atribut dan OS), tapi **utamakan token**, karena token sudah otomatis berganti.
- Pilihan disimpan di `localStorage` (kunci `theme`, nilai `light`/`dark`; Sistem = tanpa nilai), bukan cookie, supaya halaman tetap bisa di-prerender statis. Script kecil di `<head>` ([lib/theme.ts](lib/theme.ts)) memasang `data-theme` sebelum halaman digambar, jadi tidak ada kedipan. Di React, `ThemeProvider` + `useTheme()` ([components/theme/](components/theme/)) membaca nilai yang sama dan ikut berubah saat tab lain mengganti tema.

## Keputusan terbuka

- Simbol logo.
- Daftar final ikon kategori bawaan.
