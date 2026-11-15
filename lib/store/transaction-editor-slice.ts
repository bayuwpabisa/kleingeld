import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Which transaction dialog is open on desktop (the form, or the delete
// confirmation), so any page or button can open it. Only ids and modes live
// here; the transactions themselves stay in TanStack Query.

export type EditorTarget = { mode: "create" } | { mode: "edit"; id: string };

type TransactionEditorState = {
  editor: { mode: "closed" } | EditorTarget;
  /** The transaction waiting for "Hapus transaksi ini?", if any. */
  deleteId: string | null;
};

const initialState: TransactionEditorState = {
  editor: { mode: "closed" },
  deleteId: null,
};

const transactionEditorSlice = createSlice({
  name: "transactionEditor",
  initialState,
  reducers: {
    editorOpened(state, action: PayloadAction<EditorTarget>) {
      state.editor = action.payload;
    },
    editorClosed(state) {
      state.editor = { mode: "closed" };
    },
    /** From a row or from the form: the form closes, the confirmation opens. */
    deleteRequested(state, action: PayloadAction<string>) {
      state.editor = { mode: "closed" };
      state.deleteId = action.payload;
    },
    deleteClosed(state) {
      state.deleteId = null;
    },
  },
});

export const transactionEditorReducer = transactionEditorSlice.reducer;
export const { editorOpened, editorClosed, deleteRequested, deleteClosed } =
  transactionEditorSlice.actions;
