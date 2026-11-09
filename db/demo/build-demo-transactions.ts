import type { TransactionType } from "../schema";

export type DemoCategory = {
  id: string;
  name: string;
  type: TransactionType;
};

export type DemoTransaction = {
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
};

type Rng = () => number;

const DAY_MS = 24 * 60 * 60 * 1000;

// mulberry32: a tiny seeded PRNG, so the demo data is the same on every seed.
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Prices in the demo look like real ones: whole multiples of Rp500.
function rupiah(rng: Rng, min: number, max: number) {
  return Math.round(between(rng, min, max) / 500) * 500;
}

function pick<T>(rng: Rng, items: readonly [T, ...T[]]): T {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function parseDay(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date: ${isoDate}`);
  return Date.UTC(y, m - 1, d);
}

function toIsoDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Builds about three months of believable transactions for the demo account:
 * from the first day of two months ago up to `today` ("YYYY-MM-DD").
 *
 * Each day uses its own seed, so a day's transactions stay the same when the
 * demo is re-seeded on a later day. Pure: no database access.
 */
export function buildDemoTransactions({
  today,
  categories,
}: {
  today: string;
  categories: readonly DemoCategory[];
}): DemoTransaction[] {
  const byName = new Map(categories.map((c) => [c.name, c]));
  const category = (name: string) => {
    const found = byName.get(name);
    if (!found) throw new Error(`Demo category "${name}" is missing`);
    return found;
  };

  const food = category("Makan");
  const transport = category("Transport");
  const bills = category("Tagihan");
  const fun = category("Hiburan");
  const shopping = category("Belanja");
  const health = category("Kesehatan");
  const salary = category("Gaji");
  const freelance = category("Freelance");
  const coffee = category("Kopi & jajan");

  const end = parseDay(today);
  const endDate = new Date(end);
  const start = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() - 2,
    1,
  );

  const rows: DemoTransaction[] = [];

  for (let day = start; day <= end; day += DAY_MS) {
    const rng = mulberry32(day / DAY_MS);
    const date = new Date(day);
    const dayOfMonth = date.getUTCDate();
    const weekday = date.getUTCDay();
    const isWorkday = weekday >= 1 && weekday <= 5;
    const iso = toIsoDate(day);

    const add = (c: DemoCategory, amount: number, note: string) => {
      rows.push({ categoryId: c.id, type: c.type, amount, date: iso, note });
    };

    // Fixed monthly items.
    if (dayOfMonth === 1) add(bills, 2_500_000, "Sewa kos");
    if (dayOfMonth === 5) add(bills, 330_000, "Internet rumah");
    if (dayOfMonth === 8)
      add(bills, rupiah(rng, 280_000, 420_000), "Token listrik");
    if (dayOfMonth === 10) add(bills, 100_000, "Paket data");
    if (dayOfMonth === 25) add(salary, 8_500_000, "Gaji bulanan");

    // A freelance job in about two of every three months.
    if (dayOfMonth === 15 && rng() < 0.7) {
      add(
        freelance,
        rupiah(rng, 1_500_000, 3_500_000),
        pick(rng, [
          "Proyek landing page",
          "Revisi desain web",
          "Bug fix klien",
        ]),
      );
    }

    // Daily spending.
    if (rng() < 0.8) {
      add(
        food,
        rupiah(rng, 20_000, 55_000),
        pick(rng, [
          "Makan siang",
          "Nasi padang",
          "Warteg",
          "Bakso",
          "Gado-gado",
        ]),
      );
    }
    if (rng() < 0.35) {
      add(
        food,
        rupiah(rng, 25_000, 80_000),
        pick(rng, ["Makan malam", "Sate ayam", "Pecel lele", "GoFood"]),
      );
    }
    if (isWorkday && rng() < 0.7) {
      add(
        transport,
        rupiah(rng, 12_000, 45_000),
        pick(rng, ["KRL + ojek", "Ojek online", "TransJakarta", "Bensin"]),
      );
    }
    if (rng() < 0.3) {
      add(
        coffee,
        rupiah(rng, 18_000, 45_000),
        pick(rng, ["Kopi susu", "Es teh + gorengan", "Martabak", "Boba"]),
      );
    }

    // Occasional spending.
    if (rng() < 0.07) {
      add(
        fun,
        rupiah(rng, 50_000, 180_000),
        pick(rng, ["Nonton bioskop", "Langganan streaming", "Karaoke"]),
      );
    }
    if (rng() < 0.1) {
      add(
        shopping,
        rupiah(rng, 80_000, 400_000),
        pick(rng, [
          "Belanja bulanan",
          "Sabun dan sampo",
          "Kaos",
          "Peralatan dapur",
        ]),
      );
    }
    if (rng() < 0.04) {
      add(
        health,
        rupiah(rng, 60_000, 250_000),
        pick(rng, ["Obat flu", "Vitamin", "Periksa ke klinik"]),
      );
    }
  }

  return rows;
}
