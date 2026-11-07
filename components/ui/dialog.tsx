"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  /** Called with `false` on Tutup, Esc or a backdrop click. */
  onOpenChange: (open: boolean) => void;
  /** Visible heading; also the dialog's accessible name. */
  title: string;
  /** Short text under the title, read when the dialog opens. */
  description?: string;
  /** `className` is for layout only (DESIGN.md, Komponen). */
  className?: string;
  children: ReactNode;
};

/**
 * Modal dialog on the native `<dialog>` with `showModal()`. The browser makes
 * the page behind it inert (focus stays inside), closes it on Esc and puts it
 * in the top layer. On phones it is a bottom sheet; from `lg` it is centered
 * (DESIGN.md, Dialog / bottom sheet).
 *
 * Keep it mounted and toggle `open`, so focus can return to the trigger.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusTo.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fires for every close: Esc (closed by the browser), Tutup, or `open` set
  // to false by the caller.
  function handleClose() {
    returnFocusTo.current?.focus();
    returnFocusTo.current = null;
    if (open) onOpenChange(false);
  }

  // The backdrop belongs to the <dialog> itself; the content sits in an inner
  // div, so a click there has a different target.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onOpenChange(false);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={handleClose}
      onClick={handleClick}
      className={cn(
        // Phone: bottom sheet, full width.
        "mx-0 mt-auto mb-0 max-h-[calc(100dvh-2rem)] w-full max-w-full rounded-t-2xl",
        // Desktop: centered, 480–560px.
        "lg:m-auto lg:w-[calc(100%-4rem)] lg:max-w-[560px] lg:rounded-2xl",
        "border-0 bg-surface p-0 text-fg shadow-overlay backdrop:bg-black/40",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="pt-1.5 text-xl font-semibold lg:pt-1">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => onOpenChange(false)}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg lg:-mt-1 lg:size-10"
          >
            <X aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="text-base text-fg-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}

/**
 * Buttons at the bottom of a dialog. Put the cancel button first and the
 * primary one last: on desktop cancel sits left of primary, on phones primary
 * is full width on top (DESIGN.md, Dialog / bottom sheet).
 */
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 *:w-full lg:flex-row lg:justify-end lg:*:w-auto">
      {children}
    </div>
  );
}
