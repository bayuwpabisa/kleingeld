import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OverlayDemo } from "./overlay-demo";
import { SegmentedDemo } from "./segmented-demo";

// Dev-only showcase of the base components. Delete before the v1 release.
export const metadata: Metadata = {
  title: "Komponen UI · Kleingeld",
  robots: { index: false, follow: false },
};

const rupiah = new Intl.NumberFormat("id-ID");

function Showcase({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

const categories = ["Makanan", "Transport", "Tagihan", "Hiburan"];

export default function UiShowcasePage() {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-12 px-5 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.01em]">
          Komponen UI
        </h1>
        <p className="max-w-prose text-fg-muted">
          Halaman pengembangan untuk mengecek varian, state, fokus, dan dark
          mode. Tidak ikut rilis v1.
        </p>
      </header>

      <Showcase id="button" title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Simpan</Button>
          <Button variant="secondary">Batal</Button>
          <Button variant="quiet">Lihat semua</Button>
          <Button variant="danger">Hapus</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Bayar</Button>
          <Button size="sm" variant="secondary">
            Sebelumnya
          </Button>
          <Button size="sm" variant="quiet">
            Berikutnya
          </Button>
          <Button size="sm" variant="danger">
            Hapus
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Simpan</Button>
          <Button busy>Menyimpan</Button>
          <Button variant="quiet-primary">Daftar</Button>
          <Button variant="quiet-danger">Hapus transaksi</Button>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Link bergaya tombol
          </Link>
        </div>
      </Showcase>

      <Showcase id="input" title="Input">
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Judul" name="title" placeholder="Makan siang" />
          <Input
            label="Catatan"
            name="note"
            hint="Opsional, maksimal 200 karakter."
          />
          <Input
            label="Nominal"
            name="amount"
            inputMode="numeric"
            defaultValue="0"
            error="Nominal harus lebih dari 0."
          />
          <Input
            label="Email akun demo"
            name="email"
            type="email"
            defaultValue="demo@kleingeld.app"
            disabled
          />
        </div>
      </Showcase>

      <Showcase id="select" title="Select">
        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Kategori"
            name="category"
            placeholder="Pilih kategori"
            required
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select
            label="Kategori (opsional)"
            name="filter-category"
            placeholder="Semua kategori"
            hint="Placeholder bisa dipilih lagi untuk mengosongkan."
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select
            label="Jenis tagihan"
            name="bill-type"
            placeholder="Pilih jenis"
            required
            error="Pilih jenis tagihan."
          >
            <option>Rutin</option>
            <option>Cicilan</option>
          </Select>
          <Select label="Mata uang" name="currency" disabled>
            <option>Rupiah (IDR)</option>
          </Select>
        </div>
      </Showcase>

      <Showcase id="segmented" title="Segmented control">
        <SegmentedDemo />
      </Showcase>

      <Showcase id="card" title="Card">
        <ul className="grid gap-6 md:grid-cols-3">
          <Card as="li" className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Pemasukan</span>
            <span className="text-2xl font-semibold tabular-nums">
              <span className="text-[0.6em] font-medium text-fg-muted">
                Rp{" "}
              </span>
              {rupiah.format(8_500_000)}
            </span>
            <span className="text-sm text-fg-muted">+5% dari bulan lalu</span>
          </Card>
          <Card as="li" variant="muted" className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Saldo</span>
            <span className="text-2xl font-semibold tabular-nums">
              <span className="text-[0.6em] font-medium text-fg-muted">
                Rp{" "}
              </span>
              {rupiah.format(3_250_000)}
            </span>
            <span className="text-sm text-fg-muted">Varian muted</span>
          </Card>
          <Card as="li" className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Budget per kategori</h3>
            <p className="text-sm text-fg-muted">
              Atur batas bulanan dan dapat peringatan saat hampir habis.
            </p>
          </Card>
        </ul>
      </Showcase>

      <Showcase id="overlay" title="Dialog dan Toast">
        <OverlayDemo />
      </Showcase>
    </main>
  );
}
