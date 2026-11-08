import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Select } from "@/components/ui/select";

function CategorySelect(props: Partial<Parameters<typeof Select>[0]>) {
  return (
    <Select label="Kategori" placeholder="Pilih kategori" {...props}>
      <option value="makan">Makan</option>
      <option value="transport">Transport</option>
    </Select>
  );
}

describe("Select", () => {
  it("starts on the placeholder and lets the user pick an option", async () => {
    const user = userEvent.setup();
    render(<CategorySelect />);

    const select = screen.getByRole("combobox", { name: "Kategori" });
    expect(select).toHaveValue("");

    await user.selectOptions(select, "Transport");
    expect(select).toHaveValue("transport");
  });

  it("disables the placeholder when required", () => {
    render(<CategorySelect required />);

    expect(
      screen.getByRole("option", { name: "Pilih kategori" }),
    ).toBeDisabled();
  });

  it("is invalid and described by its error", () => {
    render(<CategorySelect error="Pilih kategori dulu." />);

    const select = screen.getByRole("combobox", { name: "Kategori" });
    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription("Pilih kategori dulu.");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <CategorySelect />
        <CategorySelect label="Kategori lain" error="Pilih kategori dulu." />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
