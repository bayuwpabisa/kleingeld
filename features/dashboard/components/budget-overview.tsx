"use client";

import { PiggyBank, WifiOff } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useBudgets } from "@/features/budgets/api/use-budgets";
import {
  budgetLevel,
  byUrgency,
  monthOf,
} from "@/features/budgets/budget-status";
import {
  budgetBorderClasses,
  budgetCardClasses,
  BudgetUsage,
} from "@/features/budgets/components/budget-meter";
import { BudgetCardSkeleton } from "@/features/budgets/components/budgets";
import { cn } from "@/lib/cn";
import type { BudgetStatus } from "@/schemas/budget";

// Unique on the whole document: the Budget page, hidden by <Activity> once
// left, keeps its own ids in the DOM next to the dashboard.
const HEADING_ID = "budget-dashboard";

/** How many budgets the card shows; "Lihat semua" leads to the rest. */
const SHOWN = 3;

/**
 * "Budget" on the dashboard (wireframe 03): the three budgets that need
 * attention most (over the limit, then almost used up, then the highest
 * share), with the same cards as the Budget page. The page hands the
 * server's budgets to the query cache under the Budget page's key, so they
 * show at once and load again after any budget or transaction change.
 */
export function BudgetOverview({ today }: { today: string }) {
  const { data, isError, isFetching, fetchStatus, refetch } = useBudgets(
    monthOf(today),
  );

  let content: ReactNode;
  if (data) {
    content =
      data.length === 0 ? (
        <EmptyState
          bare
          icon={PiggyBank}
          message="Belum ada budget."
          action={
            <Link href="/budgets" className={buttonClasses()}>
              Atur budget
            </Link>
          }
        />
      ) : (
        <BudgetItems>
          {byUrgency(data)
            .slice(0, SHOWN)
            .map((budget) => (
              <BudgetItem key={budget.id} budget={budget} />
            ))}
        </BudgetItems>
      );
  } else if (isError) {
    content = (
      <ErrorState
        bare
        message="Budget gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  } else if (fetchStatus === "paused") {
    // TanStack Query waits for the connection instead of failing.
    content = (
      <EmptyState
        bare
        icon={WifiOff}
        message="Kamu sedang offline. Budget dimuat otomatis saat koneksi kembali."
      />
    );
  } else {
    content = <ItemsSkeleton />;
  }

  return <BudgetOverviewFrame busy={isFetching}>{content}</BudgetOverviewFrame>;
}

/** The same card while the budgets load, for the page's Suspense fallback. */
export function BudgetOverviewSkeleton() {
  return (
    <BudgetOverviewFrame busy>
      <ItemsSkeleton />
    </BudgetOverviewFrame>
  );
}

function BudgetOverviewFrame({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <Card
      as="section"
      aria-labelledby={HEADING_ID}
      aria-busy={busy}
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={HEADING_ID} className="text-xl font-semibold">
          Budget
        </h2>
        <Link
          href="/budgets"
          className={buttonClasses({ variant: "quiet-primary", size: "sm" })}
        >
          Lihat semua
        </Link>
      </div>
      {children}
    </Card>
  );
}

function BudgetItems({ children }: { children: ReactNode }) {
  return (
    <ul aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      {children}
    </ul>
  );
}

function BudgetItem({ budget }: { budget: BudgetStatus }) {
  const { spent, amount, category } = budget;
  const nameId = `${HEADING_ID}-${budget.id}`;
  return (
    <li
      className={cn(
        budgetCardClasses,
        budgetBorderClasses[budgetLevel(spent, amount)],
      )}
    >
      <BudgetUsage
        name={
          <h3
            id={nameId}
            title={category.name}
            className="min-w-0 truncate font-medium"
          >
            {category.name}
          </h3>
        }
        labelledBy={nameId}
        spent={spent}
        amount={amount}
      />
    </li>
  );
}

function ItemsSkeleton() {
  return (
    <ul aria-hidden className="flex flex-col gap-3">
      {Array.from({ length: SHOWN }, (_, index) => (
        <BudgetCardSkeleton key={index} />
      ))}
    </ul>
  );
}
