"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Info } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Money } from "@/components/ui/money";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import {
  budgetInputSchema,
  type BudgetInput,
  type BudgetStatus,
} from "@/schemas/budget";
import type { CategoryDto } from "@/schemas/category";
import { amountField } from "@/schemas/transaction";

import { useCreateBudget } from "../api/use-create-budget";
import { useUpdateBudget } from "../api/use-update-budget";
import { budgetLevel } from "../budget-status";
import {
  budgetBorderClasses,
  budgetCardClasses,
  BudgetUsage,
} from "./budget-meter";

// What the fields hold (the amount can be empty) versus what Zod returns.
type FormValues = z.input<typeof budgetInputSchema>;

// The fields that can be wrong, top to bottom as they appear.
const FIELD_ORDER = ["categoryId", "amount"] as const;

/** This month's spending in a category, while it loads, or when it failed. */
export type Spent = number | "loading" | "error";

type BudgetFormProps = {
  /** The budget to change; without it the form adds a new one. */
  budget?: BudgetStatus;
  /** For a new budget: the user's expense categories… */
  categories: CategoryDto[];
  /** …and the ones among them that already have a budget. */
  taken: ReadonlySet<string>;
  /** For the preview under the limit. */
  spentOf: (categoryId: string) => Spent;
  /** The server accepted it; the toast is shown by the mutation. */
  onSaved: () => void;
  onCancel: () => void;
  /** "Hapus budget", shown when changing a budget. */
  onDelete?: () => void;
};

/**
 * Add a monthly limit for a category, or change one (wireframe 10, without
 * "Bulan": a limit holds every month until it is changed). Validated with
 * the API's Zod schema. Not optimistic: Simpan stays busy until the server
 * answers; then the dialog closes, or the form says what went wrong.
 */
export function BudgetForm({
  budget,
  categories,
  taken,
  spentOf,
  onSaved,
  onCancel,
  onDelete,
}: BudgetFormProps) {
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const [failure, setFailure] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<FormValues, unknown, BudgetInput>({
    resolver: zodResolver(budgetInputSchema),
    // Changing a budget keeps its category, so the same schema holds.
    defaultValues: budget
      ? { categoryId: budget.category.id, amount: budget.amount }
      : { categoryId: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    // Focus in visual order (the amount's Controller registers last).
    shouldFocusError: false,
  });

  const categoryId = useWatch({ control, name: "categoryId" });
  const amount = useWatch({ control, name: "amount" });
  // The chosen category stays listed even once it has a budget: after a 409
  // the budgets load again, and the field must still show what was refused.
  const choices = categories.filter(
    ({ id }) => !taken.has(id) || id === categoryId,
  );
  const category = budget
    ? budget.category
    : choices.find((choice) => choice.id === categoryId);
  const saving = create.isPending || update.isPending;

  if (!budget && choices.length === 0) {
    return (
      <p className="text-fg-muted">
        Semua kategori pengeluaran sudah punya budget.
      </p>
    );
  }

  function showFailure(error: unknown) {
    if (error instanceof ApiError && error.status < 500) {
      // A refusal on a field (e.g. 409 "Kategori ini sudah punya budget")
      // goes under that field; anything else above the buttons.
      const wrong = FIELD_ORDER.flatMap((name) => {
        const message = error.fieldErrors[name]?.[0];
        return message ? [{ name, message }] : [];
      });
      for (const { name, message } of wrong) setError(name, { message });
      const first = wrong[0];
      if (first) setFocus(first.name);
      else setFailure(error.formErrors[0] ?? error.message);
      return;
    }
    setFailure("Budget gagal disimpan. Periksa koneksi lalu coba lagi.");
  }

  function save(values: BudgetInput) {
    setFailure(null);
    // On the call, not the hook: they only matter while the form is shown.
    const callbacks = { onSuccess: onSaved, onError: showFailure };
    if (budget) {
      update.mutate(
        { id: budget.id, values: { amount: values.amount } },
        callbacks,
      );
    } else {
      create.mutate(values, callbacks);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(save, (invalid) => {
        const first = FIELD_ORDER.find((name) => invalid[name]);
        if (first) setFocus(first);
      })}
      className="flex flex-col gap-5"
    >
      {budget ? (
        // A new category is a new budget, so it is shown, not chosen.
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-fg">Kategori</p>
          <p className="flex min-w-0 items-center gap-2">
            <CategoryIcon
              name={budget.category.icon}
              className="size-5 shrink-0 text-fg-muted"
            />
            <span className="truncate">{budget.category.name}</span>
          </p>
        </div>
      ) : (
        <Select
          label="Kategori"
          placeholder="Pilih kategori"
          required
          error={errors.categoryId?.message}
          {...register("categoryId")}
        >
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.name}
            </option>
          ))}
        </Select>
      )}

      <Controller
        control={control}
        name="amount"
        // An emptied amount is NaN, not undefined (see TransactionForm).
        render={({ field }) => (
          <AmountInput
            label="Batas per bulan"
            ref={field.ref}
            name={field.name}
            value={Number.isNaN(field.value) ? undefined : field.value}
            onChange={(value) => field.onChange(value ?? Number.NaN)}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      <UsagePreview
        category={category}
        spent={category ? spentOf(category.id) : "loading"}
        amount={amount}
      />

      <p className="flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-sm text-fg-muted">
        <Info
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.75}
        />
        Peringatan muncul saat pemakaian mencapai 80% dan saat melewati batas.
      </p>

      {failure && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-sm text-danger"
        >
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
          />
          {failure}
        </p>
      )}

      {/* DOM order follows the desktop row (Hapus · Batal · Simpan); phones
          stack it reversed so Simpan is on top, like DialogActions. */}
      <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center">
        {onDelete && (
          <Button
            type="button"
            variant="quiet-danger"
            onClick={onDelete}
            disabled={saving}
            className="lg:mr-auto"
          >
            Hapus budget
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className={onDelete ? undefined : "lg:ml-auto"}
        >
          Batal
        </Button>
        <Button type="submit" busy={saving}>
          Simpan budget
        </Button>
      </div>
    </form>
  );
}

// Every state as tall as a full card (110px, the height of the cards on the
// page), so the dialog does not jump when a category or limit is entered.
const previewClasses = cn(budgetCardClasses, "min-h-27.5 justify-center");

/**
 * "Pemakaian bulan ini": the card the budget will have, redrawn as the limit
 * is typed. Without a valid limit it shows only what is spent so far.
 */
function UsagePreview({
  category,
  spent,
  amount,
}: {
  category: { name: string } | undefined;
  spent: Spent;
  amount: number | undefined;
}) {
  const headingId = useId();
  const nameId = useId();
  const limit = amountField.safeParse(amount);

  let content;
  if (!category) {
    content = (
      <p className={cn(previewClasses, "border-border text-sm text-fg-muted")}>
        Pilih kategori untuk melihat pemakaiannya bulan ini.
      </p>
    );
  } else if (spent === "error") {
    content = (
      <p className={cn(previewClasses, "border-border text-sm text-fg-muted")}>
        Pemakaian bulan ini gagal dimuat.
      </p>
    );
  } else {
    const name = (
      <p
        id={nameId}
        title={category.name}
        className="min-w-0 truncate font-medium"
      >
        {category.name}
      </p>
    );
    content =
      spent === "loading" ? (
        <div aria-busy className={cn(previewClasses, "border-border")}>
          {name}
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ) : limit.success ? (
        <div
          className={cn(
            previewClasses,
            budgetBorderClasses[budgetLevel(spent, limit.data)],
          )}
        >
          <BudgetUsage
            name={name}
            labelledBy={nameId}
            spent={spent}
            amount={limit.data}
          />
        </div>
      ) : (
        <div className={cn(previewClasses, "border-border")}>
          {name}
          <p className="text-sm text-fg-muted">
            <Money amount={spent} /> terpakai bulan ini
          </p>
        </div>
      );
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h3 id={headingId} className="text-sm font-medium text-fg">
        Pemakaian bulan ini
      </h3>
      {content}
    </section>
  );
}
