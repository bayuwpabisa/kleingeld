import { cn } from "@/lib/cn";

/**
 * A placeholder block shaped like the content it stands for (DESIGN.md,
 * States). Size and shape come from `className`; the pulse stops for
 * reduced motion (app/globals.css). Hidden from screen readers: announce
 * loading once, next to the skeleton, instead.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded bg-surface-muted", className)}
    />
  );
}
