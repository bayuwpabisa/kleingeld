import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
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

function renderOptions(props: Parameters<typeof SignInOptions>[0] = {}) {
  return render(
    <ToastProvider>
      <SignInOptions {...props} />
    </ToastProvider>,
  );
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
