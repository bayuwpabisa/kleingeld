import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

/** Props shared by every labelled form control (Input, Select). */
export type FieldOwnProps = {
  /** Visible label. Every control has one; placeholder text is not a label. */
  label: string;
  /** Extra help shown under the control and read after the label. */
  hint?: string;
  /** Validation message. Marks the control invalid and turns its border red. */
  error?: string;
};

type FieldProps = FieldOwnProps & {
  id: string;
  className?: string;
  children: ReactNode;
};

/** Label on top, then the control, then hint and error (DESIGN.md, Input). */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm text-danger"
        >
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
          />
          {error}
        </p>
      )}
    </div>
  );
}

/** ARIA that links a control to its hint and error text. */
export function fieldAria(
  id: string,
  { hint, error }: Pick<FieldOwnProps, "hint" | "error">,
  describedBy?: string,
) {
  const ids = [describedBy, hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  return {
    "aria-describedby": ids || undefined,
    "aria-invalid": error ? true : undefined,
  };
}

/**
 * Box styles shared by Input, Select and Textarea, size md (DESIGN.md,
 * Ukuran kontrol). "multi" is the textarea: no fixed height, at least 88px.
 */
export function controlClasses(
  invalid: boolean,
  shape: "single" | "multi" = "single",
) {
  return cn(
    "w-full rounded-lg border bg-surface px-3 text-base text-fg",
    shape === "single" ? "h-11 lg:h-10" : "min-h-22 py-2.5",
    "placeholder:text-fg-muted disabled:cursor-not-allowed disabled:opacity-50",
    invalid ? "border-danger" : "border-border-strong",
  );
}
