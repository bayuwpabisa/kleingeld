"use client";

import { PiggyBank, TriangleAlert, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { summaryFrameClasses, SummaryItem } from "@/components/summary-item";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { balanceSize } from "@/features/dashboard/balance-size";
import { summaryLayout } from "@/features/transactions/summary-layout";
import { cn } from "@/lib/cn";
import type { BudgetStatus } from "@/schemas/budget";

import { useBudgets } from "../api/use-budgets";
import {
  attentionMessage,
  budgetLevel,
  budgetPercent,
  budgetTotals,
  daysLeftLabel,
  monthOf,
} from "../budget-status";
import { BudgetDialogs } from "./budget-dialogs";
import { CreateBudgetButton, useBudgetEditor } from "./budget-editor";
import { budgetBorderClasses, BudgetUsage } from "./budget-meter";

/** How many cards the skeleton shows before the budgets are known. */
const SKELETON_CARDS = 3;

/**
 * The Budget page's content for the month of `today` (wireframe 05): the
 * totals, a banner naming the budgets at 80% or more, and a card per budget,
 * which opens its "Atur budget" dialog. The page hands the server's budgets
 * to the query cache, so they show at once; they load again after any
 * budget or transaction change. Needs a BudgetEditorProvider above it.
 */
export function Budgets({ today }: { today: string }) {
  return (
    <>
      <BudgetsContent today={today} />
      <BudgetDialogs today={today} />
    </>
  );
}

function BudgetsContent({ today }: { today: string }) {
  const { data, isError, isFetching, fetchStatus, refetch } = useBudgets(
    monthOf(today),
  );

  if (data) {
    if (data.length === 0) {
      return (
        <EmptyState
          icon={PiggyBank}
          message="Belum ada budget. Atur batas per kategori supaya pengeluaran tetap terkontrol."
          action={<CreateBudgetButton />}
        />
      );
    }
    const attention = attentionMessage(data);
    return (
      <>
        <BudgetSummary budgets={data} today={today} busy={isFetching} />
        {attention && (
          <div className="flex items-start gap-3 rounded-xl border border-warning-fill bg-warning-soft p-4">
            <TriangleAlert
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-warning"
              strokeWidth={1.75}
            />
            <p>{attention}</p>
          </div>
        )}
        <BudgetList busy={isFetching}>
          {data.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </BudgetList>
      </>
    );
  }
  if (isError) {
    return (
      <ErrorState
        message="Budget gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }
  if (fetchStatus === "paused") {
    // TanStack Query waits for the connection instead of failing.
    return (
      <EmptyState
        icon={WifiOff}
        message="Kamu sedang offline. Budget dimuat otomatis saat koneksi kembali."
      />
    );
  }
  return <BudgetsSkeleton />;
}

/** The same summary and cards while the budgets load. */
export function BudgetsSkeleton() {
  return (
    <>
      <BudgetSummary budgets={undefined} today="" busy />
      <BudgetList busy>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </BudgetList>
    </>
  );
}

/**
 * Total budget, Terpakai and Sisa: one filled card on phones (wireframe
 * mobile 05), three cards from lg, in one DOM like the dashboard's summary.
 */
function BudgetSummary({
  budgets,
  today,
  busy,
}: {
  budgets: BudgetStatus[] | undefined;
  today: string;
  busy: boolean;
}) {
  const totals = budgets && budgetTotals(budgets);
  // Sisa is never longer than the larger of the two, so all share one size.
  const largest = totals ? Math.max(totals.amount, totals.spent) : 0;
  const layout = summaryLayout(largest);

  return (
    <section
      aria-labelledby="ringkasan-budget"
      aria-busy={busy}
      className={cn(layout.grid, summaryFrameClasses)}
    >
      <h2 id="ringkasan-budget" className="sr-only">
        Ringkasan budget
      </h2>
      <SummaryItem
        label={
          <>
            Total budget<span className="lg:hidden"> bulan ini</span>
          </>
        }
        amount={totals?.amount}
        amountClass={cn("h-9 lg:h-8", balanceSize(largest))}
        note={budgets && `${budgets.length} kategori`}
        className="col-span-full lg:col-span-1"
      />
      <SummaryItem
        label="Terpakai"
        amount={totals?.spent}
        amountClass={cn("h-7 lg:h-8", layout.amount)}
        note={
          totals && `${budgetPercent(totals.spent, totals.amount)}% dari total`
        }
      />
      <SummaryItem
        label="Sisa"
        amount={totals?.left}
        amountClass={cn("h-7 lg:h-8", layout.amount)}
        note={
          totals &&
          (totals.left < 0 ? "melewati total budget" : daysLeftLabel(today))
        }
      />
    </section>
  );
}

function BudgetList({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  // One column on phones, two from 640px, three from 1280px. Both counts use
  // arbitrary breakpoints, so neither is outranked by a named one (AGENTS.md).
  return (
    <section aria-labelledby="budget-per-kategori" aria-busy={busy}>
      <h2 id="budget-per-kategori" className="sr-only">
        Budget per kategori
      </h2>
      <ul
        aria-labelledby="budget-per-kategori"
        className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2 min-[1280px]:grid-cols-3 lg:gap-4"
      >
        {children}
      </ul>
    </section>
  );
}

const cardClasses =
  "flex min-w-0 flex-col gap-3 rounded-xl border bg-surface p-4";

/**
 * One budget: name and status, the meter, then "Rp… dari Rp…". A button
 * ("Atur budget Makan") lies over the whole card, so a tap anywhere opens the
 * dialog, the focus ring outlines the card, and its tooltip gives the whole
 * name. It sits beside the content,
 * not around it, so the heading and meter are still read on their own.
 */
function BudgetCard({ budget }: { budget: BudgetStatus }) {
  const { openEdit } = useBudgetEditor();
  const { spent, amount, category } = budget;
  const nameId = `budget-${budget.id}`;
  return (
    <li
      className={cn(
        cardClasses,
        "group relative",
        budgetBorderClasses[budgetLevel(spent, amount)],
      )}
    >
      <BudgetUsage
        name={
          <h3
            id={nameId}
            className="min-w-0 truncate font-medium group-hover:underline"
          >
            {category.name}
          </h3>
        }
        labelledBy={nameId}
        spent={spent}
        amount={amount}
      />
      <button
        type="button"
        aria-label={`Atur budget ${category.name}`}
        title={`Atur budget ${category.name}`}
        onClick={() => openEdit(budget)}
        className="absolute inset-0 rounded-xl"
      />
    </li>
  );
}

/** A card the same height as BudgetCard: 24px name, 8px meter, 20px line. */
function CardSkeleton() {
  return (
    <li aria-hidden className={cn(cardClasses, "border-border")}>
      <div className="flex h-6 items-center justify-between gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <Skeleton className="h-2 rounded-full" />
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </li>
  );
}
