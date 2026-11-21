import { MINUS, formatRupiah, moneyLabel } from "./money";

describe("formatRupiah", () => {
  it.each([
    [0, "0"],
    [35_000, "35.000"],
    [8_500_000, "8.500.000"],
    [1_000_000_000_000, "1.000.000.000.000"],
  ])("formats %p as %p", (amount, text) => {
    expect(formatRupiah(amount)).toBe(text);
  });

  it("formats the size only, without a sign", () => {
    expect(formatRupiah(-35_000)).toBe("35.000");
  });
});

describe("moneyLabel", () => {
  it("names the direction for transactions", () => {
    expect(moneyLabel(35_000, "expense")).toBe("pengeluaran 35.000 rupiah");
    expect(moneyLabel(8_500_000, "income")).toBe("pemasukan 8.500.000 rupiah");
  });

  it("reads plain and negative amounts", () => {
    expect(moneyLabel(35_000)).toBe("35.000 rupiah");
    expect(moneyLabel(-35_000)).toBe("minus 35.000 rupiah");
  });
});

it("uses the real minus sign, not a hyphen", () => {
  expect(MINUS).toBe("−");
});
