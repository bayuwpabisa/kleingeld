import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useRouter } from "next/navigation";
import { Activity } from "react";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders } from "@/test/render-with-providers";
import { SignInOptions } from "./sign-in-options";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { social: jest.fn(), demo: jest.fn() },
  },
}));

const replace = jest.fn();
const social = jest.mocked(authClient.signIn.social);
const demo = jest.mocked(authClient.signIn.demo);

// The auth client resolves to { data, error }; the tests only set `error`.
type Result = Awaited<ReturnType<typeof demo>>;
const ok = { data: {}, error: null } as unknown as Result;
const failed = {
  data: null,
  error: { status: 500, statusText: "Error" },
} as unknown as Result;

const both = ["google", "github"] as const;

function renderOptions(
  props: Partial<Parameters<typeof SignInOptions>[0]> = {},
) {
  return renderWithProviders(<SignInOptions providers={both} {...props} />);
}

function providerButtonLabels() {
  return screen
    .queryAllByRole("button", { name: /^Lanjut dengan/ })
    .map((button) => button.textContent);
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    replace,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => jest.clearAllMocks());

describe("SignInOptions", () => {
  it("signs in with Google and comes back to the page asked for", async () => {
    social.mockResolvedValue(ok);
    renderOptions({ next: "/budgets" });

    await userEvent.click(
      screen.getByRole("button", { name: "Lanjut dengan Google" }),
    );

    expect(social).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google", callbackURL: "/budgets" }),
    );
  });

  it("sends GitHub sign-ins to the dashboard by default", async () => {
    social.mockResolvedValue(ok);
    renderOptions();

    await userEvent.click(
      screen.getByRole("button", { name: "Lanjut dengan GitHub" }),
    );

    expect(social).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "github",
        callbackURL: "/dashboard",
      }),
    );
  });

  it("tells the user when a provider fails", async () => {
    social.mockResolvedValue(failed);
    renderOptions();

    await userEvent.click(
      screen.getByRole("button", { name: "Lanjut dengan Google" }),
    );

    expect(
      await screen.findByText(/Gagal masuk dengan Google/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lanjut dengan Google" }),
    ).toBeEnabled();
  });

  it("opens the demo account", async () => {
    let finish: (value: Result) => void = () => {};
    demo.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderOptions();

    await userEvent.click(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    );
    const button = screen.getByRole("button", {
      name: "Menyiapkan data demo…",
    });
    expect(button).toHaveAttribute("aria-busy", "true");

    finish(ok);
    await screen.findByRole("button", { name: "Menyiapkan data demo…" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("drops data cached for an earlier user before opening the demo", async () => {
    demo.mockResolvedValue(ok);
    const { queryClient } = renderOptions();
    queryClient.setQueryData(["transactions", "list"], { total: 3 });

    await userEvent.click(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    );

    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(queryClient.getQueryData(["transactions", "list"])).toBeUndefined();
  });

  it("lets the user try the demo again when it fails", async () => {
    demo.mockResolvedValue(failed);
    renderOptions();

    await userEvent.click(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    );

    expect(
      await screen.findByText(/Gagal masuk ke akun demo/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    ).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows the error an OAuth sign-in came back with", () => {
    renderOptions({ error: "access_denied" });
    expect(screen.getByRole("alert")).toHaveTextContent("Gagal masuk");
  });

  it("has no axe violations", async () => {
    const { container } = renderOptions({ error: "access_denied" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

// With cacheComponents, Next hides a page it leaves (<Activity>) and keeps
// its state, so a provider button could come back still waiting.
describe("SignInOptions when its page comes back", () => {
  it("lets the user pick a provider again", async () => {
    social.mockResolvedValue(ok);
    const page = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <SignInOptions providers={both} />
      </Activity>
    );
    const { rerender } = renderWithProviders(page("visible"));

    await userEvent.click(
      screen.getByRole("button", { name: "Lanjut dengan Google" }),
    );
    // Waiting for the browser to leave for Google.
    expect(
      screen.getByRole("button", { name: "Lanjut dengan GitHub" }),
    ).toBeDisabled();

    rerender(page("hidden"));
    rerender(page("visible"));

    for (const name of ["Lanjut dengan Google", "Lanjut dengan GitHub"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeEnabled();
      expect(button).not.toHaveAttribute("aria-busy");
    }
  });
});

// The server only accepts providers with keys (lib/auth-providers.ts); a
// button for any other one would end in a 404.
describe("SignInOptions providers", () => {
  it("offers only the demo account when no provider has keys", () => {
    renderOptions({ providers: [] });

    expect(providerButtonLabels()).toStrictEqual([]);
    expect(screen.queryByText("atau")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    ).toBeEnabled();
  });

  it("offers only the provider that has keys", () => {
    renderOptions({ providers: ["github"] });

    expect(providerButtonLabels()).toStrictEqual(["Lanjut dengan GitHub"]);
    expect(screen.getByText("atau")).toBeInTheDocument();
  });

  it("keeps Google above GitHub", () => {
    renderOptions({ providers: ["github", "google"] });

    expect(providerButtonLabels()).toStrictEqual([
      "Lanjut dengan Google",
      "Lanjut dengan GitHub",
    ]);
  });

  it.each([
    ["no provider", []],
    ["both providers", both],
  ] as const)("has no axe violations with %s", async (_, providers) => {
    const { container } = renderOptions({ providers });
    expect(await axe(container)).toHaveNoViolations();
  });
});
