import { useLayoutEffect, useRef } from "react";

/**
 * Runs `reset` when the component is hidden. With cacheComponents, Next keeps
 * a page it leaves in the DOM, hidden by React's <Activity>, and keeps its
 * state; a button that stays busy until the next page appears would still be
 * busy when the user comes back. A layout effect's cleanup runs right as the
 * page is hidden, so the old state never shows again
 * (node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md).
 * It also runs on unmount, where resetting is harmless.
 */
export function useResetOnHide(reset: () => void) {
  const latest = useRef(reset);
  useLayoutEffect(() => {
    latest.current = reset;
  });
  useLayoutEffect(() => () => latest.current(), []);
}
