import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <p>Tema: {theme}</p>
      <button onClick={() => setTheme("dark")}>Gelap</button>
      <button onClick={() => setTheme("light")}>Terang</button>
      <button onClick={() => setTheme("system")}>Sistem</button>
    </>
  );
}

function setup() {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  return { user };
}

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute("data-theme");
});

describe("ThemeProvider", () => {
  it("follows the system when nothing is stored", () => {
    setup();
    expect(screen.getByText("Tema: system")).toBeInTheDocument();
    expect(root).not.toHaveAttribute("data-theme");
  });

  it("reads the stored preference on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    setup();
    expect(screen.getByText("Tema: dark")).toBeInTheDocument();
    expect(root).toHaveAttribute("data-theme", "dark");
  });

  it("ignores a stored value that is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    setup();
    expect(screen.getByText("Tema: system")).toBeInTheDocument();
    expect(root).not.toHaveAttribute("data-theme");
  });

  it("sets data-theme on <html> and stores the choice", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Gelap" }));
    expect(screen.getByText("Tema: dark")).toBeInTheDocument();
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Terang" }));
    expect(root).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("removes the attribute and the stored value for system", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Gelap" }));
    await user.click(screen.getByRole("button", { name: "Sistem" }));
    expect(screen.getByText("Tema: system")).toBeInTheDocument();
    expect(root).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("follows a change made in another tab", () => {
    setup();
    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(
        new StorageEvent("storage", { key: THEME_STORAGE_KEY }),
      );
    });
    expect(screen.getByText("Tema: dark")).toBeInTheDocument();
    expect(root).toHaveAttribute("data-theme", "dark");
  });
});

describe("useTheme", () => {
  it("throws outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
    jest.restoreAllMocks();
  });
});
