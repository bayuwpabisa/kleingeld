"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

/** Dialog and Toast on /dev/ui: the delete flow from DESIGN.md (States, Hapus). */
export function OverlayDemo() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const toast = useToast();

  function confirmDelete() {
    setConfirmOpen(false);
    setDeleted(true);
    toast.show({
      message: "Transaksi dihapus",
      action: { label: "Urungkan", onClick: () => setDeleted(false) },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted" aria-live="polite">
        Transaksi &ldquo;Makan siang&rdquo;:{" "}
        {deleted ? "dihapus" : "ada di daftar"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {/* Stays enabled: focus returns here when the dialog closes. */}
        <Button variant="quiet-danger" onClick={() => setConfirmOpen(true)}>
          Hapus transaksi
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.show({ message: "Transaksi disimpan" })}
        >
          Tampilkan toast
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus transaksi?"
        description="“Makan siang” sebesar Rp 45.000 akan dihapus dari daftar."
      >
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
