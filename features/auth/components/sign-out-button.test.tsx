import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { SignOutButton } from "./sign-out-button";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/auth-client", () => ({
  authClient: { signOut: jest.fn() },
}));

const replace = jest.fn();
const refresh = jest.fn();
const signOut = jest.mocked(authClient.signOut);
type Result = Awaited<ReturnType<typeof signOut>>;

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    replace,
    refresh,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => jest.clearAllMocks());

function renderButton() {
  render(
    <ToastProvider>
      <SignOutButton />
    </ToastProvider>,
  );
  return screen.getByRole("button", { name: "Keluar" });
}

describe("SignOutButton", () => {
  it("signs out and goes back to the landing page", async () => {
    signOut.mockResolvedValue({ data: {}, error: null } as unknown as Result);

    await userEvent.click(renderButton());

    expect(signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("stays put and says so when signing out fails", async () => {
    signOut.mockResolvedValue({
      data: null,
      error: { status: 500, statusText: "Error" },
    } as unknown as Result);

    const button = renderButton();
    await userEvent.click(button);

    expect(await screen.findByText(/Gagal keluar/)).toBeInTheDocument();
    expect(button).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("can look like a sidebar item", async () => {
    signOut.mockResolvedValue({ data: {}, error: null } as unknown as Result);
    render(
      <ToastProvider>
        <SignOutButton appearance="nav" />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Keluar" }));

    expect(replace).toHaveBeenCalledWith("/");
  });
});
