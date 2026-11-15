/**
 * @jest-environment node
 */
import { describeEmptyFilter } from "./describe-empty-filter";

describe("describeEmptyFilter", () => {
  it("names the search and the month, as in DESIGN.md", () => {
    expect(
      describeEmptyFilter(
        { q: "kopi", from: "2026-11-01", to: "2026-11-30" },
        undefined,
      ),
    ).toBe("Tidak ada transaksi untuk “kopi” di November 2026.");
  });

  it("names the type, the category and a range", () => {
    expect(
      describeEmptyFilter(
        {
          type: "expense",
          category: "c",
          from: "2026-11-01",
          to: "2026-11-15",
        },
        "Makan",
      ),
    ).toBe("Tidak ada pengeluaran di kategori Makan pada 1–15 Nov 2026.");
  });

  it("falls back to a general sentence", () => {
    expect(describeEmptyFilter({ type: "income" }, undefined)).toBe(
      "Tidak ada pemasukan yang cocok dengan filter ini.",
    );
  });
});
