"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

export type PageItem = number | "gap";

/**
 * The page numbers to show: all of them up to 7 pages; otherwise the first,
 * the last and the current one with its neighbours, with "gap" for the
 * pages in between. Always 7 items, so the bar keeps its width.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", pageCount];
  if (page >= pageCount - 3) {
    return [
      1,
      "gap",
      ...Array.from({ length: 5 }, (_, i) => pageCount - 4 + i),
    ];
  }
  return [1, "gap", page - 1, page, page + 1, "gap", pageCount];
}

const item =
  "inline-flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors";
const idle =
  "border border-border text-fg not-disabled:hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * ‹ 1 … 4 5 6 … 9 › under the desktop table (DESIGN.md: size sm, 32px).
 * Hidden when everything fits on one page.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Halaman" className={className}>
      <ul className="flex items-center gap-1.5">
        <li>
          <button
            type="button"
            className={cn(item, idle)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </li>
        {pageItems(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className={cn(item, "text-fg-muted")}
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={cn(
                  item,
                  entry === page
                    ? "bg-primary font-medium text-on-primary"
                    : idle,
                )}
                aria-label={`Halaman ${entry}`}
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={cn(item, idle)}
            disabled={page >= pageCount}
            aria-label="Halaman berikutnya"
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
