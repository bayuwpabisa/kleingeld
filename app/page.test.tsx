import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import LandingPage from "@/app/page";

describe("Landing page", () => {
  it("has one h1 with the promise", () => {
    render(<LandingPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Atur uang bulanan tanpa ribet");
  });

  it("uses the same two calls to action everywhere", () => {
    render(<LandingPage />);
    const start = screen.getAllByRole("link", { name: "Mulai gratis" });
    const demo = screen.getAllByRole("link", { name: "Coba akun demo" });
    expect(start.length).toBeGreaterThan(0);
    expect(demo.length).toBeGreaterThan(0);
    // Until sign-in exists (10 Nov) both open the app preview.
    for (const link of [...start, ...demo]) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
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
