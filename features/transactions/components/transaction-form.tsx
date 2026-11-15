"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form";
import type { z } from "zod";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInJakarta } from "@/lib/date";
import type { CategoryDto } from "@/schemas/category";
import {
  transactionInputSchema,
  type TransactionDto,
  type TransactionInput,
  type TransactionType,
} from "@/schemas/transaction";

// What the fields hold (the amount can be empty) versus what Zod returns.
type FormValues = z.input<typeof transactionInputSchema>;

const TYPE_OPTIONS = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

// The fields that can be wrong, top to bottom as they appear.
const FIELD_ORDER = ["amount", "categoryId", "date", "note"] as const;

type TransactionFormProps = {
  categories: CategoryDto[];
  /** The transaction to edit; without it the form adds a new one. */
  transaction?: TransactionDto;
  onSubmit: (values: TransactionInput) => void;
  /** "Batal", shown in the dialog. Pages go back with their own link. */
  onCancel?: () => void;
  /** "Hapus transaksi", shown when editing. */
  onDelete?: () => void;
};

function defaultValues(
  transaction?: TransactionDto,
): DefaultValues<FormValues> {
  if (!transaction) {
    // No amount yet: the field starts empty.
    return {
      type: "expense",
      categoryId: "",
      date: todayInJakarta(),
      note: "",
    };
  }
  return {
    type: transaction.type,
    categoryId: transaction.category.id,
    amount: transaction.amount,
    date: transaction.date,
    note: transaction.note ?? "",
  };
}

/**
 * Add or edit one transaction (wireframe 07), validated with the same Zod
 * schema as the API. Errors show on submit, under each field, and focus
 * moves to the first one; after that each field rechecks as it changes.
 * Used by the desktop dialog and the phone pages.
 */
export function TransactionForm({
  categories,
  transaction,
  onSubmit,
  onCancel,
  onDelete,
}: TransactionFormProps) {
  const editing = transaction !== undefined;
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<FormValues, unknown, TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: defaultValues(transaction),
    mode: "onSubmit",
    reValidateMode: "onChange",
    // RHF would focus in registration order, where the Controller of the
    // amount comes after the plain fields; focus in visual order instead.
    shouldFocusError: false,
  });

  const type = useWatch({ control, name: "type" });
  const choices = categories.filter((category) => category.type === type);

  function changeType(next: TransactionType) {
    setValue("type", next);
    const current = categories.find((c) => c.id === getValues("categoryId"));
    if (current && current.type !== next) setValue("categoryId", "");
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(
        (values) => onSubmit(values),
        (invalid) => {
          const first = FIELD_ORDER.find((name) => invalid[name]);
          if (first) setFocus(first);
        },
      )}
      className="flex flex-col gap-5"
    >
      <SegmentedControl
        legend="Jenis transaksi"
        hideLegend
        name="type"
        options={TYPE_OPTIONS}
        value={type}
        onChange={changeType}
      />

      <Controller
        control={control}
        name="amount"
        // An emptied amount is NaN here, not undefined: for undefined,
        // React Hook Form shows the default value again, so the amount of
        // an edited transaction could never be cleared. Zod rejects NaN with
        // "Isi nominal" (schemas/transaction.ts).
        render={({ field }) => (
          <AmountInput
            ref={field.ref}
            name={field.name}
            value={Number.isNaN(field.value) ? undefined : field.value}
            onChange={(value) => field.onChange(value ?? Number.NaN)}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Select
          label="Kategori"
          placeholder="Pilih kategori"
          required
          error={errors.categoryId?.message}
          {...register("categoryId")}
        >
          {choices.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          label="Tanggal"
          required
          error={errors.date?.message}
          {...register("date")}
        />
      </div>

      <Textarea
        label="Catatan (opsional)"
        rows={3}
        error={errors.note?.message}
        {...register("note")}
      />

      {/* DOM order follows the desktop row (Hapus · Batal · Simpan); phones
          stack it reversed so Simpan is on top, like DialogActions. */}
      <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center">
        {editing && onDelete && (
          <Button
            type="button"
            variant="quiet-danger"
            onClick={onDelete}
            className="lg:mr-auto"
          >
            Hapus transaksi
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className={editing && onDelete ? undefined : "lg:ml-auto"}
          >
            Batal
          </Button>
        )}
        <Button
          type="submit"
          className={
            onCancel || (editing && onDelete) ? undefined : "lg:ml-auto"
          }
        >
          {editing ? "Simpan perubahan" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
