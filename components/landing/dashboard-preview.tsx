const rupiah = new Intl.NumberFormat("id-ID");

const summary = [
  { label: "Saldo", amount: 3_250_000 },
  { label: "Pemasukan", amount: 8_500_000 },
  { label: "Pengeluaran", amount: 5_250_000 },
];

// Income and expense per month, as a share of the tallest bar.
const months = [
  { month: "Jun", income: 78, expense: 64 },
  { month: "Jul", income: 80, expense: 71 },
  { month: "Agu", income: 78, expense: 58 },
  { month: "Sep", income: 92, expense: 66 },
  { month: "Okt", income: 85, expense: 70 },
  { month: "Nov", income: 100, expense: 62 },
];

/**
 * A small drawing of the dashboard for the landing hero, made from the same
 * tokens as the app. It stands in until a screenshot with demo data exists
 * (DESIGN.md, Ikon dan gambar). Screen readers get one label, not the numbers.
 */
export function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Pratinjau dashboard Kleingeld: saldo, pemasukan, pengeluaran, dan tren enam bulan"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-canvas p-4 sm:p-6"
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {summary.map(({ label, amount }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-surface p-3"
          >
            <span className="text-xs text-fg-muted">{label}</span>
            <span className="truncate text-sm font-semibold tabular-nums sm:text-lg">
              <span className="text-[0.6em] font-medium text-fg-muted">
                Rp{" "}
              </span>
              {rupiah.format(amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span className="text-sm font-semibold text-fg">Tren bulanan</span>
          <span className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-chart-income" />
              Pemasukan
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-chart-expense" />
              Pengeluaran
            </span>
          </span>
        </div>
        <div className="flex h-28 items-end justify-between gap-2 border-b border-border sm:h-36">
          {months.map(({ month, income, expense }) => (
            <div key={month} className="flex h-full flex-1 items-end gap-0.5">
              <span
                className="flex-1 rounded-t-sm bg-chart-income"
                style={{ height: `${income}%` }}
              />
              <span
                className="flex-1 rounded-t-sm bg-chart-expense"
                style={{ height: `${expense}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 text-xs text-fg-muted">
          {months.map(({ month }) => (
            <span key={month} className="flex-1 text-center">
              {month}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-warning-fill bg-surface p-3 sm:p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Makan</span>
          <span className="text-xs text-warning">85% · hampir habis</span>
        </div>
        <div className="h-2 rounded-full bg-surface-muted">
          <div className="h-full w-[85%] rounded-full bg-warning-fill" />
        </div>
      </div>
    </div>
  );
}
