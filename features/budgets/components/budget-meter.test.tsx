import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { BudgetMeter, BudgetStatusLabel } from "./budget-meter";

function renderMeter(spent: number, amount: number) {
  return render(
    <div>
      <h3 id="name">Makan</h3>
      <BudgetStatusLabel spent={spent} amount={amount} />
      <BudgetMeter spent={spent} amount={amount} labelledBy="name" />
    </div>,
  );
}

const meter = () => screen.getByRole("meter", { name: "Makan" });
const fill = () => meter().firstElementChild;

describe("BudgetMeter", () => {
  it("shows the share used below 80%", () => {
    renderMeter(450, 1_000);
    expect(meter()).toHaveAttribute("aria-valuenow", "45");
    expect(meter()).toHaveAttribute("aria-valuemin", "0");
    expect(meter()).toHaveAttribute("aria-valuemax", "100");
    expect(meter()).toHaveAttribute("aria-valuetext", "45% terpakai");
    expect(fill()).toHaveStyle({ width: "45%" });
    expect(fill()).toHaveClass("bg-primary");
    const label = screen.getByText("45% terpakai").parentElement;
    expect(label).toHaveClass("text-fg-muted");
    expect(label?.querySelector("svg")).toBeNull();
  });

  it("warns from 80%, with an icon and words, not only colour", () => {
    renderMeter(850, 1_000);
    expect(meter()).toHaveAttribute("aria-valuetext", "85% · hampir habis");
    expect(fill()).toHaveClass("bg-warning-fill");
    const label = screen.getByText("85% · hampir habis").parentElement;
    expect(label).toHaveClass("text-warning");
    expect(label?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("fills the track and says it is over the limit", () => {
    renderMeter(1_120, 1_000);
    // A meter's value stays within its range; the words say how far over.
    expect(meter()).toHaveAttribute("aria-valuenow", "100");
    expect(meter()).toHaveAttribute("aria-valuetext", "112% · lewat batas");
    expect(fill()).toHaveStyle({ width: "100%" });
    expect(fill()).toHaveClass("bg-danger");
    const label = screen.getByText("112% · lewat batas").parentElement;
    expect(label).toHaveClass("text-danger");
    expect(label?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no axe violations at each level", async () => {
    for (const spent of [0, 850, 1_120]) {
      const { container, unmount } = renderMeter(spent, 1_000);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
