import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("has a visible label and the error as its description", () => {
    render(<Textarea label="Catatan (opsional)" error="Terlalu panjang" />);
    const textarea = screen.getByRole("textbox", {
      name: "Catatan (opsional)",
    });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Terlalu panjang");
  });

  it("does not take the fixed height of single-line controls", () => {
    render(<Textarea label="Catatan" />);
    expect(screen.getByRole("textbox")).not.toHaveClass("h-11");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Textarea label="Catatan" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
