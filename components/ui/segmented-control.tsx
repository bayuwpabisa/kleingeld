"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  /** Name of the group, read by screen readers ("Mode warna"). */
  legend: string;
  /** Hide the legend when a heading next to it already says the same. */
  hideLegend?: boolean;
  /** Radio `name`, unique on the page. */
  name: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * One choice out of a few, shown as pills (Terang/Gelap/Sistem,
 * Pengeluaran/Pemasukan). Built on native radio buttons, so the browser gives
 * Tab into the group, arrow keys between options and the radio semantics.
 * Styles: DESIGN.md, Segmented control.
 */
export function SegmentedControl<T extends string>({
  legend,
  hideLegend = false,
  name,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const legendId = useId();

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      className={cn("min-w-0", className)}
    >
      <legend
        id={legendId}
        className={
          hideLegend ? "sr-only" : "mb-1.5 text-sm font-medium text-fg-muted"
        }
      >
        {legend}
      </legend>
      <div className="flex h-11 rounded-full bg-surface-muted p-1 lg:h-10">
        {options.map((option) => (
          <label key={option.value} className="flex flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex flex-1 items-center justify-center rounded-full border border-transparent px-3 text-sm whitespace-nowrap text-fg-muted transition-colors hover:text-fg",
                "peer-checked:border-border-strong peer-checked:bg-surface peer-checked:font-medium peer-checked:text-fg",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
