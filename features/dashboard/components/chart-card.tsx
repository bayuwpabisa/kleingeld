import { useId, type ReactNode } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ChartView = "chart" | "table";

/**
 * Height of a chart card's content, the same for the chart, its table and
 * every state (loading, empty, error, offline), so the card never changes
 * size and nothing below it moves.
 */
export const CHART_CONTENT_HEIGHT = "h-72";

// Short, so the button fits next to a long heading's first word on a 320px
// phone ("Pengeluaran per kategori": "Lihat sebagai tabel" stuck out of the
// card by 34px, measured).
const TABLE_LABEL = "Lihat tabel";
const CHART_LABEL = "Lihat grafik";

type ChartCardProps = {
  title: string;
  headingId: string;
  busy: boolean;
  /**
   * The button that swaps the chart for a table ("Lihat tabel"),
   * only when there is data to show. `controls` is the id of the content.
   */
  toggle?: { view: ChartView; onToggle: () => void; controls: string };
  /**
   * While loading, keep the button's room with an unseen copy of it: on a
   * narrow phone the heading wraps next to the button, and without the copy
   * the card would grow by a line when the data arrives.
   */
  reserveToggle?: boolean;
  children: ReactNode;
};

/**
 * A dashboard chart card (DESIGN.md, Grafik): the title, the table button
 * on the same row, then the content. The button's label says what it shows
 * next; it is not a pressed/unpressed toggle, so it has no `aria-pressed`.
 */
export function ChartCard({
  title,
  headingId,
  busy,
  toggle,
  reserveToggle = false,
  children,
}: ChartCardProps) {
  return (
    <Card
      as="section"
      aria-labelledby={headingId}
      aria-busy={busy}
      className="flex min-w-0 flex-col gap-4"
    >
      {/* At least the button's height, so the row stays the same without it. */}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
        {toggle ? (
          <Button
            variant="quiet-primary"
            size="sm"
            aria-controls={toggle.controls}
            onClick={toggle.onToggle}
          >
            {toggle.view === "chart" ? TABLE_LABEL : CHART_LABEL}
          </Button>
        ) : (
          reserveToggle && (
            <span
              aria-hidden
              className={cn(
                buttonClasses({ variant: "quiet-primary", size: "sm" }),
                "invisible",
              )}
            >
              {TABLE_LABEL}
            </span>
          )
        )}
      </div>
      {children}
    </Card>
  );
}

/**
 * A chart's numbers as a table ("Lihat tabel"), named by its
 * caption. The rows fit a 320px phone; only very long amounts scroll
 * sideways. A scrolling box takes focus, so the arrow keys can move it
 * (axe: scrollable-region-focusable), and is named after the table it holds.
 * `children` are the table's `<thead>` and `<tbody>`.
 */
export function ChartTable({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  const captionId = useId();
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className="h-full overflow-auto"
    >
      <table className="w-full text-sm">
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}
