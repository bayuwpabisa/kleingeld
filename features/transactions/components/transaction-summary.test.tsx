import { screen } from "@testing-library/react";

import { apiFetch } from "@/lib/api/client";
import type { TransactionSummary as Summary } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { TransactionSummary } from "./transaction-summary";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

function setup(summary: Summary) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path.startsWith("/api/transactions/summary")) return summary;
    throw new Error(`Unexpected request ${path}`);
  });
  return renderWithProviders(<TransactionSummary filters={{}} />);
}

/** The Money element whose screen reader label is `label`. */
async function amount(label: string) {
  const words = await screen.findByText(label);
  return words.parentElement;
}

afterEach(() => {
  fetchApi.mockReset();
});

// Layout itself cannot be measured in jsdom; these tests only check which
// total picks the size (DESIGN.md › Kartu ringkasan transaksi). The sizes
// are proven in the browser.
describe("TransactionSummary", () => {
  it("sizes every card from the larger total", async () => {
    setup({
      income: { total: 8_500_000, count: 1 },
      expense: { total: 1_250_000_000, count: 41 },
      balance: -1_241_500_000,
    });

    for (const label of [
      "8.500.000 rupiah",
      "1.250.000.000 rupiah",
      "minus 1.241.500.000 rupiah",
    ]) {
      const money = await amount(label);
      // The 10-digit tier, also for the 7-digit income.
      expect(money).toHaveClass("text-xl", "lg:text-xl");
      expect(money).not.toHaveClass("min-[360px]:text-lg", "lg:text-2xl");
    }
    // Ten digits do not fit two cards side by side on a phone.
    expect(screen.getByRole("region", { name: "Ringkasan" })).not.toHaveClass(
      "min-[360px]:grid-cols-2",
    );
  });

  it("keeps two cards side by side while the totals are short", async () => {
    setup({
      income: { total: 12_000_000, count: 1 },
      expense: { total: 85_000, count: 2 },
      balance: 11_915_000,
    });

    // The 8-digit tier of the income, also for the 5-digit expense.
    const money = await amount("85.000 rupiah");
    expect(money).toHaveClass("text-xl", "min-[360px]:text-lg", "lg:text-2xl");
    expect(screen.getByRole("region", { name: "Ringkasan" })).toHaveClass(
      "min-[360px]:grid-cols-2",
    );
  });
});
