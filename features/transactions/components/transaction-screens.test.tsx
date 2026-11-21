import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useParams, useRouter } from "next/navigation";
import { Activity } from "react";

import { ApiError, apiFetch } from "@/lib/api/client";
import type { CategoryDto } from "@/schemas/category";
import type { TransactionDto } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { EditTransactionScreen } from "./edit-transaction-screen";
import { NewTransactionScreen } from "./new-transaction-screen";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);
const push = jest.fn();

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
];
const existing: TransactionDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  type: "expense",
  amount: 35_000,
  date: "2026-11-01",
  note: "Makan siang",
  category: { id: MAKAN, name: "Makan", icon: "utensils" },
  createdAt: "2026-11-01T05:00:00.000Z",
  updatedAt: "2026-11-01T05:00:00.000Z",
};

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push,
  } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useParams).mockReturnValue({ id: existing.id });
  fetchApi.mockImplementation(async (path, init) => {
    if (path === "/api/categories") return categories;
    if (init?.method === "POST") return { ...existing, id: "new" };
    if (init?.method === "PATCH") return existing;
    if (init?.method === "DELETE") return undefined;
    if (path === `/api/transactions/${existing.id}`) return existing;
    throw new ApiError({ status: 404, code: "not_found", message: "x" });
  });
});

afterEach(() => {
  jest.clearAllMocks();
  fetchApi.mockReset();
});

function newScreen(mode: "visible" | "hidden") {
  return (
    <Activity mode={mode}>
      <NewTransactionScreen />
    </Activity>
  );
}

describe("NewTransactionScreen", () => {
  it("saves and goes back to the list", async () => {
    renderWithProviders(<NewTransactionScreen />);

    await userEvent.type(
      await screen.findByRole("textbox", { name: "Nominal" }),
      "12000",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Kategori" }),
      "Makan",
    );
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(push).toHaveBeenCalledWith("/transactions");
    await waitFor(() =>
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/transactions",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  // With cacheComponents, Next hides a page it leaves (<Activity>) and keeps
  // its state: the form showed the saved values again, ready to save twice.
  it("starts empty when opened again after saving", async () => {
    const { rerender } = renderWithProviders(newScreen("visible"));

    await userEvent.type(
      await screen.findByRole("textbox", { name: "Nominal" }),
      "12000",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Kategori" }),
      "Makan",
    );
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    // Still filled while the list is on its way.
    expect(screen.getByRole("textbox", { name: "Nominal" })).toHaveValue(
      "12.000",
    );

    rerender(newScreen("hidden"));
    rerender(newScreen("visible"));

    expect(await screen.findByRole("textbox", { name: "Nominal" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("combobox", { name: "Kategori" })).toHaveValue("");
  });

  it("keeps an unsaved draft when the page comes back", async () => {
    const { rerender } = renderWithProviders(newScreen("visible"));

    await userEvent.type(
      await screen.findByRole("textbox", { name: "Nominal" }),
      "12000",
    );
    rerender(newScreen("hidden"));
    rerender(newScreen("visible"));

    expect(screen.getByRole("textbox", { name: "Nominal" })).toHaveValue(
      "12.000",
    );
  });

  it("has no Batal button on the page; the back link does that", async () => {
    renderWithProviders(<NewTransactionScreen />);
    await screen.findByRole("textbox", { name: "Nominal" });
    expect(
      screen.queryByRole("button", { name: "Batal" }),
    ).not.toBeInTheDocument();
  });
});

describe("EditTransactionScreen", () => {
  it("loads the transaction, saves changes and goes back", async () => {
    renderWithProviders(<EditTransactionScreen />);

    const amount = await screen.findByRole("textbox", { name: "Nominal" });
    await waitFor(() => expect(amount).toHaveValue("35.000"));
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );

    expect(push).toHaveBeenCalledWith("/transactions");
    await waitFor(() =>
      expect(fetchApi).toHaveBeenCalledWith(
        `/api/transactions/${existing.id}`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });

  it("deletes after confirming in the sheet", async () => {
    renderWithProviders(<EditTransactionScreen />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Hapus transaksi" }),
    );
    const sheet = await screen.findByRole("dialog", {
      name: "Hapus transaksi ini?",
    });
    await userEvent.click(within(sheet).getByRole("button", { name: "Hapus" }));

    expect(push).toHaveBeenCalledWith("/transactions");
    await waitFor(() =>
      expect(fetchApi).toHaveBeenCalledWith(
        `/api/transactions/${existing.id}`,
        {
          method: "DELETE",
        },
      ),
    );
  });

  // The delete question is a one-off: it must not greet the user again when
  // they come back to this transaction (Next keeps hidden pages' state).
  it("closes the delete sheet when the page is left", async () => {
    const page = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <EditTransactionScreen />
      </Activity>
    );
    const { rerender } = renderWithProviders(page("visible"));

    await userEvent.click(
      await screen.findByRole("button", { name: "Hapus transaksi" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Hapus transaksi ini?" }),
    ).toBeInTheDocument();

    rerender(page("hidden"));
    rerender(page("visible"));

    expect(
      await screen.findByRole("button", { name: "Hapus transaksi" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Hapus transaksi ini?" }),
    ).not.toBeInTheDocument();
  });

  it("says when the transaction does not exist", async () => {
    jest.mocked(useParams).mockReturnValue({ id: "tidak-ada" });
    renderWithProviders(<EditTransactionScreen />);

    expect(
      await screen.findByText(
        "Transaksi tidak ditemukan. Mungkin sudah dihapus.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kembali ke transaksi" }),
    ).toHaveAttribute("href", "/transactions");
  });

  it("has no axe violations", async () => {
    const { container } = renderWithProviders(<EditTransactionScreen />);
    await screen.findByRole("button", { name: "Hapus transaksi" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
