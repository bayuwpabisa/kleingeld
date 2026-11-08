import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

const options = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
] as const;

type Mode = (typeof options)[number]["value"];

function Controlled({ onChange }: { onChange?: (value: Mode) => void }) {
  const [value, setValue] = useState<Mode>("system");
  return (
    <SegmentedControl
      legend="Mode warna"
      name="theme"
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("SegmentedControl", () => {
  it("is a named radio group with the current value checked", () => {
    render(<Controlled />);
    const group = screen.getByRole("radiogroup", { name: "Mode warna" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sistem" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Terang" })).not.toBeChecked();
  });

  it("calls onChange with the clicked option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByText("Gelap"));
    expect(onChange).toHaveBeenCalledWith("dark");
    expect(screen.getByRole("radio", { name: "Gelap" })).toBeChecked();
  });

  it("moves the choice with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "Terang" }));
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("dark");
    expect(screen.getByRole("radio", { name: "Gelap" })).toHaveFocus();
  });

  it("keeps the legend for screen readers when it is hidden", () => {
    render(
      <SegmentedControl
        legend="Jenis"
        hideLegend
        name="type"
        options={[
          { value: "expense", label: "Pengeluaran" },
          { value: "income", label: "Pemasukan" },
        ]}
        value="expense"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("radiogroup", { name: "Jenis" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Controlled />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
