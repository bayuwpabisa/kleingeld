"use client";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/categories/api/use-categories";
import { useCategoryTotals } from "@/features/transactions/api/use-category-totals";
import { monthRange } from "@/features/transactions/periods";
import type { BudgetStatus } from "@/schemas/budget";

import { useBudgets } from "../api/use-budgets";
import { useDeleteBudget } from "../api/use-delete-budget";
import { monthOf } from "../budget-status";
import { useBudgetEditor } from "./budget-editor";
import { BudgetForm, type Spent } from "./budget-form";

/**
 * The Budget page's dialogs, opened through BudgetEditorProvider: "Buat
 * budget" / "Atur budget" (a bottom sheet on phones) and "Hapus budget ini?".
 * Rendered by Budgets, which knows the month of `today`.
 */
export function BudgetDialogs({ today }: { today: string }) {
  const { editor, deleting, close, closeDelete } = useBudgetEditor();
  const remove = useDeleteBudget();

  return (
    <>
      <Dialog
        open={editor.mode !== "closed"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={editor.mode === "edit" ? "Atur budget" : "Buat budget"}
      >
        {/* Mounted only while open, so every opening starts a fresh form. */}
        {editor.mode === "create" && <CreateBudget today={today} />}
        {editor.mode === "edit" && (
          <EditBudget key={editor.budget.id} budget={editor.budget} />
        )}
      </Dialog>

      <DeleteBudgetDialog
        budget={deleting}
        busy={remove.isPending}
        onClose={closeDelete}
        onConfirm={(budget) =>
          // The toast (with Urungkan, or why it failed) comes from the hook.
          remove.mutate(budget, { onSettled: closeDelete })
        }
      />
    </>
  );
}

/** A new budget: the user's expense categories, minus those with a budget. */
function CreateBudget({ today }: { today: string }) {
  const { close } = useBudgetEditor();
  const month = monthOf(today);
  const categories = useCategories();
  const budgets = useBudgets(month);
  // The dashboard's "Pengeluaran per kategori" asks the same, so they share it.
  const totals = useCategoryTotals({ type: "expense", ...monthRange(month) });

  if (categories.data && budgets.data) {
    const taken = new Set(budgets.data.map((budget) => budget.category.id));
    const spentOf = (categoryId: string): Spent => {
      if (totals.data) {
        const row = totals.data.find((t) => t.category.id === categoryId);
        return row?.total ?? 0;
      }
      return totals.isError ? "error" : "loading";
    };
    return (
      <BudgetForm
        categories={categories.data.filter((c) => c.type === "expense")}
        taken={taken}
        spentOf={spentOf}
        onSaved={close}
        onCancel={close}
      />
    );
  }
  if (categories.isError || budgets.isError) {
    return (
      <ErrorState
        message="Formulir budget gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => {
          if (categories.isError) categories.refetch();
          if (budgets.isError) budgets.refetch();
        }}
        retrying={categories.isFetching || budgets.isFetching}
      />
    );
  }
  return <BudgetFormSkeleton />;
}

/** A budget's new limit; its spending is already on the page. */
function EditBudget({ budget }: { budget: BudgetStatus }) {
  const { close, requestDelete } = useBudgetEditor();
  return (
    <BudgetForm
      budget={budget}
      categories={[]}
      taken={new Set()}
      spentOf={() => budget.spent}
      onSaved={close}
      onCancel={close}
      onDelete={() => requestDelete(budget)}
    />
  );
}

/** The form's shape while the categories load. */
function BudgetFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <p role="status" className="sr-only">
        Memuat formulir…
      </p>
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-36" />
      <Skeleton className="h-12" />
    </div>
  );
}

/**
 * "Hapus budget ini?" (DESIGN.md › States): the budget, what changes, then
 * Batal and Hapus. Hapus stays busy until the server answers; the toast that
 * follows offers Urungkan.
 */
function DeleteBudgetDialog({
  budget,
  busy,
  onClose,
  onConfirm,
}: {
  budget: BudgetStatus | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (budget: BudgetStatus) => void;
}) {
  return (
    <Dialog
      open={budget !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Hapus budget ini?"
    >
      {budget && (
        <>
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
              <CategoryIcon name={budget.category.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate">{budget.category.name}</p>
              <p className="text-sm text-fg-muted">Batas per bulan</p>
            </div>
            <Money amount={budget.amount} />
          </div>
          <p className="text-fg-muted">
            Transaksi {budget.category.name} tidak ikut terhapus, hanya batas
            dan peringatannya.
          </p>
        </>
      )}
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="danger"
          busy={busy}
          disabled={budget === null}
          onClick={() => {
            if (budget) onConfirm(budget);
          }}
        >
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );
}
