import { act, renderHook } from "@testing-library/react";

import { useDebouncedCallback } from "./use-debounced-callback";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useDebouncedCallback", () => {
  it("runs once, with the last arguments, after the calls stop", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current.schedule("k");
      jest.advanceTimersByTime(200);
      result.current.schedule("ko");
      jest.advanceTimersByTime(200);
      result.current.schedule("kopi");
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(300));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("kopi");
  });

  it("calls the latest callback, not the one from the first render", () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 300),
      { initialProps: { callback: first } },
    );

    act(() => result.current.schedule());
    rerender({ callback: latest });
    act(() => jest.advanceTimersByTime(300));

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("can cancel a waiting call", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current.schedule();
      result.current.cancel();
      jest.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not call after unmounting", () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 300),
    );

    act(() => result.current.schedule());
    unmount();
    jest.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });

  it("keeps the same functions between renders", () => {
    const { result, rerender } = renderHook(() =>
      useDebouncedCallback(() => {}, 300),
    );
    const before = result.current;
    rerender();
    expect(result.current.schedule).toBe(before.schedule);
    expect(result.current.cancel).toBe(before.cancel);
  });
});
