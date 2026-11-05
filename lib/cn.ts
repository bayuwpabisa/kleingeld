/**
 * Joins class names and drops falsy values.
 *
 * There is no tailwind-merge, so two classes for the same property
 * (`bg-primary` and `bg-danger`) do not override each other by order.
 * Use a component's `className` for layout (width, margin, grid placement),
 * and change its look through props such as `variant`.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
