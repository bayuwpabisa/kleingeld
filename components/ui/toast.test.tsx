import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ToastProvider, useToast } from "@/components/ui/toast";

function Triggers({ onUndo = () => {} }: { onUndo?: () => void }) {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.show({ message: "Transaksi disimpan" })}>
        Simpan
      </button>
      <button
        onClick={() =>
          toast.show({
            message: "Transaksi dihapus",
            action: { label: "Urungkan", onClick: onUndo },
          })
        }
      >
        Hapus
      </button>
    </>
  );
}

function setup(onUndo?: () => void) {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <ToastProvider>
      <Triggers onUndo={onUndo} />
    </ToastProvider>,
  );
  return { user, status: screen.getByRole("status") };
}

function wait(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

afterEach(() => {
  jest.useRealTimers();
});

describe("Toast", () => {
  it("keeps an empty live region in the page before any toast", () => {
    const { status } = setup();

    expect(status).toBeEmptyDOMElement();
  });

  it("shows the message in the live region and hides it after 4 seconds", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    expect(status).toHaveTextContent("Transaksi disimpan");

    wait(3900);
    expect(status).toHaveTextContent("Transaksi disimpan");

    wait(100);
    expect(status).toBeEmptyDOMElement();
  });

  it("stays while hovered and starts counting again after", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await user.hover(screen.getByText("Transaksi disimpan"));
    wait(10_000);
    expect(status).toHaveTextContent("Transaksi disimpan");

    await user.unhover(screen.getByText("Transaksi disimpan"));
    wait(4000);
    expect(status).toBeEmptyDOMElement();
  });

  it("stays while focus is inside it", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    act(() => {
      screen.getByRole("button", { name: "Urungkan" }).focus();
    });
    wait(10_000);

    expect(status).toHaveTextContent("Transaksi dihapus");
  });

  it("runs the action and closes when Urungkan is pressed", async () => {
    const onUndo = jest.fn();
    const { user, status } = setup(onUndo);

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    await user.click(screen.getByRole("button", { name: "Urungkan" }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(status).toBeEmptyDOMElement();
  });

  it("returns focus to where it came from after Urungkan", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Urungkan" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Hapus" })).toHaveFocus();
  });

  it("closes with the Tutup button", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await user.click(screen.getByRole("button", { name: "Tutup" }));

    expect(status).toBeEmptyDOMElement();
  });

  it("replaces the current toast with a new one", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await user.click(screen.getByRole("button", { name: "Hapus" }));

    expect(status).toHaveTextContent("Transaksi dihapus");
    expect(status).not.toHaveTextContent("Transaksi disimpan");
  });

  it("restarts the timer after a toast closed while hovered", async () => {
    const { user, status } = setup();

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await user.hover(screen.getByText("Transaksi disimpan"));
    await user.click(screen.getByRole("button", { name: "Tutup" }));

    await user.click(screen.getByRole("button", { name: "Simpan" }));
    wait(4000);
    expect(status).toBeEmptyDOMElement();
  });

  it("has no axe violations while shown", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    jest.useRealTimers();

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("throws a clear error outside ToastProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Triggers />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
