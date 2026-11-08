import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { isActivePath } from "@/components/app-shell/nav-items";
import { Sidebar } from "@/components/app-shell/sidebar";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

const mockPathname = jest.mocked(usePathname);

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
