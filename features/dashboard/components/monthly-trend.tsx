"use client";

import { ChartColumn, WifiOff } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyTrend } from "@/features/transactions/api/use-monthly-trend";
import { monthLabel } from "@/features/transactions/periods";
import { cn } from "@/lib/cn";
import type { MonthlyTotal } from "@/schemas/transaction";

import { TREND_MONTHS, trendRange } from "../dashboard-queries";
import {
  isEmptyTrend,
  trendRangeLabel,
  trendRows,
  trendSummary,
} from "../trend-chart-data";
import { CHART_CONTENT_HEIGHT, ChartCard, type ChartView } from "./chart-card";
import { MonthlyTrendChart } from "./monthly-trend-chart";

const HEADING_ID = "tren-bulanan";
const TITLE = "Tren bulanan";

/**
 * "Tren bulanan": income and expense of this month and the five before it
 * (wireframe 03, DESIGN.md › Grafik). The page hands the server's months to
 * the query cache; after any change to a transaction they load again. The
 * chart can be swapped for a table with the same numbers.
 */
export function MonthlyTrend({ today }: { today: string }) {
  const { data, isError, isFetching, fetchStatus, refetch } = useMonthlyTrend(
    trendRange(today),
  );
  // A display choice, like an open filter panel: it may stay while the page
  // is hidden (AGENTS.md › Hidden pages keep their state).
  const [view, setView] = useState<ChartView>("chart");
  const contentId = useId();

  const hasData = data !== undefined && !isEmptyTrend(data);
  const loading = !data && !isError && fetchStatus !== "paused";
  let content: ReactNode;
  if (data) {
    if (!hasData) {
      content = (
        <EmptyState
          bare
          icon={ChartColumn}
          message={`Belum ada transaksi dalam ${TREND_MONTHS} bulan terakhir.`}
        />
      );
    } else if (view === "chart") {
      content = <TrendFigure months={data} />;
    } else {
      content = <TrendTable months={data} />;
    }
  } else if (isError) {
    content = (
      <ErrorState
        bare
        message="Tren bulanan gagal dimuat. Periksa koneksi lalu coba lagi."
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
    content = <TrendSkeleton />;
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

/** The same card while the months load, for the page's Suspense fallback. */
export function MonthlyTrendSkeleton() {
  return (
    <ChartCard title={TITLE} headingId={HEADING_ID} busy reserveToggle>
      <div className={CHART_CONTENT_HEIGHT}>
        <TrendSkeleton />
      </div>
    </ChartCard>
  );
}

function TrendFigure({ months }: { months: MonthlyTotal[] }) {
  const captionId = useId();
  return (
    // Browsers name a figure after its figcaption; said explicitly so every
    // screen reader (and jsdom) gets the same name.
    <figure aria-labelledby={captionId} className="flex h-full flex-col gap-3">
      {/* The chart in words; the table has every number. */}
      <figcaption id={captionId} className="sr-only">
        {trendSummary(months)}
      </figcaption>
      <TrendLegend />
      <div className="min-h-0 flex-1">
        <MonthlyTrendChart rows={trendRows(months)} />
      </div>
    </figure>
  );
}

/** Two series, so a legend (DESIGN.md › Grafik). The caption says it all. */
function TrendLegend() {
  return (
    <ul
      aria-hidden
      className="flex h-5 items-center gap-4 text-sm text-fg-muted"
    >
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-chart-income" />
        Pemasukan
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-chart-expense" />
        Pengeluaran
      </li>
    </ul>
  );
}

function TrendTable({ months }: { months: MonthlyTotal[] }) {
  const rows = trendRows(months);
  const captionId = useId();
  return (
    // The chart's two series, month by month. They fit a 320px phone; only
    // very long amounts scroll sideways. A scrolling box takes focus, so the
    // arrow keys can move it (axe: scrollable-region-focusable), and is
    // named after the table it holds.
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className="h-full overflow-auto"
    >
      <table className="w-full text-sm">
        <caption id={captionId} className="sr-only">
          Pemasukan dan pengeluaran per bulan, {trendRangeLabel(months)}
        </caption>
        <thead>
          <tr className="text-fg-muted">
            <th scope="col" className="h-10 pr-2 text-left font-medium">
              Bulan
            </th>
            <th scope="col" className="px-2 text-right font-medium">
              Pemasukan
            </th>
            <th scope="col" className="pl-2 text-right font-medium">
              Pengeluaran
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-t border-border">
              <th scope="row" className="h-10 pr-2 text-left font-normal">
                <span aria-hidden>{row.label}</span>
                <span className="sr-only">{monthLabel(row.month)}</span>
              </th>
              <td className="px-2 text-right">
                <Money amount={row.income} />
              </td>
              <td className="pl-2 text-right">
                <Money amount={row.expense} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The legend's row, then a block where the bars will be. */
function TrendSkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-3">
      <div className="flex h-5 items-center gap-4">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <Skeleton className="min-h-0 flex-1 rounded-lg" />
    </div>
  );
}
