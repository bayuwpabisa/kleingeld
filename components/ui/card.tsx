import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardElement = "div" | "section" | "article" | "li";

type CardProps = HTMLAttributes<HTMLElement> & {
  /**
   * Element to render. Pick the one that fits the content: `li` inside a list,
   * `section`/`article` when the card has its own heading (link it with
   * `aria-labelledby`), `div` otherwise.
   */
  as?: CardElement;
  /** `muted` fills the card, for the balance card on mobile. */
  variant?: "default" | "muted";
};

/** Flat card: border, no shadow (DESIGN.md, Bentuk dan kedalaman). */
export function Card({
  as: Element = "div",
  variant = "default",
  className,
  ...props
}: CardProps) {
  return (
    <Element
      className={cn(
        "rounded-xl border border-border p-4 lg:p-6",
        variant === "muted" ? "bg-surface-muted" : "bg-surface",
        className,
      )}
      {...props}
    />
  );
}
