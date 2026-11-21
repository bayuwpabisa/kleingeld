import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import type { AppThunk } from "./store";

// One toast at a time. The state keeps only what can be serialized; the
// action's callback waits in the store's thunk extra (store.ts) and is
// dropped whenever the toast is replaced or closed.

export type ToastOptions = {
  /** Same words as the button that caused it: "Transaksi disimpan". */
  message: string;
  /** One follow-up action, such as "Urungkan" after a delete. */
  action?: { label: string; onClick: () => void };
};

export type CurrentToast = {
  id: string;
  message: string;
  actionLabel?: string;
};

type ToastState = { current: CurrentToast | null };

const initialState: ToastState = { current: null };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    toastShown(state, action: PayloadAction<CurrentToast>) {
      state.current = action.payload;
    },
    toastDismissed(state) {
      state.current = null;
    },
  },
});

export const toastReducer = toastSlice.reducer;
const { toastShown, toastDismissed } = toastSlice.actions;

/** Shows a toast, replacing the one on screen. */
export const showToast =
  ({ message, action }: ToastOptions): AppThunk =>
  (dispatch, _getState, { toastActions }) => {
    const id = nanoid();
    toastActions.clear();
    if (action) toastActions.set(id, action.onClick);
    dispatch(toastShown({ id, message, actionLabel: action?.label }));
  };

/**
 * Closes the toast. With an id, only if that toast is still the one shown,
 * so the timer of an old toast cannot close a newer one.
 */
export const dismissToast =
  (id?: string): AppThunk =>
  (dispatch, getState, { toastActions }) => {
    const current = getState().toast.current;
    if (!current || (id !== undefined && current.id !== id)) return;
    toastActions.clear();
    dispatch(toastDismissed());
  };

/** Runs the toast's action, then closes it. */
export const runToastAction =
  (id: string): AppThunk =>
  (dispatch, _getState, { toastActions }) => {
    const onClick = toastActions.get(id);
    if (!onClick) return;
    onClick();
    dispatch(dismissToast(id));
  };
