import { render } from "@testing-library/react";
import { LayoutDashboard } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { NavLinkIcon } from "./nav-link-icon";

jest.mock("next/link", () => {
  const actual = jest.requireActual("next/link");
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useLinkStatus: jest.fn(() => ({ pending: false })),
  };
});

const linkStatus = jest.mocked(useLinkStatus);

function renderIcon() {
  return render(
    <Link href="/dashboard">
      <NavLinkIcon icon={LayoutDashboard} className="size-5" strokeWidth={2} />
      Dashboard
    </Link>,
  );
}

describe("NavLinkIcon", () => {
  it("shows the section's icon while nothing is loading", () => {
    linkStatus.mockReturnValue({ pending: false });
    const { container } = renderIcon();

    expect(container.querySelector(".lucide-layout-dashboard")).not.toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  // useLinkStatus is pending until the next page replaces this one, e.g.
  // when the route was not prefetched (always in dev) or the network is slow.
  it("shows a spinner in the icon's box while its page loads", () => {
    linkStatus.mockReturnValue({ pending: true });
    const { container } = renderIcon();

    const spinner = container.querySelector<SVGElement>(".animate-spin");
    expect(spinner).not.toBeNull();
    expect(spinner?.closest("[aria-hidden]")).not.toBeNull();
    // Same box as the icon, so the label does not move.
    const box = container.querySelector("a > span");
    expect(box).toHaveClass("size-5");
    expect(box).toContainElement(spinner);
  });
});
