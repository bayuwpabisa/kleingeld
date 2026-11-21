import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { isActivePath } from "@/components/app-shell/nav-items";
import { Sidebar } from "@/components/app-shell/sidebar";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("next/link", () => {
  const actual = jest.requireActual("next/link");
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useLinkStatus: jest.fn(() => ({ pending: false })),
  };
});

const mockPathname = jest.mocked(usePathname);
const mockLinkStatus = jest.mocked(useLinkStatus);

describe("isActivePath", () => {
  it("matches the route and the pages under it, not lookalikes", () => {
    expect(isActivePath("/transactions", "/transactions")).toBe(true);
    expect(isActivePath("/transactions/new", "/transactions")).toBe(true);
    expect(isActivePath("/transactions-old", "/transactions")).toBe(false);
    expect(isActivePath("/dashboard", "/transactions")).toBe(false);
  });
});

describe("Sidebar", () => {
  it("lists the five sections and marks the current one", () => {
    mockPathname.mockReturnValue("/budgets");
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Transaksi",
      "Budget",
      "Tagihan",
      "Pengaturan",
    ]);
    expect(within(nav).getByRole("link", { name: "Budget" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("has no axe violations", async () => {
    mockPathname.mockReturnValue("/dashboard");
    const { container } = render(<Sidebar />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("BottomNav", () => {
  it("shows four sections and the add button, without Pengaturan", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    expect(
      within(nav).getByRole("link", { name: "Tambah transaksi" }),
    ).toHaveAttribute("href", "/transactions/new");
    expect(
      within(nav).queryByRole("link", { name: "Pengaturan" }),
    ).not.toBeInTheDocument();
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
  });

  it("keeps Transaksi current on the new-transaction page", () => {
    mockPathname.mockReturnValue("/transactions/new");
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Transaksi" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Tambah transaksi" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("has no axe violations", async () => {
    mockPathname.mockReturnValue("/bills");
    const { container } = render(<BottomNav />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Each nav link shows a spinner while its page loads (NavLinkIcon). Here
// every link reports pending, so every one of them must have a spinner.
describe("nav links while a page loads", () => {
  beforeEach(() => mockLinkStatus.mockReturnValue({ pending: true }));
  afterEach(() => mockLinkStatus.mockReturnValue({ pending: false }));

  it("gives every sidebar section a spinner", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    for (const link of within(nav).getAllByRole("link")) {
      expect(link.querySelector(".animate-spin")).not.toBeNull();
    }
  });

  it("gives every bottom nav link a spinner, the add button too", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link.querySelector(".animate-spin")).not.toBeNull();
    }
  });

  // One at a time: the app shows only one of them per width (CSS), so
  // together they would repeat the "Navigasi utama" landmark.
  it.each([
    ["sidebar", Sidebar],
    ["bottom nav", BottomNav],
  ])("has no axe violations in the %s", async (_, Nav) => {
    mockPathname.mockReturnValue("/dashboard");
    const { container } = render(<Nav />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
