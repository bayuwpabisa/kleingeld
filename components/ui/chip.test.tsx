import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ChipRadioGroup, ChipSelect } from "@/components/ui/chip";

describe("ChipSelect", () => {
  function CategoryChip(props: { active?: boolean; onChange?: () => void }) {
    return (
      <ChipSelect
        label="Kategori"
        value=""
        onChange={props.onChange ?? (() => {})}
        active={props.active}
      >
        <option value="">Semua kategori</option>
        <option value="makan">Makan</option>
      </ChipSelect>
    );
  }

  it("is a native select named by its label", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<CategoryChip onChange={onChange} />);

    const select = screen.getByRole("combobox", { name: "Kategori" });
    expect(select).toHaveDisplayValue("Semua kategori");
    await user.selectOptions(select, "Makan");
    expect(onChange).toHaveBeenCalled();
  });

  it("marks an active filter for assistive tech too, not by color alone", () => {
    render(<CategoryChip active />);
    expect(screen.getByRole("combobox", { name: "Kategori" })).toHaveAttribute(
      "data-active",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <CategoryChip />
        <ChipSelect label="Urutkan" value="new" onChange={() => {}} active>
          <option value="new">Terbaru</option>
        </ChipSelect>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ChipRadioGroup", () => {
  const options = [
    { value: "all", label: "Semua" },
    { value: "income", label: "Pemasukan" },
    { value: "expense", label: "Pengeluaran" },
  ] as const;

  it("is a radio group with one choice", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ChipRadioGroup
        legend="Tipe"
        name="type"
        options={options}
        value="all"
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Tipe" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Semua" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Pengeluaran" }));
    expect(onChange).toHaveBeenCalledWith("expense");
  });

  it("moves between options with the arrow keys", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ChipRadioGroup
        legend="Tipe"
        name="type"
        options={options}
        value="all"
        onChange={onChange}
      />,
    );

    await user.tab();
    expect(screen.getByRole("radio", { name: "Semua" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("income");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ChipRadioGroup
        legend="Tipe"
        name="type"
        options={options}
        value="income"
        onChange={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
