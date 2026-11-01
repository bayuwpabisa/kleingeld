import Link from "next/link";

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Playground latihan React</h1>
      <p className="mt-2 text-zinc-600">
        Soal ada di <code>docs/learning/latihan-react.md</code>.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-6">
        <li>
          <Link className="underline" href="/playground/latihan-1">
            Latihan 1: Pencatat transaksi
          </Link>
        </li>
        <li>
          <Link className="underline" href="/playground/latihan-2">
            Latihan 2: Budget per kategori
          </Link>
        </li>
      </ul>
    </main>
  );
}
