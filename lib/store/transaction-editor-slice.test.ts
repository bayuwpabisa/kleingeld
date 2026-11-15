import { makeStore } from "./store";
import {
  deleteClosed,
  deleteRequested,
  editorClosed,
  editorOpened,
} from "./transaction-editor-slice";

const state = (store: ReturnType<typeof makeStore>) =>
  store.getState().transactionEditor;

describe("transaction editor slice", () => {
  it("starts with everything closed", () => {
    expect(state(makeStore())).toEqual({
      editor: { mode: "closed" },
      deleteId: null,
    });
  });

  it("opens the form to add or to edit one transaction", () => {
    const store = makeStore();
    store.dispatch(editorOpened({ mode: "create" }));
    expect(state(store).editor).toEqual({ mode: "create" });

    store.dispatch(editorOpened({ mode: "edit", id: "t1" }));
    expect(state(store).editor).toEqual({ mode: "edit", id: "t1" });

    store.dispatch(editorClosed());
    expect(state(store).editor).toEqual({ mode: "closed" });
  });

  it("asks to confirm a delete, and moving there closes the form", () => {
    const store = makeStore();
    store.dispatch(editorOpened({ mode: "edit", id: "t1" }));

    store.dispatch(deleteRequested("t1"));
    expect(state(store)).toEqual({
      editor: { mode: "closed" },
      deleteId: "t1",
    });

    store.dispatch(deleteClosed());
    expect(state(store).deleteId).toBeNull();
  });
});
