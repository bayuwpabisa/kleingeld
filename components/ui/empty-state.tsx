import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "./card";

type EmptyStateProps = {
  icon: LucideIcon;
  /** One sentence: what this place is for, or why it is empty. */
  message: string;
  /** The next step, usually one primary button or link. */
  action?: ReactNode;
  /** Without its own card, inside a card that already has a frame. */
  bare?: boolean;
};

/** First use, nothing found, or waiting (DESIGN.md, States). */
export function EmptyState({
  icon: Icon,
  message,
  action,
  bare = false,
}: EmptyStateProps) {
  const content = (
    <>
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
        <Icon aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <p className="max-w-prose text-fg-muted">{message}</p>
      {action}
    </>
  );
  return bare ? (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {content}
    </div>
  ) : (
    <Card className="flex flex-col items-center gap-4 py-12 text-center lg:py-16">
      {content}
    </Card>
  );
}
