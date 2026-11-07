"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

const DURATION_MS = 4000;

export type ToastOptions = {
  /** Same words as the button that caused it: "Transaksi disimpan". */
  message: string;
  /** One follow-up action, such as "Urungkan" after a delete. */
  action?: { label: string; onClick: () => void };
};

type ToastApi = {
  /** Shows a toast, replacing the one on screen. */
  show: (options: ToastOptions) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** `show` and `dismiss` for the toast. Use inside `ToastProvider`. */
export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}

/**
 * One toast at a time, in a `role="status"` live region that is always in the
 * page, so screen readers announce each new message. It hides after 4 seconds;
 * hovering it or moving focus into it pauses the timer (WCAG 2.2.1), and the
 * full 4 seconds start again after. Closing it while focus is inside sends
 * focus back to where it was before.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(
    null,
  );
  const [paused, setPaused] = useState(false);
  const nextId = useRef(0);
  const toastRef = useRef<HTMLDivElement>(null);
  // Where focus was before it moved into the toast, to go back on close.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    returnFocusTo.current = null;
    setToast({ ...options, id: nextId.current });
    setPaused(false);
  }, []);

  // Also clears `paused`: a toast closed under the pointer never gets
  // its mouseleave.
  const dismiss = useCallback(() => {
    if (toastRef.current?.contains(document.activeElement)) {
      returnFocusTo.current?.focus();
    }
    returnFocusTo.current = null;
    setToast(null);
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = setTimeout(dismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, paused, dismiss]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

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
    <ToastContext value={api}>
      {children}
      {/* Bottom left on desktop; on phones above the bottom nav (64px). */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-5 bottom-20 z-50 flex justify-center lg:inset-x-auto lg:bottom-6 lg:left-6"
      >
        {toast && (
          <div
            key={toast.id}
            ref={toastRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-xl bg-fg py-2 pr-2 pl-4 text-sm text-canvas shadow-overlay lg:w-auto"
          >
            <p className="min-w-0 flex-1 py-1">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss();
                }}
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 font-medium text-canvas underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Tutup"
              onClick={dismiss}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-canvas opacity-80 hover:opacity-100"
            >
              <X aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  );
}
