import { makeStore } from "./store";
import { dismissToast, runToastAction, showToast } from "./toast-slice";

function setup() {
  const store = makeStore();
  const current = () => store.getState().toast.current;
  return { store, current };
}

describe("toast slice", () => {
  it("starts without a toast", () => {
    expect(setup().current()).toBeNull();
  });

  it("keeps only serializable data in the store", () => {
    const { store, current } = setup();
    store.dispatch(
      showToast({
        message: "Transaksi dihapus",
        action: { label: "Urungkan", onClick: () => {} },
      }),
    );
    expect(current()).toEqual({
      id: expect.any(String),
      message: "Transaksi dihapus",
      actionLabel: "Urungkan",
    });
  });

  it("runs the action of the toast and closes it", () => {
    const { store, current } = setup();
    const onUndo = jest.fn();
    store.dispatch(
      showToast({
        message: "Transaksi dihapus",
        action: { label: "Urungkan", onClick: onUndo },
      }),
    );

    store.dispatch(runToastAction(current()?.id ?? ""));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(current()).toBeNull();
  });

  it("replaces the toast and forgets the old action", () => {
    const { store, current } = setup();
    const oldUndo = jest.fn();
    store.dispatch(
      showToast({
        message: "Transaksi dihapus",
        action: { label: "Urungkan", onClick: oldUndo },
      }),
    );
    const oldId = current()?.id ?? "";

    store.dispatch(showToast({ message: "Transaksi disimpan" }));
    store.dispatch(runToastAction(oldId));

    expect(oldUndo).not.toHaveBeenCalled();
    expect(current()?.message).toBe("Transaksi disimpan");
  });

  it("does not close a newer toast when an old one times out", () => {
    const { store, current } = setup();
    store.dispatch(showToast({ message: "Pertama" }));
    const oldId = current()?.id ?? "";
    store.dispatch(showToast({ message: "Kedua" }));

    store.dispatch(dismissToast(oldId));

    expect(current()?.message).toBe("Kedua");
  });

  it("closes the current toast when no id is given", () => {
    const { store, current } = setup();
    store.dispatch(showToast({ message: "Transaksi disimpan" }));
    store.dispatch(dismissToast());
    expect(current()).toBeNull();
  });

  it("gives each store its own actions", () => {
    const a = setup();
    const b = setup();
    const onUndo = jest.fn();
    a.store.dispatch(
      showToast({
        message: "Transaksi dihapus",
        action: { label: "Urungkan", onClick: onUndo },
      }),
    );

    b.store.dispatch(runToastAction(a.current()?.id ?? ""));

    expect(onUndo).not.toHaveBeenCalled();
    expect(a.current()).not.toBeNull();
  });
});
