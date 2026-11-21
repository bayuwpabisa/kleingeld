import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Pagination, pageItems } from "@/components/ui/pagination";

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the first, the last and the pages around the current one", () => {
    expect(pageItems(5, 9)).toEqual([1, "gap", 4, 5, 6, "gap", 9]);
  });

  it("shows a single hidden page instead of a gap", () => {
    expect(pageItems(4, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
    expect(pageItems(6, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9]);
  });

  it("keeps five numbers near either end, so the bar does not jump", () => {
    expect(pageItems(1, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
    expect(pageItems(9, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9]);
  });
});

describe("Pagination", () => {
  function setup(page: number, pageCount: number) {
    const onPageChange = jest.fn();
    render(
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />,
    );
    return {
      onPageChange,
      nav: screen.getByRole("navigation", { name: "Halaman" }),
    };
  }

  it("marks the current page and goes to another", async () => {
    const user = userEvent.setup();
    const { onPageChange, nav } = setup(2, 3);

    expect(
      within(nav).getByRole("button", { name: "Halaman 2" }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(within(nav).getByRole("button", { name: "Halaman 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("has previous and next, disabled at the ends", async () => {
    const user = userEvent.setup();
    const { onPageChange, nav } = setup(1, 3);

    expect(
      within(nav).getByRole("button", { name: "Halaman sebelumnya" }),
    ).toBeDisabled();
    await user.click(
      within(nav).getByRole("button", { name: "Halaman berikutnya" }),
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("is not shown for a single page", () => {
    render(<Pagination page={1} pageCount={1} onPageChange={() => {}} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Pagination page={5} pageCount={9} onPageChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
