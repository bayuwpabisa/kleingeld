import { render as rtlRender, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactElement } from "react";
import LandingPage from "@/app/page";
import { ToastProvider } from "@/components/ui/toast";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { demo: jest.fn() } },
}));

// The demo button shows its errors in the app-wide toast.
const render = (ui: ReactElement) =>
  rtlRender(<ToastProvider>{ui}</ToastProvider>);

describe("Landing page", () => {
  it("has one h1 with the promise", () => {
    render(<LandingPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Atur uang bulanan tanpa ribet");
  });

  it("sends sign-ups to the login page and opens the demo in one click", () => {
    render(<LandingPage />);
    const start = [
      ...screen.getAllByRole("link", { name: "Mulai gratis" }),
      screen.getByRole("link", { name: "Masuk" }),
    ];
    expect(start.length).toBeGreaterThan(1);
    for (const link of start) {
      expect(link).toHaveAttribute("href", "/login");
    }
    expect(
      screen.getAllByRole("button", { name: "Coba akun demo" }).length,
    ).toBeGreaterThan(0);
  });

  it("has a section for every in-page link", () => {
    const { container } = render(<LandingPage />);
    const anchors =
      container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const id = anchor.getAttribute("href")?.slice(1) ?? "";
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("describes the three features", () => {
    render(<LandingPage />);
    for (const name of [
      "Pencatatan transaksi",
      "Budget per kategori",
      "Tagihan & cicilan",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(<LandingPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
