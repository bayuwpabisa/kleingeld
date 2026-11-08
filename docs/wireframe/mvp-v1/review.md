# Review wireframe MVP v1

Perbandingan wireframe dengan [mvp-scope.md](../../mvp-scope.md) dan [DESIGN.md](../../../DESIGN.md).

- Putaran 1 (2026-11-02): 6 layar per ukuran. Versinya ada di riwayat git (commit `76bfd4f`).
- Putaran 2 (2026-11-02): versi sekarang di folder ini (`Desktop/`, `Mobile/`, `Komponen.png`), 12 layar per ukuran (dengan form, dialog konfirmasi, dan Pengaturan).

Centang item setelah direvisi di Figma, lalu export ulang PNG ke folder ini.

## Cakupan scope v1 (status putaran 2)

| Scope | Desktop | Mobile |
|---|---|---|
| Login Google/GitHub + demo | ✅ | ✅ |
| Logout | ✅ sidebar + Pengaturan | ✅ Pengaturan |
| Kelola kategori | ✅ Pengaturan | ✅ |
| Tambah/ubah/hapus transaksi (form) | ✅ dialog + konfirmasi hapus | ✅ layar penuh + sheet |
| Pencarian, filter kategori dan tipe | ✅ | ✅ |
| Filter tanggal | ✅ | ✅ |
| Sort | ✅ header kolom + dropdown | ✅ chip "Terbaru" |
| Pagination | ✅ | ✅ "Muat lebih banyak" |
| Peringatan budget ≥80% dan >100% | ✅ | ✅ |
| Form atur budget, form tagihan/cicilan | ✅ | ✅ |
| Tandai dibayar | ✅ tombol Bayar + konfirmasi | ✅ |
| Grafik per kategori | ⚠️ donut, ganti ke bar berperingkat | ⚠️ sama |
| Grafik tren bulanan | ✅ | ✅ |
| Alternatif aksesibel grafik | ✅ "Lihat sebagai tabel" | ✅ |
| Sidebar desktop / bottom nav mobile | ✅ | ✅ |
| Dark mode | ✅ Pengaturan: Terang/Gelap/Sistem | ✅ |

## Sudah beres dari putaran 1

- [x] Akun/dompet dihapus dari Transaksi, baris transaksi, dan copy landing
- [x] Tombol "Ekspor CSV" dihapus
- [x] Status "Otomatis" dihapus
- [x] Grafik "Pengeluaran harian" diganti tren bulanan
- [x] Dashboard mobile: grafik per kategori dan tren
- [x] Tagihan: tombol Bayar + dialog "Tandai sudah dibayar?" berisi pratinjau transaksi
- [x] Transaksi mobile: filter bulan, sort, "Muat lebih banyak", form ubah dengan Hapus, sheet konfirmasi hapus
- [x] Semua form (transaksi, budget, tagihan/cicilan), Pengaturan, logout, dark mode
- [x] Angka budget dan total tagihan konsisten antar layar

## Masih terbuka

**Hapus (di luar scope)**
- [ ] Kartu "Kalender November" di Tagihan desktop
- [ ] Grafik "Budget vs realisasi" di Budget desktop
- [ ] `Komponen.png`: komponen baris transaksi masih "Makanan · GoPay"

**Ubah**
- [ ] Donut "Per kategori" (dashboard desktop dan mobile) menjadi bar horizontal berperingkat, maksimal 5 + "Lainnya". Lihat DESIGN.md › Grafik.
- [ ] Pill "Bayar" sekitar 20px tingginya, perlu minimal 24px (WCAG 2.5.8). DESIGN.md memakai 32px.
- [ ] **Cicilan tidak konsisten.** Form: sudah dibayar 3 dari 12. Daftar: "33% lunas · sisa Rp 10.000.000", yang dihitung dari 4. Usulan definisi untuk model data:
  - progres = angsuran dibayar / total = 3/12 = **25%**
  - sisa = (12 − 3) × Rp 1.250.000 = **Rp 11.250.000**
  - "Cicilan 4 dari 12" = angsuran berikutnya yang belum dibayar
- [ ] **"Keluar" punya dua arti:** chip filter pengeluaran dan tombol logout. Usulan: chip "Pemasukan / Pengeluaran", logout "Keluar akun".

**Tambah**
- [ ] Toast setelah aksi, minimal "Tagihan ditandai dibayar. Transaksi dibuat." dan "Transaksi dihapus" + Urungkan
- [ ] Anotasi state minimal untuk dashboard dan transaksi: user baru (kosong), loading (skeleton), error (+ "Coba lagi"), filter tanpa hasil. Polanya ada di DESIGN.md › States.

## Konsistensi (masih terbuka)

- [ ] "Beranda" (bottom nav) vs "Dashboard" (sidebar). DESIGN.md memilih **Dashboard**.
- [ ] CTA landing masih tiga versi: "Mulai gratis", "Daftar gratis" (CTA bawah desktop), "Daftar dengan Google" (CTA bawah mobile, tanpa GitHub dan demo). Pilih satu, misalnya "Mulai gratis" + "Coba akun demo" di semua tempat.
- [ ] Link "FAQ" di nav landing tidak punya section
- [ ] Filter "1–30 Nov 2026" / "Nov 2026", tapi daftar berisi transaksi 30–31 Okt
- [ ] Budget: "+ Buat budget" dan "+ Tambah kategori budget" (desktop), "+ Tambah" dan "+ Buat budget baru" (mobile). Masing-masing pilih satu aksi.
- [ ] Lingkaran di header mobile belum berlabel (avatar menuju Pengaturan?)
- [ ] "Saldo" (dashboard) vs "Selisih" (transaksi) untuk angka yang sama. DESIGN.md memilih **Saldo**.
- [x] File `Landing · Login · ... tanpa warna brand..png` sepertinya export caption yang tidak sengaja, bisa dihapus
