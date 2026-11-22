import {
  dehydrate,
  HydrationBoundary,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { categoryKeys } from "@/features/categories/api/use-categories";
import { transactionKeys } from "@/features/transactions/api/keys";
import { useCreateTransaction } from "@/features/transactions/api/use-create-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { CategoryDto } from "@/schemas/category";
import type { TransactionDto, TransactionPage } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";
import { PHONE_WIDTH, setViewportWidth } from "@/test/viewport";

import { RecentTransactions } from "./recent-transactions";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-22";
const LIST_PATH = "/api/transactions?pageSize=5";
const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
];

function transaction(day: number): TransactionDto {
  const date = `2026-11-${String(day).padStart(2, "0")}`;
  return {
    id: `0b6e5f00-0000-4000-8000-0000000000${String(day).padStart(2, "0")}`,
    type: "expense",
    amount: 1_000 * day,
    date,
    note: `Catatan ${day}`,
    category: { id: MAKAN, name: "Makan", icon: "utensils" },
    createdAt: `${date}T05:00:00.000Z`,
    updatedAt: `${date}T05:00:00.000Z`,
  };
}

/** The five newest of seven, as GET /api/transactions?pageSize=5 answers. */
const NEWEST: TransactionPage = {
  data: [21, 20, 12, 6, 2].map(transaction),
  page: 1,
  pageSize: 5,
  total: 7,
};
const EMPTY: TransactionPage = { data: [], page: 1, pageSize: 5, total: 0 };

/** What the server hands over, under the key the page prefetches. */
function serverState(page: TransactionPage) {
  const server = new QueryClient();
  server.setQueryData(
    transactionKeys.list({ page: 1, pageSize: 5, sort: "date", order: "desc" }),
    page,
  );
  return dehydrate(server);
}

function renderHydrated(page: TransactionPage, extra?: React.ReactNode) {
  const utils = renderWithProviders(
    <HydrationBoundary state={serverState(page)}>
      <RecentTransactions today={TODAY} />
      {extra}
    </HydrationBoundary>,
  );
  utils.queryClient.setQueryData(categoryKeys.all, categories);
  return utils;
}

function answerList(page: TransactionPage) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path === LIST_PATH) return page;
    throw new Error(`Unexpected request ${path}`);
  });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const section = () => screen.getByRole("region", { name: "Transaksi terbaru" });
const rows = () => within(section()).queryAllByRole("listitem");
const titles = () =>
  rows().map((row) => row.querySelector("p")?.textContent ?? "");

/**
 * Clicks like a user and reports whether the page would have followed the
 * link. jsdom cannot navigate, so the click is stopped after React's
 * handlers have run.
 */
function click(element: Element, init?: MouseEventInit) {
  let followed = false;
  const stop = (event: Event) => {
    followed = !event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener("click", stop);
  fireEvent.click(element, init);
  window.removeEventListener("click", stop);
  return followed;
}

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("RecentTransactions with the server's data", () => {
  it("lists the five newest at once, with their dates, without asking the API", () => {
    renderHydrated(NEWEST);

    expect(titles()).toStrictEqual([
      "Catatan 21",
      "Catatan 20",
      "Catatan 12",
      "Catatan 6",
      "Catatan 2",
    ]);
    expect(within(section()).getByText("21 Nov · Makan")).toBeInTheDocument();
    expect(
      within(section()).getByText("pengeluaran 21.000 rupiah"),
    ).toBeInTheDocument();
    expect(section()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("links to every transaction and to the full list", () => {
    renderHydrated(NEWEST);

    expect(
      within(section()).getByRole("link", { name: /Catatan 21/ }),
    ).toHaveAttribute("href", `/transactions/${transaction(21).id}/edit`);
    expect(
      within(section()).getByRole("link", { name: "Lihat semua" }),
    ).toHaveAttribute("href", "/transactions");
  });

  it("opens the edit dialog on desktop instead of the edit page", () => {
    const { store } = renderHydrated(NEWEST);

    const followed = click(
      within(section()).getByRole("link", { name: /Catatan 20/ }),
    );

    expect(followed).toBe(false);
    expect(store.getState().transactionEditor.editor).toStrictEqual({
      mode: "edit",
      id: transaction(20).id,
    });
  });

  it("leaves a click with Ctrl to the browser on desktop", () => {
    const { store } = renderHydrated(NEWEST);

    const followed = click(
      within(section()).getByRole("link", { name: /Catatan 20/ }),
      { ctrlKey: true },
    );

    expect(followed).toBe(true);
    expect(store.getState().transactionEditor.editor).toStrictEqual({
      mode: "closed",
    });
  });

  it("follows the link to the edit page on phones", () => {
    setViewportWidth(PHONE_WIDTH);
    const { store } = renderHydrated(NEWEST);

    const followed = click(
      within(section()).getByRole("link", { name: /Catatan 20/ }),
    );

    expect(followed).toBe(true);
    expect(store.getState().transactionEditor.editor).toStrictEqual({
      mode: "closed",
    });
  });

  it("puts a new transaction on top at once and keeps five rows", async () => {
    const request = deferred<TransactionDto>();
    fetchApi.mockReturnValue(request.promise);
    function AddButton() {
      const create = useCreateTransaction();
      return (
        <button
          onClick={() =>
            create.mutate({
              type: "expense",
              categoryId: MAKAN,
              amount: 12_000,
              date: "2026-11-22",
              note: "Kopi baru",
            })
          }
        >
          Tambah
        </button>
      );
    }
    renderHydrated(NEWEST, <AddButton />);

    await userEvent.click(screen.getByRole("button", { name: "Tambah" }));

    expect(titles()).toStrictEqual([
      "Kopi baru",
      "Catatan 21",
      "Catatan 20",
      "Catatan 12",
      "Catatan 6",
    ]);
    // Settle the request, then let the refetch answer like the server.
    answerList(NEWEST);
    await act(async () => request.resolve(transaction(22)));
  });

  it("drops a deleted transaction at once", async () => {
    const request = deferred<null>();
    fetchApi.mockReturnValue(request.promise);
    function DeleteButton() {
      const remove = useDeleteTransaction();
      return (
        <button onClick={() => remove.mutate(transaction(12).id)}>Hapus</button>
      );
    }
    renderHydrated(NEWEST, <DeleteButton />);

    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(titles()).not.toContain("Catatan 12");
    expect(titles()).toHaveLength(4);
    answerList(NEWEST);
    await act(async () => request.resolve(null));
  });

  it("has no axe violations", async () => {
    const { container } = renderHydrated(NEWEST);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("RecentTransactions without the server's data", () => {
  it("shows a skeleton, then loads the five newest from the API", async () => {
    answerList(NEWEST);
    renderWithProviders(<RecentTransactions today={TODAY} />);

    expect(section()).toHaveAttribute("aria-busy", "true");
    expect(rows()).toHaveLength(0);

    expect(
      await within(section()).findByText("Catatan 21"),
    ).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(LIST_PATH, expect.anything());
  });

  it("invites a new user to add the first transaction", async () => {
    answerList(EMPTY);
    renderWithProviders(<RecentTransactions today={TODAY} />);

    expect(
      await within(section()).findByText(
        "Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi.",
      ),
    ).toBeInTheDocument();
    expect(
      within(section()).getByRole("link", { name: "Tambah transaksi" }),
    ).toHaveAttribute("href", "/transactions/new");
  });

  it("says when it fails to load, and loads again on Coba lagi", async () => {
    const user = userEvent.setup();
    let fail = true;
    fetchApi.mockImplementation(async (path: string) => {
      if (path !== LIST_PATH) throw new Error(`Unexpected request ${path}`);
      if (fail) {
        fail = false;
        throw new ApiError({ status: 500, code: "unknown", message: "x" });
      }
      return NEWEST;
    });
    renderWithProviders(<RecentTransactions today={TODAY} />);

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      "Transaksi terbaru gagal dimuat. Periksa koneksi lalu coba lagi.",
    );

    await user.click(
      within(section()).getByRole("button", { name: "Coba lagi" }),
    );

    expect(
      await within(section()).findByText("Catatan 21"),
    ).toBeInTheDocument();
    expect(within(section()).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says it waits for the connection while offline", () => {
    answerList(NEWEST);
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<RecentTransactions today={TODAY} />);

    expect(
      within(section()).getByText(
        "Kamu sedang offline. Transaksi dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
