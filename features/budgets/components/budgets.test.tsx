import {
  dehydrate,
  HydrationBoundary,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ApiError, apiFetch } from "@/lib/api/client";
import type { BudgetStatus } from "@/schemas/budget";
import { renderWithProviders } from "@/test/render-with-providers";

import { budgetKeys } from "../api/keys";
import { Budgets, BudgetsSkeleton } from "./budgets";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-26";
const PATH = "/api/budgets?month=2026-11";

function budget(name: string, amount: number, spent: number): BudgetStatus {
  return {
    id: `0b6e5f00-0000-4000-8000-${name.padStart(12, "0")}`,
    category: { id: `cat-${name}`, name, icon: "tag" },
    amount,
    spent,
    count: 3,
  };
}

// As GET /api/budgets answers: sorted by name.
const BUDGETS = [
  budget("Belanja", 2_260_000, 1_130_000),
  budget("Makan", 1_250_000, 1_059_000),
  budget("Transport", 360_000, 400_500),
];

function serverState(rows: BudgetStatus[]) {
  const server = new QueryClient();
  server.setQueryData(budgetKeys.month("2026-11"), rows);
  return dehydrate(server);
}

function renderHydrated(rows: BudgetStatus[]) {
  return renderWithProviders(
    <HydrationBoundary state={serverState(rows)}>
      <Budgets today={TODAY} />
    </HydrationBoundary>,
  );
}

const summary = () => screen.getByRole("region", { name: "Ringkasan budget" });
const list = () => screen.getByRole("list", { name: "Budget per kategori" });
function card(name: string) {
  const found = within(list())
    .getAllByRole("listitem")
    .find((item) => within(item).queryByRole("heading", { name }));
  if (!found) throw new Error(`No budget card for ${name}`);
  return found;
}

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("Budgets with the server's data", () => {
  it("adds up the month without asking the API", () => {
    renderHydrated(BUDGETS);

    const text = summary().textContent;
    expect(text).toContain("Total budget");
    expect(within(summary()).getByText("3.870.000 rupiah")).toBeInTheDocument();
    expect(text).toContain("3 kategori");
    expect(within(summary()).getByText("2.589.500 rupiah")).toBeInTheDocument();
    expect(text).toContain("66% dari total");
    expect(within(summary()).getByText("1.280.500 rupiah")).toBeInTheDocument();
    expect(text).toContain("untuk 5 hari lagi");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("names the budgets that need attention", () => {
    renderHydrated(BUDGETS);
    expect(
      screen.getByText(
        "2 kategori perlu perhatian: Makan hampir habis (84%) dan Transport lewat batas (112%).",
      ),
    ).toBeInTheDocument();
  });

  it("shows one card per budget with its meter, in the API's order", () => {
    renderHydrated(BUDGETS);

    expect(
      within(list())
        .getAllByRole("heading")
        .map((h) => h.textContent),
    ).toStrictEqual(["Belanja", "Makan", "Transport"]);
    expect(screen.getByRole("meter", { name: "Belanja" })).toHaveAttribute(
      "aria-valuetext",
      "50% terpakai",
    );
    expect(screen.getByRole("meter", { name: "Makan" })).toHaveAttribute(
      "aria-valuetext",
      "84% · hampir habis",
    );
    expect(screen.getByRole("meter", { name: "Transport" })).toHaveAttribute(
      "aria-valuetext",
      "112% · lewat batas",
    );
    const makan = within(card("Makan"));
    expect(makan.getByText("1.059.000 rupiah")).toBeInTheDocument();
    expect(makan.getByText("1.250.000 rupiah")).toBeInTheDocument();
    expect(card("Makan")).toHaveTextContent(/dari/);
  });

  it("outlines a card by its level", () => {
    renderHydrated(BUDGETS);
    expect(card("Belanja")).toHaveClass("border-border");
    expect(card("Makan")).toHaveClass("border-warning-fill");
    expect(card("Transport")).toHaveClass("border-danger");
  });

  it("has no banner while every budget is below 80%", () => {
    renderHydrated([budget("Belanja", 1_000_000, 799_000)]);
    expect(screen.queryByText(/perlu perhatian/)).not.toBeInTheDocument();
  });

  it("shows what is left below 0 once the spending is over all the limits", () => {
    renderHydrated([budget("Transport", 360_000, 400_500)]);
    expect(
      within(summary()).getByText("minus 40.500 rupiah"),
    ).toBeInTheDocument();
    expect(summary()).toHaveTextContent("melewati total budget");
    expect(summary()).not.toHaveTextContent("hari lagi");
  });

  it("explains what budgets are for when there are none", () => {
    renderHydrated([]);
    expect(
      screen.getByText(
        "Belum ada budget. Atur batas per kategori supaya pengeluaran tetap terkontrol.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Ringkasan budget" }),
    ).not.toBeInTheDocument();
  });

  it("has no axe violations, with and without budgets", async () => {
    for (const rows of [BUDGETS, []]) {
      const { container, unmount } = renderHydrated(rows);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});

describe("Budgets without the server's data", () => {
  it("shows the skeleton, then loads the month from the API", async () => {
    fetchApi.mockResolvedValueOnce(BUDGETS);
    renderWithProviders(<Budgets today={TODAY} />);

    expect(summary()).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();

    expect(
      await screen.findByRole("meter", { name: "Makan" }),
    ).toBeInTheDocument();
    expect(summary()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).toHaveBeenCalledWith(PATH, {
      signal: expect.any(AbortSignal),
    });
  });

  it("offers to try again when loading fails", async () => {
    fetchApi.mockRejectedValueOnce(
      new ApiError({ status: 500, code: "unknown", message: "x" }),
    );
    renderWithProviders(<Budgets today={TODAY} />);

    expect(
      await screen.findByText(
        "Budget gagal dimuat. Periksa koneksi lalu coba lagi.",
      ),
    ).toBeInTheDocument();

    fetchApi.mockResolvedValueOnce(BUDGETS);
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(
      await screen.findByRole("meter", { name: "Makan" }),
    ).toBeInTheDocument();
  });

  it("says it waits for the connection while offline", async () => {
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<Budgets today={TODAY} />);

    expect(
      await screen.findByText(
        "Kamu sedang offline. Budget dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("has the same shape in the page's Suspense fallback", () => {
    renderWithProviders(<BudgetsSkeleton />);
    expect(summary()).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("list", { name: "Budget per kategori" }),
    ).toBeInTheDocument();
  });
});
