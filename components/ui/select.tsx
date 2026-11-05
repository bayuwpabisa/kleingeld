import { useId, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Field,
  controlClasses,
  fieldAria,
  type FieldOwnProps,
} from "@/components/ui/field";

type SelectProps = ComponentProps<"select"> &
  FieldOwnProps & {
    /** First, empty option such as "Pilih kategori". It is chosen until the user picks one. */
    placeholder?: string;
  };

/**
 * Native `<select>`: the OS picker on phones, full keyboard and screen reader
 * support without extra JS. Pass `<option>` elements as children.
 * `className` goes to the wrapper (layout); `ref` and other props go to `<select>`.
 */
export function Select({
  id,
  label,
  hint,
  error,
  placeholder,
  className,
  value,
  defaultValue,
  children,
  "aria-describedby": describedBy,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // Without a value the browser picks the first enabled option, so start on
  // the placeholder explicitly. A controlled select keeps its own value.
  const initialValue =
    placeholder !== undefined && defaultValue === undefined ? "" : defaultValue;

  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        <select
          {...props}
          id={selectId}
          {...(value === undefined
            ? { defaultValue: initialValue }
            : { value: value })}
          className={cn(
            controlClasses(Boolean(error)),
            "appearance-none pr-10",
            // Placeholder shown: muted text, options keep the normal color.
            "[&:has(option[value='']:checked)]:text-fg-muted [&>option]:text-fg",
          )}
          {...fieldAria(selectId, { hint, error }, describedBy)}
        >
          {placeholder !== undefined && (
            // A required select cannot go back to empty; an optional one can.
            <option value="" disabled={props.required}>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
          strokeWidth={1.75}
        />
      </div>
    </Field>
  );
}
