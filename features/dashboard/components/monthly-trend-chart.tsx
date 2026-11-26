"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
  useYAxisScale,
  type LabelProps,
  type TooltipContentProps,
} from "recharts";

import { Money } from "@/components/ui/money";
import { monthLabel } from "@/features/transactions/periods";

import {
  compactRupiah,
  VALUE_LABEL_LINE,
  valueLabelBaselines,
  type TrendRow,
} from "../trend-chart-data";

// The Recharts part of "Tren bulanan", in its own file so the page can load
// it later (dynamic import, task 20 Nov). Colors are the theme's CSS
// variables, so dark mode needs nothing here.
//
// Size: `responsive` measures the box in the browser. The box gets its size
// from a class, not from `style`: Recharts reads a `style` width such as
// "100%" as the number 100 and would draw a 100×100 chart on the server
// (RechartsWrapper's getNumberOrZero). Without it the first size is 0, so
// the server's HTML has the empty box and the bars appear once the page
// runs; the card around it keeps its size.

const AXIS_TICK = { fill: "var(--fg-muted)", fontSize: 12 };
const VALUE_LABEL = { fill: "var(--fg)", fontSize: 12, fontWeight: 500 };

// Room above the plot for this month's value labels, two lines when they
// are stacked (valueLabelBaselines).
const TOP_ROOM = 20 + VALUE_LABEL_LINE;

export function MonthlyTrendChart({ rows }: { rows: TrendRow[] }) {
  const current = rows.at(-1);
  return (
    <BarChart
      data={rows}
      responsive
      className="h-full w-full"
      title="Grafik tren bulanan. Tekan panah kiri atau kanan untuk membaca tiap bulan."
      margin={{ top: TOP_ROOM, right: 4, bottom: 0, left: 0 }}
      barGap={2}
      barCategoryGap="24%"
    >
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={{ stroke: "var(--border)" }}
        tick={AXIS_TICK}
      />
      <YAxis
        width={44}
        tickLine={false}
        axisLine={false}
        tick={AXIS_TICK}
        tickFormatter={(value: number) => compactRupiah(value)}
      />
      <Tooltip
        cursor={{ fill: "var(--surface-muted)" }}
        isAnimationActive={false}
        content={(props) => <TrendTooltip {...props} rows={rows} />}
      />
      <Bar
        dataKey="income"
        name="Pemasukan"
        fill="var(--chart-income)"
        radius={[4, 4, 0, 0]}
        isAnimationActive={false}
      >
        {current && (
          <LabelList
            dataKey="incomeLabel"
            content={(props) => (
              <ValueLabel {...props} series="income" current={current} />
            )}
          />
        )}
      </Bar>
      <Bar
        dataKey="expense"
        name="Pengeluaran"
        fill="var(--chart-expense)"
        radius={[4, 4, 0, 0]}
        isAnimationActive={false}
      >
        {current && (
          <LabelList
            dataKey="expenseLabel"
            content={(props) => (
              <ValueLabel {...props} series="expense" current={current} />
            )}
          />
        )}
      </Bar>
    </BarChart>
  );
}

/**
 * This month's amount above its bar ("8,5 jt"; other months have no label).
 * Placed from both bars' tops, so the two labels never cover each other
 * when income and expense are close (valueLabelBaselines).
 */
function ValueLabel({
  viewBox,
  value,
  series,
  current,
}: LabelProps & { series: "income" | "expense"; current: TrendRow }) {
  const yScale = useYAxisScale();
  if (
    !yScale ||
    !viewBox ||
    !("width" in viewBox) ||
    typeof value !== "string"
  ) {
    return null;
  }
  // A bar of 0 is not drawn, so it has no label to make room for.
  const top = (amount: number) =>
    amount > 0 ? (yScale(amount) ?? null) : null;
  const baseline = valueLabelBaselines({
    income: top(current.income),
    expense: top(current.expense),
  })[series];
  if (baseline === null) return null;
  return (
    <text
      x={viewBox.x + viewBox.width / 2}
      y={baseline}
      textAnchor="middle"
      {...VALUE_LABEL}
    >
      {value}
    </text>
  );
}

type TrendTooltipProps = Pick<
  TooltipContentProps,
  "active" | "label" | "accessibilityLayer"
> & { rows: TrendRow[] };

/**
 * The month under the pointer or picked with the arrow keys, with both
 * amounts in full. With the keyboard layer on it is a polite live region,
 * like Recharts' own tooltip, so the month is read out as it changes.
 */
function TrendTooltip({
  active,
  label,
  accessibilityLayer,
  rows,
}: TrendTooltipProps) {
  const row = rows.find((r) => r.label === label);
  if (!active || !row) return null;
  return (
    <div
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "polite" : undefined}
      className="rounded-lg border border-border bg-surface p-3 text-sm shadow-overlay"
    >
      <p className="font-medium">{monthLabel(row.month)}</p>
      <dl className="mt-2 grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-1">
        <dt className="flex items-center gap-2 text-fg-muted">
          <span aria-hidden className="size-2.5 rounded-sm bg-chart-income" />
          Pemasukan
        </dt>
        <dd className="text-right">
          <Money amount={row.income} />
        </dd>
        <dt className="flex items-center gap-2 text-fg-muted">
          <span aria-hidden className="size-2.5 rounded-sm bg-chart-expense" />
          Pengeluaran
        </dt>
        <dd className="text-right">
          <Money amount={row.expense} />
        </dd>
      </dl>
    </div>
  );
}
