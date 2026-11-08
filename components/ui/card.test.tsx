import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders a div by default", () => {
    render(<Card data-testid="card">Isi</Card>);

    expect(screen.getByTestId("card").tagName).toBe("DIV");
  });

  it("renders a labelled section with as='section'", () => {
    render(
      <Card as="section" aria-labelledby="income-title">
        <h2 id="income-title">Pemasukan</h2>
      </Card>,
    );

    expect(
      screen.getByRole("region", { name: "Pemasukan" }),
    ).toBeInTheDocument();
  });

  it("renders list items inside a list", async () => {
    const { container } = render(
      <ul>
        <Card as="li">Makan siang</Card>
        <Card as="li" variant="muted">
          Transport
        </Card>
      </ul>,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});
