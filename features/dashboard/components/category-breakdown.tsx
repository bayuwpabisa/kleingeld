"use client";

import { ChartBarDecreasing, WifiOff } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryTotals } from "@/features/transactions/api/use-category-totals";
import { monthLabel } from "@/features/transactions/periods";
import { cn } from "@/lib/cn";

import {
  categoryRows,
  categorySummary,
  type CategoryRow,
} from "../category-chart-data";
import { monthCategoriesQuery } from "../dashboard-queries";
import { rankCategories } from "../rank-categories";
import {
  CHART_CONTENT_HEIGHT,
  ChartCard,
  ChartTable,
  type ChartView,
} from "./chart-card";
import {
  CATEGORY_ROW_HEIGHT,
  CategoryBreakdownChart,
} from "./category-breakdown-chart";

const HEADING_ID = "pengeluaran-per-kategori";
const TITLE = "Pengeluaran per kategori";

/**
 * "Pengeluaran per kategori": this month's expense, the largest five
 * categories and then "Lainnya" (DESIGN.md, Grafik). The page hands the
 * server's totals to the query cache; after any change to a transaction
 * they load again. The chart can be swapped for a table with the same rows.
 */
export function CategoryBreakdown({ today }: { today: string }) {
  const { data, isError, isFetching, fetchStatus, refetch } = useCategoryTotals(
    monthCategoriesQuery(today),
  );
  // A display choice, like an open filter panel: it may stay while the page
  // is hidden (AGENTS.md, Hidden pages keep their state).
  const [view, setView] = useState<ChartView>("chart");
  const contentId = useId();
  const month = today.slice(0, 7);

  const hasData = data !== undefined && data.length > 0;
  const loading = !data && !isError && fetchStatus !== "paused";
  let content: ReactNode;
  if (data) {
    const rows = categoryRows(rankCategories(data));
    if (!hasData) {
      content = (
        <EmptyState
          bare
          icon={ChartBarDecreasing}
          message="Belum ada pengeluaran bulan ini."
        />
      );
    } else if (view === "chart") {
      content = <CategoryFigure rows={rows} month={month} />;
    } else {
      content = <CategoryTable rows={rows} month={month} />;
    }
  } else if (isError) {
    content = (
      <ErrorState
        bare
        message="Pengeluaran per kategori gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  } else if (fetchStatus === "paused") {
    content = (
      <EmptyState
        bare
        icon={WifiOff}
        message="Kamu sedang offline. Grafik dimuat otomatis saat koneksi kembali."
      />
    );
  } else {
    content = <CategorySkeleton />;
  }

  return (
    <ChartCard
      title={TITLE}
      headingId={HEADING_ID}
      busy={isFetching}
      toggle={
        hasData
          ? {
              view,
              controls: contentId,
              onToggle: () =>
                setView((current) => (current === "chart" ? "table" : "chart")),
            }
          : undefined
      }
      reserveToggle={loading}
    >
      <div
        id={contentId}
        className={cn(CHART_CONTENT_HEIGHT, "flex flex-col justify-center")}
      >
        {content}
      </div>
    </ChartCard>
  );
}

/** The same card while the totals load, for the page's Suspense fallback. */
export function CategoryBreakdownSkeleton() {
  return (
    <ChartCard title={TITLE} headingId={HEADING_ID} busy reserveToggle>
      <div className={CHART_CONTENT_HEIGHT}>
        <CategorySkeleton />
      </div>
    </ChartCard>
  );
}

type RowsProps = { rows: CategoryRow[]; month: string };

function CategoryFigure({ rows, month }: RowsProps) {
  const captionId = useId();
  return (
    // Named explicitly, like the trend's figure (jsdom and every screen
    // reader get the same name). The bars start at the top of the card.
    <figure aria-labelledby={captionId} className="h-full">
      <figcaption id={captionId} className="sr-only">
        {categorySummary(rows, month)}
      </figcaption>
      <CategoryBreakdownChart rows={rows} />
    </figure>
  );
}

/** The chart's rows, with each one's part of the month. */
function CategoryTable({ rows, month }: RowsProps) {
  return (
    <ChartTable caption={`${TITLE}, ${monthLabel(month)}`}>
      <thead>
        <tr className="text-fg-muted">
          <th scope="col" className="h-10 pr-2 text-left font-medium">
            Kategori
          </th>
          <th scope="col" className="px-2 text-right font-medium">
            Nominal
          </th>
          <th scope="col" className="pl-2 text-right font-medium">
            Porsi
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-border">
            <th
              scope="row"
              className="h-10 pr-2 text-left font-normal wrap-break-word"
            >
              {row.label}
            </th>
            <td className="px-2 text-right">
              <Money amount={row.total} />
            </td>
            <td className="pl-2 text-right tabular-nums">{row.shareLabel}</td>
          </tr>
        ))}
      </tbody>
    </ChartTable>
  );
}

const SKELETON_BARS = ["w-4/5", "w-2/5", "w-1/4", "w-1/5", "w-1/6", "w-1/6"];

/** Six names with their bars, where the chart will draw them. */
function CategorySkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col pt-1">
      {SKELETON_BARS.map((width, index) => (
        <div
          key={index}
          style={{ height: CATEGORY_ROW_HEIGHT }}
          className="flex flex-col justify-center gap-1.5 pt-1"
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className={cn("h-4 rounded-sm", width)} />
        </div>
      ))}
    </div>
  );
}
