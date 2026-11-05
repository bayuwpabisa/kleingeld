import { useId, type ComponentProps } from "react";
import {
  Field,
  controlClasses,
  fieldAria,
  type FieldOwnProps,
} from "@/components/ui/field";

type InputProps = Omit<ComponentProps<"input">, "size"> & FieldOwnProps;

/**
 * Text input with a visible label, optional hint and error message.
 * `className` goes to the wrapper (layout); `ref` and other props go to `<input>`,
 * so `{...register("name")}` from React Hook Form works as is.
 */
export function Input({
  id,
  label,
  hint,
  error,
  className,
  "aria-describedby": describedBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        {...props}
        id={inputId}
        className={controlClasses(Boolean(error))}
        {...fieldAria(inputId, { hint, error }, describedBy)}
      />
    </Field>
  );
}
