import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label and does not submit forms by default", () => {
    render(<Button>Simpan</Button>);

    const button = screen.getByRole("button", { name: "Simpan" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Simpan</Button>);

    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and marked busy while busy, keeping its label", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button busy onClick={onClick}>
        Simpan
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Simpan" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Button>Simpan</Button>
        <Button variant="secondary" disabled>
          Batal
        </Button>
        <Button variant="danger" busy>
          Hapus
        </Button>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
