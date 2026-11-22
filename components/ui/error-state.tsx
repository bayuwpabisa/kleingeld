import { CircleAlert } from "lucide-react";

import { Button } from "./button";
import { Card } from "./card";

type ErrorStateProps = {
  /** What failed and what to do, in plain words. */
  message: string;
  onRetry: () => void;
  /** True while the retry runs: the button shows busy and cannot repeat. */
  retrying?: boolean;
  /** Without its own card, inside a card that already has a frame. */
  bare?: boolean;
};

/**
 * A load error in the area that failed, not the whole screen
 * (DESIGN.md, States), with "Coba lagi".
 */
export function ErrorState({
  message,
  onRetry,
  retrying,
  bare = false,
}: ErrorStateProps) {
  const content = (
    <>
      <div role="alert" className="flex flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <CircleAlert aria-hidden className="size-6" strokeWidth={1.75} />
        </span>
        <p className="max-w-prose">{message}</p>
      </div>
      <Button variant="secondary" busy={retrying} onClick={onRetry}>
        Coba lagi
      </Button>
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
