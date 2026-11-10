import Link from "next/link";
import { ArrowLeftRight, CalendarClock, PiggyBank } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoSignInButton } from "@/features/auth/components/demo-sign-in-button";
import { SkipLink } from "@/components/ui/skip-link";

// No request data here, so the page is prerendered at build time (SSG).

// "Mulai gratis" and "Masuk" open the login page. The demo button signs in
// straight away, so a recruiter is one click from the dashboard.
const START_HREF = "/login";

const container = "mx-auto w-full max-w-320 px-5 lg:px-8";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Pencatatan transaksi",
    body: "Catat pemasukan dan pengeluaran dalam hitungan detik, lengkap dengan kategori, tanggal, dan catatan.",
  },
  {
    icon: PiggyBank,
    title: "Budget per kategori",
    body: "Tetapkan batas tiap kategori dan lihat sisanya kapan saja, dengan peringatan saat hampir habis.",
  },
  {
    icon: CalendarClock,
    title: "Tagihan & cicilan",
    body: "Lihat jatuh tempo tagihan rutin dan progres cicilan di satu tempat.",
  },
];

const steps = [
  {
    title: "Masuk dengan Google atau GitHub",
    body: "Tidak perlu membuat password baru.",
  },
  {
    title: "Catat transaksi dan buat budget",
    body: "Tambahkan pengeluaran pertama dan tentukan batas tiap kategori.",
  },
  {
    title: "Pantau di dashboard",
    body: "Lihat sisa uang, budget yang hampir habis, dan tagihan terdekat.",
  },
];

function CallsToAction() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href={START_HREF} className={buttonClasses()}>
        Mulai gratis
      </Link>
      <DemoSignInButton variant="secondary">Coba akun demo</DemoSignInButton>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <SkipLink />
      <header className="border-b border-border bg-surface">
        <div className={`${container} flex h-16 items-center justify-between`}>
          <Link href="/" className="rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Bagian halaman" className="hidden md:block">
            <ul className="flex gap-8 text-sm text-fg-muted">
              <li>
                <a href="#fitur" className="rounded hover:text-fg">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="rounded hover:text-fg">
                  Cara kerja
                </a>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={START_HREF}
              className={buttonClasses({ variant: "quiet" })}
            >
              Masuk
            </Link>
            {/* Phones get the same button right below, in the hero. */}
            <div className="hidden md:flex">
              <Link href={START_HREF} className={buttonClasses()}>
                Mulai gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="konten" tabIndex={-1} className="flex-1 outline-none">
        <section
          className={`${container} grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-24`}
        >
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-[-0.01em] lg:text-5xl">
              Atur uang bulanan tanpa ribet
            </h1>
            <p className="max-w-prose text-lg text-fg-muted">
              Catat transaksi, pantau budget per kategori, dan jangan telat
              bayar tagihan lagi. Semua dalam satu dashboard.
            </p>
            <CallsToAction />
            <p className="text-sm text-fg-muted">
              Masuk dengan Google atau GitHub · Gratis
            </p>
          </div>
          <DashboardPreview />
        </section>

        <section
          id="fitur"
          aria-labelledby="fitur-judul"
          className="border-y border-border bg-surface-muted py-16 lg:py-24"
        >
          <div className={`${container} flex flex-col gap-10`}>
            <div className="flex flex-col gap-3 lg:items-center lg:text-center">
              <h2
                id="fitur-judul"
                className="text-2xl font-semibold tracking-[-0.01em] lg:text-3xl"
              >
                Semua yang kamu butuhkan untuk mengatur uang bulanan
              </h2>
              <p className="max-w-prose text-fg-muted">
                Fokus ke tiga hal yang paling sering bikin bocor: pengeluaran
                harian, budget, dan tagihan.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
              {features.map(({ icon: Icon, title, body }) => (
                <Card as="li" key={title} className="flex flex-col gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-fg-muted">{body}</p>
                </Card>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="cara-kerja"
          aria-labelledby="cara-kerja-judul"
          className={`${container} flex flex-col gap-10 py-16 lg:py-24`}
        >
          <h2
            id="cara-kerja-judul"
            className="text-2xl font-semibold tracking-[-0.01em] lg:text-3xl"
          >
            Cara kerja
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map(({ title, body }, index) => (
              <li key={title} className="flex flex-col gap-3">
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-on-primary"
                >
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-fg-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="mulai-judul"
          className={`${container} pb-16 lg:pb-24`}
        >
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="flex flex-col gap-2">
              <h2
                id="mulai-judul"
                className="text-2xl font-semibold tracking-[-0.01em]"
              >
                Siap mulai mengatur keuangan?
              </h2>
              <p className="text-fg-muted">
                Gratis. Coba dulu pakai akun demo kalau belum yakin.
              </p>
            </div>
            <CallsToAction />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div
          className={`${container} flex flex-col gap-2 py-6 text-sm text-fg-muted sm:flex-row sm:justify-between`}
        >
          <p>© 2026 Kleingeld · Proyek portofolio</p>
          <a
            href="https://github.com/bayuwpabisa/kleingeld"
            className="rounded underline-offset-2 hover:text-fg hover:underline"
          >
            Kode di GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
