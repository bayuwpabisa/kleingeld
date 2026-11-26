"use client";

import {
  Bar,
  BarChart,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  type LabelProps,
  type TooltipContentProps,
} from "recharts";

import type { KeyboardEvent } from "react";

import { Money } from "@/components/ui/money";

import { fitLabel, type CategoryRow } from "../category-chart-data";

// The Recharts part of "Pengeluaran per kategori", in its own file so the
// page can load it later (dynamic import, task 20 Nov). Ranked horizontal
// bars in one color (DESIGN.md, Grafik): the name above each bar, its short
// amount at the end. Sized by a class, not `style`, for the reason in
// monthly-trend-chart.tsx.

/** Height of one category: its name and its bar. Six fit the card. */
export const CATEGORY_ROW_HEIGHT = 47;
const TOP_MARGIN = 4;
const BAR_SIZE = 14;
/** From the name's baseline down to its bar. */
const NAME_GAP = 5;
/** Room after the longest bar for its amount ("1000 T" at 12px). */
const VALUE_ROOM = 56;
/** About how wide a 14px Geist character is, to cut long names. */
const NAME_CHAR_WIDTH = 7.5;

const VALUE_LABEL = { fill: "var(--fg)", fontSize: 12, fontWeight: 500 };

/**
 * The bars run top to bottom, so the up and down arrows move between them.
 * Recharts' keyboard layer reads only left and right, and turns them around
 * unless the chart runs left to right (keyboardEventsMiddleware.js, with
 * selectChartDirection in axisSelectors.js): here left is the next bar down
 * and right the one up (checked in the browser). Down and up are passed on
 * as those keys, and do not scroll the page while the chart has focus.
 */
const RECHARTS_KEY: Partial<Record<string, "ArrowLeft" | "ArrowRight">> = {
  ArrowDown: "ArrowLeft",
  ArrowUp: "ArrowRight",
};

function passVerticalArrows(event: KeyboardEvent<HTMLDivElement>) {
  const key = RECHARTS_KEY[event.key];
  if (!key) return;
  event.preventDefault();
  event.target.dispatchEvent(
    new globalThis.KeyboardEvent("keydown", { key, bubbles: true }),
  );
}

export function CategoryBreakdownChart({ rows }: { rows: CategoryRow[] }) {
  return (
    // As tall as its rows, so a month with two categories keeps them at the
    // top instead of spreading two bars over the card. Keys come from the
    // chart inside, which takes focus (Recharts' accessibility layer).
    <div
      style={{ height: rows.length * CATEGORY_ROW_HEIGHT + TOP_MARGIN }}
      onKeyDown={passVerticalArrows}
    >
      <BarChart
        data={rows}
        layout="vertical"
        responsive
        className="h-full w-full"
        title="Grafik pengeluaran per kategori. Tekan panah bawah atau atas untuk membaca tiap kategori, dari yang terbesar."
        margin={{ top: TOP_MARGIN, right: VALUE_ROOM, bottom: 0, left: 0 }}
        barSize={BAR_SIZE}
      >
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="key" hide />
        <Tooltip
          cursor={{ fill: "var(--surface-muted)" }}
          isAnimationActive={false}
          content={(props) => <CategoryTooltip {...props} rows={rows} />}
        />
        <Bar
          dataKey="total"
          name="Pengeluaran"
          fill="var(--chart-expense)"
          radius={[0, 4, 4, 0]}
          // A small category stays visible next to a large one.
          minPointSize={2}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="label"
            content={(props) => <CategoryName {...props} />}
          />
          <LabelList dataKey="valueLabel" position="right" {...VALUE_LABEL} />
        </Bar>
      </BarChart>
    </div>
  );
}

/**
 * The category's name just above its bar, from the left edge, cut with "…"
 * when wider than the chart.
 */
function CategoryName({ viewBox, value }: LabelProps) {
  const plot = usePlotArea();
  if (!plot || !viewBox || !("x" in viewBox) || typeof value !== "string") {
    return null;
  }
  const maxChars = Math.floor((plot.width + VALUE_ROOM) / NAME_CHAR_WIDTH);
  return (
    <text x={viewBox.x} y={viewBox.y - NAME_GAP} fill="var(--fg)" fontSize={14}>
      {fitLabel(value, maxChars)}
    </text>
  );
}

type CategoryTooltipProps = Pick<
  TooltipContentProps,
  "active" | "label" | "accessibilityLayer"
> & { rows: CategoryRow[] };

/**
 * The category under the pointer or picked with the arrow keys: its full
 * name, amount, number of transactions and share. With the keyboard layer
 * on it is a polite live region, so each category is read out.
 */
function CategoryTooltip({
  active,
  label,
  accessibilityLayer,
  rows,
}: CategoryTooltipProps) {
  const row = rows.find((r) => r.key === label);
  if (!active || !row) return null;
  return (
    <div
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "polite" : undefined}
      className="max-w-64 rounded-lg border border-border bg-surface p-3 text-sm shadow-overlay"
    >
      <p className="font-medium wrap-break-word">{row.label}</p>
      <p className="mt-1">
        <Money amount={row.total} />
      </p>
      <p className="mt-1 text-fg-muted">
        {row.count} transaksi · {row.shareLabel} bulan ini
      </p>
    </div>
  );
}
