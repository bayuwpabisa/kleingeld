import { render } from "@testing-library/react";

import { CategoryIcon } from "./category-icon";

describe("CategoryIcon", () => {
  it("draws the icon named by the category, hidden from screen readers", () => {
    const { container } = render(<CategoryIcon name="utensils" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-icon", "utensils");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a tag for an unknown name", () => {
    const { container } = render(<CategoryIcon name="rocket-ship" />);
    expect(container.querySelector("svg")).toHaveAttribute("data-icon", "tag");
  });
});
