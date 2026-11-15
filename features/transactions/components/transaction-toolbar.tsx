"use client";

import { Search, X } from "lucide-react";
import { useId, useState, type FormEvent, type Ref } from "react";

import { ChipRadioGroup, ChipSelect } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { todayInJakarta } from "@/lib/date";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import type { CategoryDto } from "@/schemas/category";
import {
  MAX_SEARCH_LENGTH,
  type TransactionListQuery,
  type TransactionType,
} from "@/schemas/transaction";

import { DEFAULT_LIST_QUERY } from "../list-query-url";
import { monthRange, periodLabel, periodOf, recentMonths } from "../periods";
import type { useListQuery } from "../use-list-query";

/** How long typing must pause before the search runs. */
export const SEARCH_DELAY_MS = 300;

type ListControls = Pick<
  ReturnType<typeof useListQuery>,
  "setFilters" | "setSort"
>;
type SetFilters = ListControls["setFilters"];

type ToolbarProps = ListControls & {
  query: TransactionListQuery;
  categories: CategoryDto[] | undefined;
  /** The search box, for moving the focus there (after Hapus filter). */
  searchRef?: Ref<HTMLInputElement>;
};

const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
] as const;

const SORT_OPTIONS = [
  { value: "date-desc", sort: "date", order: "desc", label: "Terbaru" },
  { value: "date-asc", sort: "date", order: "asc", label: "Terlama" },
  {
    value: "amount-desc",
    sort: "amount",
    order: "desc",
    label: "Nominal terbesar",
  },
  {
    value: "amount-asc",
    sort: "amount",
    order: "asc",
    label: "Nominal terkecil",
  },
] as const;

const CUSTOM = "custom";

/**
 * Search, period, category, order and type of the transactions list
 * (wireframe 04). Every choice is written to the URL by `useListQuery`; this
 * component only keeps what is still being typed or picked.
 */
export function TransactionToolbar({
  query,
  categories,
  setFilters,
  setSort,
  searchRef,
}: ToolbarProps) {
  const period = periodOf(query);
  // "Rentang tanggal…" was picked: the date fields show before any date is set.
  const [rangeOpen, setRangeOpen] = useState(false);
  const [seenPeriod, setSeenPeriod] = useState(period);
  if (period !== seenPeriod) {
    // Back to all time from elsewhere (Hapus filter, Back) closes the date
    // fields. Other changes keep them, so they never vanish while in use,
    // e.g. when the typed range happens to be a whole month.
    setSeenPeriod(period);
    if (period === "all") setRangeOpen(false);
  }
  const showRange = rangeOpen || period === CUSTOM;

  function setType(type: TransactionType | undefined) {
    // A category of the other type would leave the list empty.
    const category = categories?.find((c) => c.id === query.category);
    const keepCategory = !type || !category || category.type === type;
    setFilters({ type, ...(!keepCategory && { category: undefined }) });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* One row on wide screens; when the chips need a second row, the
          search stays level with the first. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <SearchField
          value={query.q}
          setFilters={setFilters}
          inputRef={searchRef}
        />
        <div className="flex flex-wrap items-center gap-2 lg:flex-1">
          <PeriodChip
            query={query}
            showRange={showRange}
            onRangeOpenChange={setRangeOpen}
            setFilters={setFilters}
          />
          <ChipSelect
            label="Kategori"
            value={query.category ?? ""}
            active={query.category !== undefined}
            onChange={(event) =>
              setFilters({ category: event.target.value || undefined })
            }
          >
            <option value="">Semua kategori</option>
            <CategoryOptions
              categories={categories}
              type={query.type}
              selected={query.category}
            />
          </ChipSelect>
          <ChipSelect
            label="Urutkan"
            value={`${query.sort}-${query.order}`}
            active={
              query.sort !== DEFAULT_LIST_QUERY.sort ||
              query.order !== DEFAULT_LIST_QUERY.order
            }
            onChange={(event) => {
              const choice = SORT_OPTIONS.find(
                (option) => option.value === event.target.value,
              );
              if (choice) setSort({ sort: choice.sort, order: choice.order });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ChipSelect>
          <ChipRadioGroup
            legend="Tipe transaksi"
            name="transaction-type"
            className="lg:ml-auto"
            options={TYPE_OPTIONS}
            value={query.type ?? "all"}
            onChange={(value) => setType(value === "all" ? undefined : value)}
          />
        </div>
      </div>
      {showRange && <RangeFields query={query} setFilters={setFilters} />}
    </div>
  );
}

/**
 * The search box. What is typed stays here and reaches the URL 300 ms after
 * typing stops (Enter sends it at once), replacing the history entry, so
 * Back does not step through every letter. When the URL changes from
 * elsewhere (Hapus filter, Back), the box shows the new value; its own
 * search arriving in the URL never overwrites newer typing.
 */
function SearchField({
  value,
  setFilters,
  inputRef,
}: {
  value: string | undefined;
  setFilters: SetFilters;
  inputRef: Ref<HTMLInputElement> | undefined;
}) {
  const inputId = useId();
  const [text, setText] = useState(value ?? "");
  const [seen, setSeen] = useState(value);
  // The last search this box sent, until the URL shows it.
  const [sent, setSent] = useState<{ q: string | undefined } | null>(null);

  if (value !== seen) {
    setSeen(value);
    setSent(null);
    const ownSearch = sent !== null && sent.q === value;
    if (!ownSearch) setText(value ?? "");
  }

  function send(next: string) {
    const q = next.trim() || undefined;
    if (q === value) return;
    setSent({ q });
    setFilters({ q }, { replace: true });
  }

  const debounced = useDebouncedCallback(send, SEARCH_DELAY_MS);

  function submit(event: FormEvent) {
    event.preventDefault();
    debounced.cancel();
    send(text);
  }

  return (
    <form role="search" onSubmit={submit} className="relative lg:w-80">
      <label htmlFor={inputId} className="sr-only">
        Cari transaksi
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
        strokeWidth={1.75}
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={text}
        placeholder="Cari catatan atau kategori"
        maxLength={MAX_SEARCH_LENGTH}
        enterKeyHint="search"
        onChange={(event) => {
          setText(event.target.value);
          debounced.schedule(event.target.value);
        }}
        className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-10 pl-9 text-base text-fg placeholder:text-fg-muted lg:h-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={(event) => {
            setText("");
            debounced.cancel();
            send("");
            event.currentTarget.form?.querySelector("input")?.focus();
          }}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </form>
  );
}

/** "Periode": all time, one of the last 12 months, or a range of dates. */
function PeriodChip({
  query,
  showRange,
  onRangeOpenChange,
  setFilters,
}: {
  query: TransactionListQuery;
  showRange: boolean;
  onRangeOpenChange: (open: boolean) => void;
  setFilters: SetFilters;
}) {
  const period = periodOf(query);
  const months = recentMonths(todayInJakarta());
  // A month older than the list reads as a range, so it stays visible.
  const listed = period === "all" || months.some((m) => m.value === period);
  const value = showRange || !listed ? CUSTOM : period;

  return (
    <ChipSelect
      label="Periode"
      value={value}
      active={period !== "all" || showRange}
      onChange={(event) => {
        const next = event.target.value;
        // "Rentang tanggal…" only opens the date fields; the rest close them.
        onRangeOpenChange(next === CUSTOM);
        if (next === "all") setFilters({ from: undefined, to: undefined });
        else if (next !== CUSTOM) setFilters(monthRange(next));
      }}
    >
      <option value="all">Semua waktu</option>
      {months.map((month) => (
        <option key={month.value} value={month.value}>
          {month.label}
        </option>
      ))}
      <option value={CUSTOM}>
        {listed ? "Rentang tanggal…" : periodLabel(query)}
      </option>
    </ChipSelect>
  );
}

/**
 * Dari/Sampai for a custom range. Each complete change filters at once; a
 * range that ends before it starts is explained and not applied.
 */
function RangeFields({
  query,
  setFilters,
}: {
  query: TransactionListQuery;
  setFilters: SetFilters;
}) {
  const [draft, setDraft] = useState({
    from: query.from ?? "",
    to: query.to ?? "",
  });
  const [seen, setSeen] = useState({ from: query.from, to: query.to });
  if (query.from !== seen.from || query.to !== seen.to) {
    setSeen({ from: query.from, to: query.to });
    setDraft({ from: query.from ?? "", to: query.to ?? "" });
  }

  const reversed = Boolean(draft.from && draft.to && draft.from > draft.to);

  function change(next: { from: string; to: string }) {
    setDraft(next);
    if (next.from && next.to && next.from > next.to) return;
    setFilters({ from: next.from || undefined, to: next.to || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        type="date"
        label="Dari"
        className="w-full sm:w-48"
        value={draft.from}
        onChange={(event) => change({ ...draft, from: event.target.value })}
      />
      <Input
        type="date"
        label="Sampai"
        className="w-full sm:w-48"
        value={draft.to}
        error={
          reversed ? "Tanggal awal harus sebelum tanggal akhir" : undefined
        }
        onChange={(event) => change({ ...draft, to: event.target.value })}
      />
    </div>
  );
}

const CATEGORY_GROUPS = [
  { type: "expense", label: "Pengeluaran" },
  { type: "income", label: "Pemasukan" },
] as const;

/**
 * The categories of the chosen type, grouped. A category filter that is not
 * among them still gets an option, so the chip never claims "Semua
 * kategori" while a category filters the list: its name when the type filter
 * hides it, "Memuat kategori…" while loading, or "Kategori tidak ditemukan"
 * for an id the user does not have (deleted, or a link from another account).
 */
function CategoryOptions({
  categories,
  type,
  selected,
}: {
  categories: CategoryDto[] | undefined;
  type: TransactionType | undefined;
  selected: string | undefined;
}) {
  const chosen = categories?.find((c) => c.id === selected);
  const listed = chosen !== undefined && (!type || chosen.type === type);
  const fallback = !categories
    ? "Memuat kategori…"
    : (chosen?.name ?? "Kategori tidak ditemukan");

  return (
    <>
      {categories &&
        CATEGORY_GROUPS.filter((group) => !type || group.type === type).map(
          (group) => (
            <optgroup key={group.type} label={group.label}>
              {categories
                .filter((c) => c.type === group.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ),
        )}
      {selected && !listed && <option value={selected}>{fallback}</option>}
    </>
  );
}
