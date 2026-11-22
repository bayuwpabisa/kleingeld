import { desktopAmountSize } from "@/features/transactions/summary-layout";

// The dashboard's balance on phones is the big number of a full-width card
// (DESIGN.md: text-3xl), so it has its own sizes. Measured in the browser
// with a negative balance (docs/plans/2026-11-16-dashboard.md › D2): at
// 320px text-3xl fits 9 digits, text-2xl 12, text-xl 15; at 360px text-3xl
// fits 12 with 2px to spare (one tier smaller, as on the transactions page)
// and text-2xl 15. Class names are written out whole so Tailwind finds them.
const PHONE_TIERS = [
  { maxDigits: 9, size: "text-3xl" },
  { maxDigits: 11, size: "text-2xl min-[360px]:text-3xl" },
  { maxDigits: 12, size: "text-2xl" },
  { maxDigits: 15, size: "text-xl min-[360px]:text-2xl" },
] as const;
const PHONE_SMALLEST = "text-xl";

/**
 * Font size classes for the balance, from the larger of the income and
 * expense totals (the balance is never longer). From lg it matches the
 * other cards (desktopAmountSize).
 */
export function balanceSize(largest: number): string {
  const digits = String(Math.trunc(Math.abs(largest))).length;
  const phone =
    PHONE_TIERS.find((tier) => digits <= tier.maxDigits)?.size ??
    PHONE_SMALLEST;
  return `${phone} ${desktopAmountSize(largest)}`;
}
