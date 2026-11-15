"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { X } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  dismissToast,
  runToastAction,
  showToast,
  type CurrentToast,
  type ToastOptions,
} from "@/lib/store/toast-slice";

export type { ToastOptions };

const DURATION_MS = 4000;

type ToastApi = {
  /** Shows a toast, replacing the one on screen. */
  show: (options: ToastOptions) => void;
  dismiss: () => void;
};

/**
 * `show` and `dismiss` for the toast. The toast lives in the Redux store
 * (lib/store/toast-slice.ts), so use this inside the app providers.
 */
export function useToast(): ToastApi {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      show: (options) => dispatch(showToast(options)),
      dismiss: () => dispatch(dismissToast()),
    }),
    [dispatch],
  );
}

/**
 * The toast area: a `role="status"` live region that is always in the page,
 * so screen readers announce each new message. Rendered once, by
 * app/providers.tsx.
 */
export function Toaster() {
  const toast = useAppSelector((state) => state.toast.current);

  return (
    // Bottom left on desktop. On phones 16px above the bottom nav when the
    // page has one (--bottom-nav-space, app/globals.css), else the edge.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-5 bottom-[calc(var(--bottom-nav-space,0px)+1rem)] z-50 flex justify-center lg:inset-x-auto lg:bottom-6 lg:left-6"
    >
      {/* A new key per toast starts its timer and pause state fresh. */}
      {toast && <ToastItem key={toast.id} toast={toast} />}
    </div>
  );
}

/**
 * Hides after 4 seconds; hovering it or moving focus into it pauses the timer
 * (WCAG 2.2.1), and the full 4 seconds start again after. Closing it while
 * focus is inside sends focus back to where it was before.
 */
function ToastItem({ toast }: { toast: CurrentToast }) {
  const dispatch = useAppDispatch();
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Where focus was before it moved into the toast, to go back on close.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    if (ref.current?.contains(document.activeElement)) {
      returnFocusTo.current?.focus();
    }
  }, []);

  const close = useCallback(() => {
    restoreFocus();
    dispatch(dismissToast(toast.id));
  }, [dispatch, restoreFocus, toast.id]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(close, DURATION_MS);
    return () => clearTimeout(timer);
  }, [paused, close]);

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    setPaused(true);
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !event.currentTarget.contains(from)) {
      returnFocusTo.current = from;
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  }

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-xl bg-fg py-2 pr-2 pl-4 text-sm text-canvas shadow-overlay lg:w-auto"
    >
      <p className="min-w-0 flex-1 py-1">{toast.message}</p>
      {toast.actionLabel && (
        <button
          type="button"
          onClick={() => {
            restoreFocus();
            dispatch(runToastAction(toast.id));
          }}
          className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 font-medium text-canvas underline underline-offset-2"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        aria-label="Tutup"
        onClick={close}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-canvas opacity-80 hover:opacity-100"
      >
        <X aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
