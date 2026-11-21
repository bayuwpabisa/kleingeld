import { render, screen } from "@testing-library/react";

import { Money } from "./money";

describe("Money", () => {
  it("signs an expense with a minus and reads it out in words", () => {
    const { container } = render(<Money amount={35_000} type="expense" />);
    expect(container).toHaveTextContent("−Rp35.000");
    expect(screen.getByText("pengeluaran 35.000 rupiah")).toHaveClass(
      "sr-only",
    );
  });

  it("signs income with a plus in the income color", () => {
    const { container } = render(<Money amount={8_500_000} type="income" />);
    expect(container).toHaveTextContent("+Rp8.500.000");
    expect(container.firstElementChild).toHaveClass("text-income");
  });

  it("keeps expenses in the normal text color", () => {
    const { container } = render(<Money amount={35_000} type="expense" />);
    expect(container.firstElementChild).not.toHaveClass("text-income");
  });

  it("shows a plain amount without a sign", () => {
    const { container } = render(<Money amount={5_250_000} />);
    expect(container).toHaveTextContent(/^Rp5\.250\.000/);
    expect(screen.getByText("5.250.000 rupiah")).toBeInTheDocument();
  });

  it("shows a negative balance with a minus, not in red", () => {
    const { container } = render(<Money amount={-120_000} />);
    expect(container).toHaveTextContent("−Rp120.000");
    expect(container.firstElementChild?.className).not.toMatch(/danger/);
  });

  it("hides the visual digits from screen readers, so they are read once", () => {
    render(<Money amount={35_000} type="expense" />);
    expect(
      screen.getByText("35.000").closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
