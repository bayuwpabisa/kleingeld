import { formatRupiah } from "../_lib/format-rupiah";

type BudgetMeterProps = {
  category: string;
  limit: number;
  spent: number;
};

type BudgetStatus = "safe" | "warning" | "over";

const STATUS_LABEL: Record<BudgetStatus, string> = {
  safe: "Aman",
  warning: "Hampir habis",
  over: "Lewat batas",
};

const STATUS_TEXT_COLOR: Record<BudgetStatus, string> = {
  safe: "text-green-700",
  warning: "text-yellow-800",
  over: "text-red-700",
}

const STATUS_BAR_COLOR: Record<BudgetStatus, string> = {
  safe: "bg-green-700",
  warning: "bg-yellow-500",
  over: "bg-red-700",
};

function getStatus(percentage: number): BudgetStatus {
  if (percentage > 100) return "over";
  if (percentage >= 80) return "warning";
  return "safe";
}

export function BudgetMeter({ category, limit, spent }: BudgetMeterProps) {
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const status = getStatus(percentage);
  const barWidth = Math.min(percentage, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">{category}</span>
        <span>
          {formatRupiah(spent)} / {formatRupiah(limit)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Budget ${category}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={barWidth}
        aria-valuetext={`${percentage}% terpakai, ${STATUS_LABEL[status]}`}
        className="h-2 w-full overflow-hidden rounded bg-zinc-200"
      >
        <div
          className={`h-full ${STATUS_BAR_COLOR[status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className={`text-sm ${STATUS_TEXT_COLOR[status]}`}>
        {percentage}% terpakai · {STATUS_LABEL[status]}
      </p>
    </div>
  );
}
