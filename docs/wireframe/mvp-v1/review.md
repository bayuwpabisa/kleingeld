# Review wireframe MVP v1

Perbandingan wireframe di folder ini (`Desktop/`, `Mobile/`, `Komponen.png`) dengan [mvp-scope.md](../../mvp-scope.md). Centang item setelah direvisi di Figma, lalu export ulang PNG ke folder ini.

## Cakupan scope v1

| Scope | Desktop | Mobile |
|---|---|---|
| Login Google/GitHub + demo | ✅ | ✅ |
| Logout | ❌ | ❌ |
| Kelola kategori | ⚠️ menu Pengaturan ada, layarnya belum | ⚠️ |
| Tambah/ubah/hapus transaksi (form) | ❌ hanya tombol dan menu "…" | ❌ |
| Pencarian, filter kategori dan tipe | ✅ | ✅ |
| Filter tanggal | ✅ | ❌ |
| Sort | ❌ | ❌ |
| Pagination | ✅ | ❌ |
| Peringatan budget ≥80% dan >100% | ✅ | ✅ |
| Form atur budget, form tagihan/cicilan | ❌ | ❌ |
| Tandai dibayar | ❌ hanya badge status | ❌ |
| Grafik per kategori | ✅ | ❌ |
| Grafik tren bulanan | ❌ yang ada grafik harian | ❌ |
| Alternatif aksesibel grafik | ❌ | ❌ |
| Sidebar desktop / bottom nav mobile | ✅ | ✅ |
| Toggle dark mode | ❌ | ❌ |

## Hapus atau sesuaikan (melebihi scope)

- [ ] Akun/dompet (BCA, GoPay, OVO, Tunai): kolom Akun dan filter "Semua akun" di Transaksi desktop, subtitle baris transaksi (desktop dan mobile, termasuk dashboard), copy landing "lengkap dengan kategori dan akun". Ini Stretch.
- [ ] Tombol "Ekspor CSV" di Transaksi desktop. Ini Stretch.
- [ ] Status "Otomatis" (Langganan musik). Bertentangan dengan keputusan "transaksi dibuat saat tagihan ditandai dibayar".
- [ ] Kartu "Kalender November" di Tagihan desktop. Tidak ada di scope.
- [ ] Grafik "Budget vs realisasi 6 bulan" di Budget desktop. Tidak ada di scope.
- [ ] Grafik "Pengeluaran harian" di dashboard (desktop dan mobile). Ganti dengan grafik tren bulanan.

## Tambahkan (kurang dari scope)

- [ ] Dashboard: grafik tren bulanan (beberapa bulan) di desktop dan mobile
- [ ] Dashboard mobile: grafik per kategori (desktop sudah ada). Usul: tab "Kategori | Tren".
- [ ] Alternatif aksesibel untuk grafik ("Lihat sebagai tabel")
- [ ] Tagihan: tombol "Tandai dibayar" yang jelas, bukan hanya badge "Belum bayar", plus konfirmasi dan toast "Transaksi dibuat"
- [ ] Transaksi mobile: filter tanggal/bulan (desktop sudah ada)
- [ ] Transaksi: sort (indikator di header kolom desktop, opsi di mobile)
- [ ] Transaksi mobile: pagination ("Muat lagi" atau nomor halaman)
- [ ] Transaksi: cara ubah/hapus di mobile (tap baris membuka detail) dan dialog konfirmasi hapus
- [ ] Toggle dark mode (sidebar desktop; di mobile lewat ikon header atau Pengaturan)
- [ ] Logout (menu dari avatar)
- [ ] Form: tambah/ubah transaksi (sheet di mobile, dialog di desktop), atur budget, tambah tagihan/cicilan
- [ ] Pengaturan: kelola kategori (tambah/ubah/hapus). Cukup 1 frame atau anotasi.
- [ ] Anotasi state: empty (user baru), loading (skeleton), error (+ "Coba lagi"), minimal untuk dashboard dan transaksi

## Konsistensi

- [ ] Penamaan "Beranda" (bottom nav) vs "Dashboard" (sidebar): pilih satu
- [ ] CTA "Mulai gratis", "Daftar gratis", dan "Daftar dengan Google" (CTA landing mobile, tanpa GitHub dan demo) disatukan, misalnya "Masuk" + "Coba akun demo"
- [ ] Link "FAQ" di nav landing tidak punya section
- [ ] Data transaksi: filter "1–30 Nov 2026" dan kartu "November 2026", tapi daftar berisi transaksi 30–31 Okt
- [ ] Cicilan: "Cicilan 4 dari 12" belum dibayar, tapi tertulis "33% lunas · sisa Rp 10.000.000". Tetapkan definisinya karena dibutuhkan untuk model data.
- [ ] Budget: "+ Buat budget" dan "+ Tambah kategori budget" (desktop), "+ Tambah" dan "+ Buat budget baru" (mobile). Masing-masing pilih satu aksi.
- [ ] Ikon lingkaran di header mobile: beri label (misalnya dark mode dan avatar/menu)
