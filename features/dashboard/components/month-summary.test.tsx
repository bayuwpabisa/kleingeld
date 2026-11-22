import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { transactionKeys } from "@/features/transactions/api/keys";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { TransactionSummary } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { MonthSummary } from "./month-summary";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-22";
const NOVEMBER = { from: "2026-11-01", to: "2026-11-30" };
const SUMMARY_PATH = "/api/transactions/summary?from=2026-11-01&to=2026-11-30";

const BEFORE_PAYDAY: TransactionSummary = {
  income: { total: 0, count: 0 },
  expense: { total: 1_250_000, count: 12 },
  balance: -1_250_000,
};
const AFTER_PAYDAY: TransactionSummary = {
  income: { total: 8_500_000, count: 1 },
  expense: { total: 5_250_000, count: 40 },
  balance: 3_250_000,
};

/** What the server hands over: this month's summary, as the page does. */
function serverState(summary: TransactionSummary) {
  const server = new QueryClient();
  server.setQueryData(transactionKeys.summary(NOVEMBER), summary);
  return dehydrate(server);
}

function renderHydrated(summary: TransactionSummary) {
  return renderWithProviders(
    <HydrationBoundary state={serverState(summary)}>
      <MonthSummary today={TODAY} />
    </HydrationBoundary>,
  );
}

function answerSummary(summary: TransactionSummary) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path === SUMMARY_PATH) return summary;
    throw new Error(`Unexpected request ${path}`);
  });
}

const region = () =>
  screen.getByRole("region", { name: "Ringkasan bulan ini" });

afterEach(() => {
  fetchApi.mockReset();
});

describe("MonthSummary with the server's data", () => {
  it("shows this month's totals at once, without asking the API", () => {
    renderHydrated(AFTER_PAYDAY);

    expect(screen.getByText("3.250.000 rupiah")).toBeInTheDocument();
    expect(screen.getByText("8.500.000 rupiah")).toBeInTheDocument();
    expect(screen.getByText("5.250.000 rupiah")).toBeInTheDocument();
    expect(screen.getByText("1 transaksi")).toBeInTheDocument();
    expect(screen.getByText("40 transaksi")).toBeInTheDocument();
    expect(region()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("says no income has come in yet, and shows the balance below zero", () => {
    renderHydrated(BEFORE_PAYDAY);

    expect(
      screen.getByText("Belum ada pemasukan bulan ini"),
    ).toBeInTheDocument();
    expect(screen.queryByText("0 transaksi")).not.toBeInTheDocument();
    expect(screen.getByText("0 rupiah")).toBeInTheDocument();
    expect(screen.getByText("minus 1.250.000 rupiah")).toBeInTheDocument();
  });

  it("loads the new totals after a change to the transactions", async () => {
    const { queryClient } = renderHydrated(BEFORE_PAYDAY);
    answerSummary(AFTER_PAYDAY);

    // What every transaction mutation does when it settles.
    await act(() =>
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    );

    expect(await screen.findByText("3.250.000 rupiah")).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(SUMMARY_PATH, expect.anything());
  });

  it("sizes the balance from the larger total, and the others like the transactions page", () => {
    renderHydrated({
      income: { total: 0, count: 0 },
      expense: { total: 1_250_000_000, count: 3 },
      balance: -1_250_000_000,
    });

    const money = (label: string) => screen.getByText(label).parentElement;
    // 10 digits: balanceSize and summaryLayout's tier.
    expect(money("minus 1.250.000.000 rupiah")).toHaveClass(
      "text-2xl",
      "min-[360px]:text-3xl",
      "lg:text-xl",
    );
    expect(money("0 rupiah")).toHaveClass("text-xl", "lg:text-xl");
    expect(money("0 rupiah")).not.toHaveClass("text-3xl");
  });

  it("has no axe violations", async () => {
    const { container } = renderHydrated(BEFORE_PAYDAY);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MonthSummary without the server's data", () => {
  it("shows a skeleton, then loads this month from the API", async () => {
    answerSummary(AFTER_PAYDAY);
    renderWithProviders(<MonthSummary today={TODAY} />);

    expect(region()).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/rupiah$/)).not.toBeInTheDocument();

    expect(await screen.findByText("3.250.000 rupiah")).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(SUMMARY_PATH, expect.anything());
  });

  it("says when it fails to load, and loads again on Coba lagi", async () => {
    const user = userEvent.setup();
    let fail = true;
    fetchApi.mockImplementation(async (path: string) => {
      if (path !== SUMMARY_PATH) throw new Error(`Unexpected request ${path}`);
      if (fail) {
        fail = false;
        throw new ApiError({ status: 500, code: "unknown", message: "x" });
      }
      return AFTER_PAYDAY;
    });
    renderWithProviders(<MonthSummary today={TODAY} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ringkasan gagal dimuat.",
    );

    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText("3.250.000 rupiah")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
