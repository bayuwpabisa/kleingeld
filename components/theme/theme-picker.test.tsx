import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ThemePicker } from "@/components/theme/theme-picker";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function setup() {
  const user = userEvent.setup();
  const view = render(
    <ThemeProvider>
      <ThemePicker />
    </ThemeProvider>,
  );
  return { user, ...view };
}

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute("data-theme");
});

describe("ThemePicker", () => {
  it("offers Terang, Gelap and Sistem, with Sistem as the default", () => {
    setup();
    const group = screen.getByRole("radiogroup", { name: "Mode warna" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sistem" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Terang" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Gelap" })).not.toBeChecked();
  });

  it("switches the page to dark and remembers it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: "Gelap" }));
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("radio", { name: "Gelap" })).toBeChecked();
  });

  it("goes back to the OS setting with Sistem", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const { user } = setup();
    expect(screen.getByRole("radio", { name: "Terang" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Sistem" }));
    expect(root).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
