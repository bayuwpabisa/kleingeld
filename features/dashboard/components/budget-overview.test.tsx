import {
  dehydrate,
  HydrationBoundary,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { budgetKeys } from "@/features/budgets/api/keys";
import { useCreateTransaction } from "@/features/transactions/api/use-create-transaction";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { BudgetStatus } from "@/schemas/budget";
import { renderWithProviders } from "@/test/render-with-providers";

import { BudgetOverview, BudgetOverviewSkeleton } from "./budget-overview";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-27";
const PATH = "/api/budgets?month=2026-11";

function budget(name: string, amount: number, spent: number): BudgetStatus {
  return {
    id: `0b6e5f00-0000-4000-8000-${name.padStart(12, "0")}`,
    category: {
      id: `3f1c2b4e-8a7d-4c5e-9f60-${name.padStart(12, "0")}`,
      name,
      icon: "tag",
    },
    amount,
    spent,
    count: 3,
  };
}

const BELANJA = budget("Belanja", 2_260_000, 1_130_000); // 50%
const HIBURAN = budget("Hiburan", 860_000, 389_000); // 45%
const MAKAN = budget("Makan", 1_250_000, 1_059_000); // 84%, hampir habis
const TAGIHAN = budget("Tagihan", 5_400_000, 3_241_500); // 60%
const TRANSPORT = budget("Transport", 360_000, 400_500); // 112%, lewat batas

// As GET /api/budgets answers: sorted by name.
const BUDGETS = [BELANJA, HIBURAN, MAKAN, TAGIHAN, TRANSPORT];

function serverState(rows: BudgetStatus[]) {
  const server = new QueryClient();
  server.setQueryData(budgetKeys.month("2026-11"), rows);
  return dehydrate(server);
}

function renderHydrated(rows: BudgetStatus[], extra?: React.ReactNode) {
  return renderWithProviders(
    <HydrationBoundary state={serverState(rows)}>
      <BudgetOverview today={TODAY} />
      {extra}
    </HydrationBoundary>,
  );
}

const section = () => screen.getByRole("region", { name: "Budget" });
const labels = () =>
  within(section())
    .queryAllByRole("meter")
    .map((meter) => meter.getAttribute("aria-valuetext"));
const headings = () =>
  within(section())
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
function item(name: string) {
  const found = within(section())
    .getAllByRole("listitem")
    .find((li) => within(li).queryByRole("heading", { name }));
  if (!found) throw new Error(`No budget ${name} on the card`);
  return found;
}

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("BudgetOverview with the server's data", () => {
  it("shows the three most urgent budgets without asking the API", () => {
    renderHydrated(BUDGETS);

    // Over the limit first, then almost used up, then the highest share.
    expect(headings()).toStrictEqual(["Transport", "Makan", "Tagihan"]);
    expect(labels()).toStrictEqual([
      "112% · lewat batas",
      "84% · hampir habis",
      "60% terpakai",
    ]);
    expect(
      within(section()).getByRole("meter", { name: "Makan" }),
    ).toBeInTheDocument();
    expect(section()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("shows each budget's spending and limit", () => {
    renderHydrated(BUDGETS);
    const transport = within(item("Transport"));
    expect(transport.getByText("400.500 rupiah")).toBeInTheDocument();
    expect(transport.getByText("360.000 rupiah")).toBeInTheDocument();
    expect(item("Transport")).toHaveTextContent(/dari/);
    expect(within(section()).getAllByRole("listitem")).toHaveLength(3);
  });

  it("outlines each budget by its level", () => {
    renderHydrated(BUDGETS);
    expect(
      within(section())
        .getAllByRole("listitem")
        .map((item) =>
          ["border-danger", "border-warning-fill", "border-border"].find(
            (name) => item.classList.contains(name),
          ),
        ),
    ).toStrictEqual(["border-danger", "border-warning-fill", "border-border"]);
  });

  it("shows all of them when there are fewer than three", () => {
    renderHydrated([BELANJA, HIBURAN]);
    expect(headings()).toStrictEqual(["Belanja", "Hiburan"]);
  });

  it("links to the Budget page", () => {
    renderHydrated(BUDGETS);
    expect(
      within(section()).getByRole("link", { name: "Lihat semua" }),
    ).toHaveAttribute("href", "/budgets");
  });

  it("points to the Budget page when there are no budgets", () => {
    renderHydrated([]);
    expect(
      within(section()).getByText("Belum ada budget."),
    ).toBeInTheDocument();
    expect(
      within(section()).getByRole("link", { name: "Atur budget" }),
    ).toHaveAttribute("href", "/budgets");
    expect(within(section()).queryByRole("meter")).not.toBeInTheDocument();
  });

  it("loads again after a transaction is saved", async () => {
    fetchApi.mockImplementation(async (path, init) => {
      if (init?.method === "POST") {
        return {
          id: "0b6e5f00-0000-4000-8000-00000000abcd",
          type: "expense",
          amount: 2_158_500,
          date: TODAY,
          note: null,
          category: TAGIHAN.category,
          createdAt: `${TODAY}T05:00:00.000Z`,
          updatedAt: `${TODAY}T05:00:00.000Z`,
        };
      }
      if (path === PATH) {
        return BUDGETS.map((b) =>
          b === TAGIHAN ? { ...b, spent: 5_400_000 } : b,
        );
      }
      // The transaction lists refetch too; they are not shown here.
      return { data: [], page: 1, pageSize: 20, total: 0 };
    });
    function AddButton() {
      const create = useCreateTransaction();
      return (
        <button
          onClick={() =>
            create.mutate({
              type: "expense",
              categoryId: TAGIHAN.category.id,
              amount: 2_158_500,
              date: TODAY,
              note: null,
            })
          }
        >
          Tambah
        </button>
      );
    }
    renderHydrated(BUDGETS, <AddButton />);

    await userEvent.click(screen.getByRole("button", { name: "Tambah" }));

    await waitFor(() =>
      expect(
        within(section()).getByRole("meter", { name: "Tagihan" }),
      ).toHaveAttribute("aria-valuetext", "100% · hampir habis"),
    );
    expect(fetchApi).toHaveBeenCalledWith(PATH, {
      signal: expect.any(AbortSignal),
    });
  });

  it("has no axe violations, with and without budgets", async () => {
    for (const rows of [BUDGETS, []]) {
      const { container, unmount } = renderHydrated(rows);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});

describe("BudgetOverview without the server's data", () => {
  it("shows the skeleton, then loads the month from the API", async () => {
    fetchApi.mockResolvedValueOnce(BUDGETS);
    renderWithProviders(<BudgetOverview today={TODAY} />);

    expect(section()).toHaveAttribute("aria-busy", "true");
    expect(within(section()).queryByRole("meter")).not.toBeInTheDocument();

    expect(
      await within(section()).findByRole("meter", { name: "Transport" }),
    ).toBeInTheDocument();
    expect(section()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).toHaveBeenCalledWith(PATH, {
      signal: expect.any(AbortSignal),
    });
  });

  it("offers to try again when loading fails", async () => {
    fetchApi.mockRejectedValueOnce(
      new ApiError({ status: 500, code: "unknown", message: "x" }),
    );
    renderWithProviders(<BudgetOverview today={TODAY} />);

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      "Budget gagal dimuat. Periksa koneksi lalu coba lagi.",
    );

    fetchApi.mockResolvedValueOnce(BUDGETS);
    await userEvent.click(
      within(section()).getByRole("button", { name: "Coba lagi" }),
    );

    expect(
      await within(section()).findByRole("meter", { name: "Transport" }),
    ).toBeInTheDocument();
  });

  it("says it waits for the connection while offline", () => {
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<BudgetOverview today={TODAY} />);

    expect(
      within(section()).getByText(
        "Kamu sedang offline. Budget dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("has the same frame in the page's Suspense fallback", () => {
    renderWithProviders(<BudgetOverviewSkeleton />);
    expect(section()).toHaveAttribute("aria-busy", "true");
    expect(
      within(section()).getByRole("link", { name: "Lihat semua" }),
    ).toBeInTheDocument();
  });
});
