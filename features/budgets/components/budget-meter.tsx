import { CircleAlert, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

import {
  budgetLabel,
  budgetLevel,
  budgetPercent,
  type BudgetLevel,
} from "../budget-status";

// DESIGN.md › Meter budget. Class names are written out whole so Tailwind
// finds them.

const fillClasses: Record<BudgetLevel, string> = {
  ok: "bg-primary",
  warning: "bg-warning-fill",
  over: "bg-danger",
};

const labelClasses: Record<BudgetLevel, string> = {
  ok: "text-fg-muted",
  warning: "text-warning",
  over: "text-danger",
};

/** The card's border for a level: plain, `warning-fill` or `danger`. */
export const budgetBorderClasses: Record<BudgetLevel, string> = {
  ok: "border-border",
  warning: "border-warning-fill",
  over: "border-danger",
};

type MeterProps = { spent: number; amount: number };

/**
 * The 8px track, filled by the share used (full once over the limit).
 * Named by the element `labelledBy` points to, usually the category name;
 * its value text is the label, e.g. "85% · hampir habis".
 */
export function BudgetMeter({
  spent,
  amount,
  labelledBy,
}: MeterProps & { labelledBy: string }) {
  const level = budgetLevel(spent, amount);
  // A meter's value stays within its range; the text says how far over.
  const shown = Math.min(budgetPercent(spent, amount), 100);
  return (
    <div
      role="meter"
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      aria-valuetext={budgetLabel(spent, amount)}
      className="h-2 overflow-hidden rounded-full bg-surface-muted"
    >
      <div
        className={cn("h-full rounded-full", fillClasses[level])}
        style={{ width: `${shown}%` }}
      />
    </div>
  );
}

/**
 * "45% terpakai", or with an icon from 80%: "85% · hampir habis" (triangle)
 * and "112% · lewat batas" (circle), so the level is not told by colour only.
 */
export function BudgetStatusLabel({ spent, amount }: MeterProps) {
  const level = budgetLevel(spent, amount);
  const Icon =
    level === "over" ? CircleAlert : level === "warning" ? TriangleAlert : null;
  return (
    <p
      className={cn(
        "flex shrink-0 items-center gap-1 text-sm whitespace-nowrap",
        level !== "ok" && "font-medium",
        labelClasses[level],
      )}
    >
      {Icon && (
        <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      )}
      <span>{budgetLabel(spent, amount)}</span>
    </p>
  );
}
