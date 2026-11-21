import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { Activity } from "react";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders } from "@/test/render-with-providers";
import { DemoSignInButton } from "./demo-sign-in-button";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { demo: jest.fn() } },
}));

const replace = jest.fn();
const demo = jest.mocked(authClient.signIn.demo);
type Result = Awaited<ReturnType<typeof demo>>;

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    replace,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => jest.clearAllMocks());

// With cacheComponents, Next hides a page it leaves (<Activity>) and keeps
// its state: after signing out, /login showed this button still busy.
describe("DemoSignInButton", () => {
  it("is ready again when its page comes back after signing in", async () => {
    demo.mockResolvedValue({ data: {}, error: null } as unknown as Result);
    const page = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <DemoSignInButton />
      </Activity>
    );
    const { rerender } = renderWithProviders(page("visible"));

    await userEvent.click(
      screen.getByRole("button", { name: "Masuk dengan akun demo" }),
    );
    // Busy until the next page replaces this one.
    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(
      screen.getByRole("button", { name: "Menyiapkan data demo…" }),
    ).toBeDisabled();

    rerender(page("hidden"));
    rerender(page("visible"));

    const button = screen.getByRole("button", {
      name: "Masuk dengan akun demo",
    });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });
});
