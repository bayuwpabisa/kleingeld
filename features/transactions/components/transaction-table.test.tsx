import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import type { TransactionDto } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { TransactionTable } from "./transaction-table";

const lunch: TransactionDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  type: "expense",
  amount: 35_000,
  date: "2026-11-01",
  note: "Makan siang",
  category: {
    id: "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f",
    name: "Makan",
    icon: "utensils",
  },
  createdAt: "2026-11-01T05:00:00.000Z",
  updatedAt: "2026-11-01T05:00:00.000Z",
};

const bus: TransactionDto = {
  ...lunch,
  id: "0b6e5f00-0000-4000-8000-000000000002",
  amount: 7_000,
  note: null,
  category: {
    id: "4a2d3c5f-9b8e-4d6f-a071-2b3c4d5e6f70",
    name: "Transport",
    icon: "bus",
  },
};

type Props = Parameters<typeof TransactionTable>[0];

function setup(props: Partial<Props> = {}) {
  const onSort = jest.fn();
  const utils = renderWithProviders(
    <TransactionTable
      transactions={[lunch, bus]}
      sorting={{ sort: "date", order: "desc" }}
      onSort={onSort}
      {...props}
    />,
  );
  return { onSort, ...utils };
}

const header = (name: string) => screen.getByRole("columnheader", { name });

describe("TransactionTable", () => {
  it("marks only the sorted column with its order", () => {
    const { rerender } = setup({ sorting: { sort: "amount", order: "asc" } });

    expect(header("Nominal")).toHaveAttribute("aria-sort", "ascending");
    expect(header("Tanggal")).not.toHaveAttribute("aria-sort");

    rerender(
      <TransactionTable
        transactions={[lunch, bus]}
        sorting={{ sort: "date", order: "desc" }}
        onSort={() => {}}
      />,
    );

    expect(header("Tanggal")).toHaveAttribute("aria-sort", "descending");
    expect(header("Nominal")).not.toHaveAttribute("aria-sort");
  });

  it("flips the sorted column, and starts another one with the newest date", async () => {
    const { onSort } = setup({ sorting: { sort: "amount", order: "desc" } });

    await userEvent.click(screen.getByRole("button", { name: "Nominal" }));
    await userEvent.click(screen.getByRole("button", { name: "Tanggal" }));

    expect(onSort.mock.calls).toStrictEqual([
      [{ sort: "amount", order: "asc" }],
      [{ sort: "date", order: "desc" }],
    ]);
  });

  it("waits with the actions of a row that is still being saved", () => {
    setup({
      transactions: [{ ...lunch, id: "optimistic-1" }, bus],
    });

    expect(
      screen.getByRole("button", { name: "Ubah Makan siang" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Hapus Makan siang" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Ubah Transport" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Hapus Transport" }),
    ).toBeEnabled();
  });

  it("opens the edit dialog and the delete confirmation for a row", async () => {
    const { store } = setup();

    await userEvent.click(
      screen.getByRole("button", { name: "Ubah Makan siang" }),
    );
    expect(store.getState().transactionEditor.editor).toStrictEqual({
      mode: "edit",
      id: lunch.id,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Hapus Makan siang" }),
    );
    expect(store.getState().transactionEditor.deleteId).toBe(lunch.id);
  });

  it("names a row without a note after its category", () => {
    setup();

    // Only the note column has a title; the category column shows the name
    // without one.
    expect(screen.getByTitle("Transport")).toHaveTextContent("Transport");
    expect(
      screen.getByRole("button", { name: "Ubah Transport" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = setup({
      transactions: [{ ...lunch, id: "optimistic-1" }, bus],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
