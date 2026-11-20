// How the summary cards fit their amounts (DESIGN.md › Kartu ringkasan
// transaksi). Every tier was measured in the browser, not guessed (docs/plans/
// 2026-11-14-transactions-filters.md › H2): two cards side by side at 360px
// (the narrowest phone with two columns) and three at 1024px (the narrowest
// desktop, with a negative Saldo, the widest text). Class names are written
// out whole so Tailwind finds them.

const TWO_COLUMNS =
  "grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-4";
const ONE_COLUMN = "grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4";

// Phones, 360–1023px. Never smaller than text-base: from 10 digits the
// cards stack, and one card fits text-xl up to 15 digits even at 320px.
// Below 360px the cards always stack, at text-xl.
const PHONE_TIERS = [
  { maxDigits: 7, size: "" },
  { maxDigits: 8, size: "min-[360px]:text-lg" },
  { maxDigits: 9, size: "min-[360px]:text-base" },
] as const;

// Desktop. One tier smaller where the measured room was exactly 2px.
const DESKTOP_TIERS = [
  { maxDigits: 8, size: "lg:text-2xl" },
  { maxDigits: 10, size: "lg:text-xl" },
  { maxDigits: 12, size: "lg:text-lg" },
  { maxDigits: 14, size: "lg:text-base" },
] as const;
const DESKTOP_SMALLEST = "lg:text-sm";

export type SummaryLayout = {
  /** Classes for the cards' grid. */
  grid: string;
  /** Font size classes for every amount. */
  amount: string;
};

/**
 * The grid and the amount size for the summary, from its longest amount:
 * the larger of the income and expense totals. The balance never has more
 * digits than that, so every card can share one size.
 */
export function summaryLayout(largest: number): SummaryLayout {
  const digits = String(Math.trunc(Math.abs(largest))).length;
  const phone = PHONE_TIERS.find((tier) => digits <= tier.maxDigits);
  const desktop =
    DESKTOP_TIERS.find((tier) => digits <= tier.maxDigits)?.size ??
    DESKTOP_SMALLEST;

  return {
    grid: phone ? TWO_COLUMNS : ONE_COLUMN,
    amount: ["text-xl", phone?.size, desktop].filter(Boolean).join(" "),
  };
}
