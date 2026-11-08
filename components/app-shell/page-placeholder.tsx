import { Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Stand-in body for a section whose feature is not built yet. */
export function PagePlaceholder({ children }: { children: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center lg:py-16">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
        <Hammer aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <p className="max-w-prose text-fg-muted">{children}</p>
    </Card>
  );
}
