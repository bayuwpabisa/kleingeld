"use client";

import { useId, type ComponentProps, type Ref } from "react";

import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/money";

import { Field, fieldAria } from "./field";

// More digits than any allowed amount (MAX_AMOUNT has 13), and still a safe
// integer, so Zod can report "too large" instead of a rounded number.
const MAX_DIGITS = 15;

type AmountInputProps = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type" | "inputMode" | "ref"
> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * The big amount field of the transaction form (DESIGN.md, Input nominal):
 * "Rp" and the number in text-4xl, no box, only a bottom border. Typing shows
 * thousands dots ("35000" → "35.000") and reports a whole number, or
 * undefined when empty. Works with React Hook Form's Controller
 * (value, onChange, onBlur, name, ref).
 */
export function AmountInput({
  value,
  onChange,
  label = "Nominal",
  error,
  id,
  className,
  "aria-describedby": describedBy,
  ...props
}: AmountInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field id={inputId} label={label} error={error} className={className}>
      <div
        className={cn(
          "flex items-baseline gap-2 border-b pb-1",
          error ? "border-danger" : "border-border-strong",
        )}
      >
        <span aria-hidden="true" className="text-2xl font-medium text-fg-muted">
          Rp
        </span>
        <input
          {...props}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={value === undefined ? "" : formatRupiah(value)}
          onChange={(event) => {
            const digits = event.target.value
              .replace(/\D/g, "")
              .slice(0, MAX_DIGITS);
            onChange(digits === "" ? undefined : Number(digits));
          }}
          className="w-full min-w-0 bg-transparent text-4xl font-semibold text-fg tabular-nums outline-none placeholder:text-fg-muted"
          {...fieldAria(inputId, { error }, describedBy)}
        />
      </div>
    </Field>
  );
}
