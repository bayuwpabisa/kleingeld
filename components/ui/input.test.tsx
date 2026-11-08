import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("is labelled, and clicking the label focuses it", async () => {
    const user = userEvent.setup();
    render(<Input label="Catatan" />);

    await user.click(screen.getByText("Catatan"));

    expect(screen.getByRole("textbox", { name: "Catatan" })).toHaveFocus();
  });

  it("reads the hint as its description", () => {
    render(<Input label="Catatan" hint="Opsional, maksimal 100 karakter." />);

    const input = screen.getByRole("textbox", { name: "Catatan" });
    expect(input).toHaveAccessibleDescription(
      "Opsional, maksimal 100 karakter.",
    );
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("is invalid and described by its error", () => {
    render(
      <Input
        label="Nominal"
        hint="Dalam rupiah."
        error="Nominal harus lebih dari 0."
      />,
    );

    const input = screen.getByRole("textbox", { name: "Nominal" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Dalam rupiah. Nominal harus lebih dari 0.",
    );
  });

  it("keeps a caller's aria-describedby", () => {
    render(
      <>
        <p id="extra">Teks tambahan</p>
        <Input label="Catatan" aria-describedby="extra" />
      </>,
    );

    expect(
      screen.getByRole("textbox", { name: "Catatan" }),
    ).toHaveAccessibleDescription("Teks tambahan");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Input label="Catatan" hint="Opsional." />
        <Input label="Nominal" error="Nominal harus lebih dari 0." />
        <Input label="Kategori" disabled />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
