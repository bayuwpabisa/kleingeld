import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "quiet"
  | "quiet-primary"
  | "quiet-danger"
  | "danger";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";

// Hover sits behind `not-disabled:` so a disabled button does not react.
// (`enabled:` would also skip links styled with `buttonClasses`.)
const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary not-disabled:hover:bg-primary-hover",
  secondary:
    "border border-border-strong bg-surface text-fg not-disabled:hover:bg-surface-muted",
  // Text-only buttons. quiet-primary: "Daftar" in the demo banner.
  // quiet-danger: "Hapus transaksi" inside the form (DESIGN.md, Button).
  quiet: "text-fg not-disabled:hover:bg-surface-muted",
  "quiet-primary": "text-primary not-disabled:hover:bg-surface-muted",
  "quiet-danger": "text-danger not-disabled:hover:bg-surface-muted",
  // Only for the confirm button in a delete dialog.
  danger: "bg-danger text-on-danger not-disabled:hover:brightness-95",
};

// md is 44px on mobile and 40px from lg up (DESIGN.md, Ukuran kontrol).
const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-4 text-base lg:h-10",
  sm: "h-8 px-3 text-sm",
};

/** Button classes, also for a `<Link>` that should look like a button. */
export function buttonClasses({
  variant = "primary",
  size = "md",
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cn(base, variants[variant], sizes[size]);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Request in flight: disables the button and shows a spinner. The label stays. */
  busy?: boolean;
};

export function Button({
  variant,
  size,
  busy = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(buttonClasses({ variant, size }), className)}
      {...props}
    >
      {busy && (
        <LoaderCircle
          aria-hidden
          className="size-4 shrink-0 animate-spin"
          strokeWidth={1.75}
        />
      )}
      {children}
    </button>
  );
}
