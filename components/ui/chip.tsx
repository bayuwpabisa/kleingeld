"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

// Filter chips (DESIGN.md, Chip/filter): rounded-full with a border; an
// active filter gets the primary-soft fill and primary border and text.
// Height: 32px on phones, where chips have a row of their own, and 40px on
// desktop, in one row with the search field (DESIGN.md, Ukuran kontrol).

const chipBase =
  "h-8 rounded-full border text-sm whitespace-nowrap transition-colors lg:h-10";
const chipIdle = "border-border bg-surface text-fg hover:bg-surface-muted";
const chipActive = "border-primary bg-primary-soft font-medium text-primary";

type ChipSelectProps = Omit<ComponentProps<"select">, "className"> & {
  /**
   * Accessible name ("Kategori"). There is no visible label: the chosen
   * option ("Semua kategori", "Makan") already says what the chip filters.
   */
  label: string;
  /** A filter is on (not its default); also exposed as `data-active`. */
  active?: boolean;
  className?: string;
};

/** A dropdown chip: a native `<select>` styled as a chip, with a chevron. */
export function ChipSelect({
  label,
  active = false,
  className,
  children,
  ...props
}: ChipSelectProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <select
        {...props}
        aria-label={label}
        data-active={active || undefined}
        className={cn(
          chipBase,
          active ? chipActive : chipIdle,
          "cursor-pointer appearance-none pr-8 pl-3.5 [&>option]:bg-surface [&>option]:font-normal [&>option]:text-fg",
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
          active ? "text-primary" : "text-fg-muted",
        )}
        strokeWidth={1.75}
      />
    </div>
  );
}

export type ChipOption<T extends string> = { value: T; label: string };

type ChipRadioGroupProps<T extends string> = {
  /** Name of the group for screen readers ("Tipe transaksi"); not shown. */
  legend: string;
  /** Radio `name`, unique on the page. */
  name: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * One choice shown as a row of chips (Semua / Pemasukan / Pengeluaran).
 * Native radios: Tab into the group, arrow keys between options. The chosen
 * chip is marked by its fill and weight, and by `checked` for screen readers.
 */
export function ChipRadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  className,
}: ChipRadioGroupProps<T>) {
  const legendId = useId();
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      className={cn("flex min-w-0 gap-2", className)}
    >
      <legend id={legendId} className="sr-only">
        {legend}
      </legend>
      {options.map((option) => (
        <label key={option.value} className="inline-flex shrink-0">
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
              chipBase,
              chipIdle,
              "inline-flex cursor-pointer items-center px-3.5",
              "peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:font-medium peer-checked:text-primary",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
            )}
          >
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
