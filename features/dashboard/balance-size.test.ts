import { balanceSize } from "./balance-size";

// Measured in the browser with a negative balance, the widest text (docs/
// plans/2026-11-16-dashboard.md › D2): the balance's column is 246px at
// 320px and 286px at 360px. From lg the balance follows the other cards.
describe("balanceSize", () => {
  it.each([
    [0, "text-3xl lg:text-2xl"],
    [999_999_999, "text-3xl lg:text-xl"],
    [1_000_000_000, "text-2xl min-[360px]:text-3xl lg:text-xl"],
    [99_999_999_999, "text-2xl min-[360px]:text-3xl lg:text-lg"],
    [100_000_000_000, "text-2xl lg:text-lg"],
    [999_999_999_999, "text-2xl lg:text-lg"],
    [1_000_000_000_000, "text-xl min-[360px]:text-2xl lg:text-base"],
    [999_999_999_999_999, "text-xl min-[360px]:text-2xl lg:text-sm"],
    [1_000_000_000_000_000, "text-xl lg:text-sm"],
  ])("sizes the balance for a largest total of %d", (largest, size) => {
    expect(balanceSize(largest)).toBe(size);
  });

  it("counts the digits of a negative amount without its sign", () => {
    expect(balanceSize(-1_000_000_000)).toBe(balanceSize(1_000_000_000));
  });
});
