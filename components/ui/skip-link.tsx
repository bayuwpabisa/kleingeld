/**
 * First Tab stop on the page: jumps past the navigation to the main content.
 * Hidden until focused. The target needs `tabIndex={-1}` to take focus.
 */
export function SkipLink({ href = "#konten" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only rounded-lg bg-surface px-4 py-2 font-medium text-fg shadow-overlay focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Lewati ke konten
    </a>
  );
}
