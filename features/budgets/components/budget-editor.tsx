"use client";

import { Plus } from "lucide-react";
import { createContext, use, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useResetOnHide } from "@/lib/use-reset-on-hide";
import type { BudgetStatus } from "@/schemas/budget";

/** Which budget form is open: none, a new budget, or one to change. */
export type BudgetEditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; budget: BudgetStatus };

type BudgetEditor = {
  editor: BudgetEditorState;
  /** The budget whose "Hapus budget ini?" is open, if any. */
  deleting: BudgetStatus | null;
  openCreate: () => void;
  openEdit: (budget: BudgetStatus) => void;
  close: () => void;
  /** From the form: the form closes and the confirmation opens. */
  requestDelete: (budget: BudgetStatus) => void;
  closeDelete: () => void;
};

const BudgetEditorContext = createContext<BudgetEditor | null>(null);

const CLOSED: BudgetEditorState = { mode: "closed" };

/**
 * The state of the Budget page's dialogs, shared by the header's "Buat
 * budget" (prerendered) and the budgets streamed in below it, which render
 * the dialogs (BudgetDialogs). Plain React state: nothing else in the app
 * opens them. A hidden page keeps its state (cacheComponents), so the dialogs
 * close when the page is left and do not open again on coming back.
 */
export function BudgetEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<BudgetEditorState>(CLOSED);
  const [deleting, setDeleting] = useState<BudgetStatus | null>(null);
  useResetOnHide(() => {
    setEditor(CLOSED);
    setDeleting(null);
  });

  const value: BudgetEditor = {
    editor,
    deleting,
    openCreate: () => setEditor({ mode: "create" }),
    openEdit: (budget) => setEditor({ mode: "edit", budget }),
    close: () => setEditor(CLOSED),
    requestDelete: (budget) => {
      setEditor(CLOSED);
      setDeleting(budget);
    },
    closeDelete: () => setDeleting(null),
  };
  return <BudgetEditorContext value={value}>{children}</BudgetEditorContext>;
}

export function useBudgetEditor() {
  const editor = use(BudgetEditorContext);
  if (!editor) {
    throw new Error("useBudgetEditor needs a BudgetEditorProvider above it");
  }
  return editor;
}

/** "Buat budget": in the page header at every width, and in the empty page. */
export function CreateBudgetButton() {
  const { openCreate } = useBudgetEditor();
  return (
    <Button onClick={openCreate}>
      <Plus aria-hidden className="size-5" strokeWidth={1.75} />
      Buat budget
    </Button>
  );
}
