import { useId, type ComponentProps } from "react";

import {
  Field,
  controlClasses,
  fieldAria,
  type FieldOwnProps,
} from "@/components/ui/field";

type TextareaProps = ComponentProps<"textarea"> & FieldOwnProps;

/**
 * Multi-line text with a visible label, optional hint and error message
 * (DESIGN.md, Input: at least 88px). `className` goes to the wrapper; `ref`
 * and other props go to `<textarea>`, so `{...register("note")}` works.
 */
export function Textarea({
  id,
  label,
  hint,
  error,
  className,
  "aria-describedby": describedBy,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field
      id={textareaId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        {...props}
        id={textareaId}
        className={controlClasses(Boolean(error), "multi")}
        {...fieldAria(textareaId, { hint, error }, describedBy)}
      />
    </Field>
  );
}
