"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Waits until the calls stop for `delay` ms, then runs the latest callback
 * once with the last arguments (e.g. search after typing stops). A waiting
 * call is dropped on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The timer always calls the callback of the latest render.
  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => clearTimeout(timerRef.current), []);

  useEffect(() => cancel, [cancel]);

  const schedule = useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );

  return useMemo(() => ({ schedule, cancel }), [schedule, cancel]);
}
