import { cn } from "@/lib/cn";

/**
 * Wordmark with a placeholder mark. The final symbol is still an open
 * decision (DESIGN.md, Keputusan terbuka). Wrap it in a link where needed;
 * the link's name comes from the wordmark.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="size-7 shrink-0 rounded-lg bg-primary" />
      <span className="text-lg font-semibold tracking-[-0.01em] text-fg">
        Kleingeld
      </span>
    </span>
  );
}
