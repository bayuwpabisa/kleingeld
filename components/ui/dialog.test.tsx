import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";

function DeleteDialog({ onOpenChange }: { onOpenChange?: jest.Mock }) {
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    onOpenChange?.(next);
    setOpen(next);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Hapus transaksi</Button>
      <Dialog
        open={open}
        onOpenChange={change}
        title="Hapus transaksi?"
        description="Transaksi Makan siang akan dihapus dari daftar."
      >
        <DialogActions>
          <Button variant="secondary" onClick={() => change(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={() => change(false)}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  const onOpenChange = jest.fn();
  render(<DeleteDialog onOpenChange={onOpenChange} />);
  const trigger = screen.getByRole("button", { name: "Hapus transaksi" });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Hapus transaksi?" });
  return { user, onOpenChange, trigger, dialog };
}

describe("Dialog", () => {
  it("is not shown while closed", () => {
    render(<DeleteDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a dialog named by its title and described by its text", async () => {
    const { dialog } = await openDialog();

    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription(
      "Transaksi Makan siang akan dihapus dari daftar.",
    );
  });

  it("closes with the Tutup button and returns focus to the trigger", async () => {
    const { user, onOpenChange, trigger, dialog } = await openDialog();

    await user.click(screen.getByRole("button", { name: "Tutup" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });

  it("reports a close done by the browser (Esc)", async () => {
    const { onOpenChange, trigger, dialog } = await openDialog();

    // Esc is handled by the browser, which then closes the dialog itself.
    (dialog as HTMLDialogElement).close();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger).toHaveFocus();
  });

  it("closes when the backdrop is clicked, not when the content is", async () => {
    const { user, onOpenChange, dialog } = await openDialog();

    await user.click(screen.getByText("Hapus transaksi?"));
    expect(onOpenChange).not.toHaveBeenCalled();

    // A click on the backdrop targets the <dialog> element itself.
    await user.click(dialog);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no axe violations while open", async () => {
    const { dialog } = await openDialog();

    expect(await axe(dialog)).toHaveNoViolations();
  });
});
