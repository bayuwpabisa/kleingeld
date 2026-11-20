import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { todayInJakarta } from "@/lib/date";
import type { CategoryDto } from "@/schemas/category";
import type { TransactionDto } from "@/schemas/transaction";

import { TransactionForm } from "./transaction-form";

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const TRANSPORT = "4a2d3c5f-9b8e-4d6f-a071-2b3c4d5e6f70";
const GAJI = "5b3e4d60-ac9f-4e70-b182-3c4d5e6f7081";

const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
  { id: TRANSPORT, name: "Transport", type: "expense", icon: "bus" },
  { id: GAJI, name: "Gaji", type: "income", icon: "wallet" },
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

function setup(props: Partial<Parameters<typeof TransactionForm>[0]> = {}) {
  const onSubmit = jest.fn();
  const utils = render(
    <TransactionForm categories={categories} onSubmit={onSubmit} {...props} />,
  );
  return { onSubmit, ...utils };
}

const amount = () => screen.getByRole("textbox", { name: "Nominal" });
const category = () => screen.getByRole("combobox", { name: "Kategori" });
const date = () => screen.getByLabelText("Tanggal");
const note = () => screen.getByRole("textbox", { name: "Catatan (opsional)" });
const save = () => screen.getByRole("button", { name: "Simpan" });

function optionNames() {
  return Array.from(category().querySelectorAll("option"))
    .filter((option) => option.value !== "")
    .map((option) => option.textContent);
}

describe("TransactionForm", () => {
  it("starts as a new expense dated today", () => {
    setup();
    expect(screen.getByRole("radio", { name: "Pengeluaran" })).toBeChecked();
    expect(amount()).toHaveValue("");
    expect(screen.getByLabelText("Tanggal")).toHaveValue(todayInJakarta());
    expect(
      screen.queryByRole("button", { name: "Hapus transaksi" }),
    ).not.toBeInTheDocument();
  });

  it("says what is missing and moves focus to the first problem", async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Isi nominal")).toBeInTheDocument();
    expect(
      screen.getByText("Pilih kategori", { selector: "p" }),
    ).toBeInTheDocument();
    expect(amount()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ["0", "Nominal harus lebih dari 0"],
    ["1000000000001", "Nominal maksimal Rp1.000.000.000.000"],
  ])("rejects an amount of %s", async (typed, message) => {
    const { onSubmit } = setup();

    await userEvent.type(amount(), typed);
    await userEvent.selectOptions(category(), "Makan");
    await userEvent.click(save());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(amount()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a note over 200 characters and moves focus to it", async () => {
    const { onSubmit } = setup();

    await userEvent.type(amount(), "35000");
    await userEvent.selectOptions(category(), "Makan");
    await userEvent.click(note());
    await userEvent.paste("a".repeat(201));
    await userEvent.click(save());

    expect(
      await screen.findByText("Catatan maksimal 200 karakter"),
    ).toBeInTheDocument();
    expect(note()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves focus to the first wrong field, top to bottom", async () => {
    setup();

    await userEvent.type(amount(), "35000");
    await userEvent.clear(date());
    await userEvent.click(save());

    expect(await screen.findByText("Pilih tanggal")).toBeInTheDocument();
    expect(category()).toHaveFocus();

    await userEvent.selectOptions(category(), "Makan");
    await userEvent.click(save());

    expect(date()).toHaveFocus();
  });

  it("clears an error as soon as its field is fixed", async () => {
    setup();

    await userEvent.click(save());
    expect(await screen.findByText("Isi nominal")).toBeInTheDocument();

    await userEvent.type(amount(), "35000");

    expect(screen.queryByText("Isi nominal")).not.toBeInTheDocument();
    expect(
      screen.getByText("Pilih kategori", { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("sends the parsed values", async () => {
    const { onSubmit } = setup();

    await userEvent.type(amount(), "35000");
    await userEvent.selectOptions(category(), "Makan");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Catatan (opsional)" }),
      "  Makan siang  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "expense",
      categoryId: MAKAN,
      amount: 35_000,
      date: todayInJakarta(),
      note: "Makan siang",
    });
  });

  it("sends an income with its category", async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole("radio", { name: "Pemasukan" }));
    await userEvent.type(amount(), "8500000");
    await userEvent.selectOptions(category(), "Gaji");
    await userEvent.click(save());

    expect(onSubmit.mock.calls).toStrictEqual([
      [
        {
          type: "income",
          categoryId: GAJI,
          amount: 8_500_000,
          date: todayInJakarta(),
          note: null,
        },
      ],
    ]);
  });

  it("sends null for a note emptied while editing", async () => {
    const { onSubmit } = setup({ transaction: existing });

    await userEvent.clear(note());
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );

    expect(onSubmit.mock.calls).toStrictEqual([
      [
        {
          type: "expense",
          categoryId: MAKAN,
          amount: 35_000,
          date: "2026-11-01",
          note: null,
        },
      ],
    ]);
  });

  it("shows no note for a transaction without one, and keeps it null", async () => {
    const { onSubmit } = setup({ transaction: { ...existing, note: null } });

    expect(note()).toHaveValue("");
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );

    expect(onSubmit.mock.calls).toStrictEqual([
      [
        {
          type: "expense",
          categoryId: MAKAN,
          amount: 35_000,
          date: "2026-11-01",
          note: null,
        },
      ],
    ]);
  });

  it("offers only categories of the chosen type and clears one that no longer fits", async () => {
    setup();
    expect(optionNames()).toEqual(["Makan", "Transport"]);
    await userEvent.selectOptions(category(), "Makan");

    await userEvent.click(screen.getByRole("radio", { name: "Pemasukan" }));

    expect(optionNames()).toEqual(["Gaji"]);
    expect(category()).toHaveValue("");
  });

  it("fills in a transaction to edit and offers to delete it", async () => {
    const onDelete = jest.fn();
    const { onSubmit } = setup({ transaction: existing, onDelete });

    expect(amount()).toHaveValue("35.000");
    expect(category()).toHaveValue(MAKAN);
    expect(screen.getByLabelText("Tanggal")).toHaveValue("2026-11-01");
    expect(
      screen.getByRole("textbox", { name: "Catatan (opsional)" }),
    ).toHaveValue("Makan siang");

    await userEvent.click(
      screen.getByRole("button", { name: "Hapus transaksi" }),
    );
    expect(onDelete).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 35_000, categoryId: MAKAN }),
    );
  });

  it("lets the amount of an edited transaction be cleared and retyped", async () => {
    const { onSubmit } = setup({ transaction: existing, onDelete: () => {} });

    await userEvent.clear(amount());
    expect(amount()).toHaveValue("");
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );
    expect(await screen.findByText("Isi nominal")).toBeInTheDocument();

    await userEvent.type(amount(), "40000");
    expect(amount()).toHaveValue("40.000");
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40_000 }),
    );
  });

  it("has a Batal button only where it is given one", async () => {
    const onCancel = jest.fn();
    setup({ onCancel });
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("has no axe violations, also with errors shown", async () => {
    const { container } = setup({ onCancel: () => {} });
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText("Isi nominal");
    expect(await axe(container)).toHaveNoViolations();
  });
});
