import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import { AmountInput } from "./amount-input";

function Harness({
  initial,
  error,
  onValue = () => {},
}: {
  initial?: number;
  error?: string;
  onValue?: (value: number | undefined) => void;
}) {
  const [value, setValue] = useState<number | undefined>(initial);
  return (
    <AmountInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue(next);
      }}
      error={error}
    />
  );
}

describe("AmountInput", () => {
  it("is labelled Nominal and asks for the number keypad", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Nominal" });
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("adds thousands dots while typing and reports a number", async () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);
    const input = screen.getByRole("textbox", { name: "Nominal" });

    await userEvent.type(input, "35000");

    expect(input).toHaveValue("35.000");
    expect(onValue).toHaveBeenLastCalledWith(35_000);
  });

  it("ignores anything that is not a digit", async () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);
    const input = screen.getByRole("textbox", { name: "Nominal" });

    await userEvent.type(input, "Rp1a2.5");

    expect(input).toHaveValue("125");
    expect(onValue).toHaveBeenLastCalledWith(125);
  });

  it("reports undefined when emptied", async () => {
    const onValue = jest.fn();
    render(<Harness initial={35_000} onValue={onValue} />);
    const input = screen.getByRole("textbox", { name: "Nominal" });
    expect(input).toHaveValue("35.000");

    await userEvent.clear(input);

    expect(input).toHaveValue("");
    expect(onValue).toHaveBeenLastCalledWith(undefined);
  });

  it("shows the error and marks the field invalid", () => {
    render(<Harness error="Isi nominal" />);
    const input = screen.getByRole("textbox", { name: "Nominal" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Isi nominal");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness initial={35_000} error="x" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
