import {
  combineReducers,
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";

import { toastReducer } from "./toast-slice";
import { transactionEditorReducer } from "./transaction-editor-slice";

// Redux holds client UI state only; data from the API lives in TanStack
// Query (AGENTS.md). One store per app mount (app/providers.tsx), never a
// module-level store, so requests on the server never share state.

/** Things thunks may use that cannot live in the state, such as callbacks. */
export type ThunkExtra = {
  /** The "Urungkan" callback of the current toast, by toast id. */
  toastActions: Map<string, () => void>;
};

// Combined once, when the module loads: combineReducers checks each reducer
// with a randomly named action, and Next.js (cacheComponents) flags
// Math.random() if that happens while Providers renders.
const rootReducer = combineReducers({
  toast: toastReducer,
  transactionEditor: transactionEditorReducer,
});

export function makeStore() {
  const extra: ThunkExtra = { toastActions: new Map() };
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: extra } }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<Result = void> = ThunkAction<
  Result,
  RootState,
  ThunkExtra,
  UnknownAction
>;
