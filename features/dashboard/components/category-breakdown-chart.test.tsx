import { fireEvent, render } from "@testing-library/react";

import type { CategoryRow } from "../category-chart-data";
import { CategoryBreakdownChart } from "./category-breakdown-chart";

const ROWS: CategoryRow[] = [
  {
    key: "cat-tagihan",
    label: "Tagihan",
    total: 3_241_500,
    count: 4,
    share: 0.75,
    shareLabel: "75%",
    valueLabel: "3,2 jt",
  },
  {
    key: "cat-makan",
    label: "Makan",
    total: 1_080_500,
    count: 30,
    share: 0.25,
    shareLabel: "25%",
    valueLabel: "1,1 jt",
  },
];

/** Every keydown that reaches the document, in order. */
function recordKeys() {
  const keys: string[] = [];
  const listener = (event: KeyboardEvent) => keys.push(event.key);
  document.addEventListener("keydown", listener);
  return {
    keys,
    stop: () => document.removeEventListener("keydown", listener),
  };
}

// jsdom has no layout, so Recharts draws no bars here; what is tested is the
// wrapper's own key handling. The bars' order under each key was checked in
// the browser.
describe("CategoryBreakdownChart keyboard", () => {
  it("reads down and up arrows as the keys Recharts knows, without scrolling the page", () => {
    const { container } = render(<CategoryBreakdownChart rows={ROWS} />);
    const chart = container.firstElementChild;
    if (!chart) throw new Error("The chart did not render");
    const recorded = recordKeys();

    // Recharts only reads left and right; top to bottom it takes left as
    // "next" (down) and right as "previous" (up).
    const down = fireEvent.keyDown(chart, { key: "ArrowDown" });
    const up = fireEvent.keyDown(chart, { key: "ArrowUp" });
    recorded.stop();

    // The passed-on key is sent while React handles the first one at its
    // root, so it reaches the document before the first one does.
    expect(recorded.keys).toStrictEqual([
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
      "ArrowUp",
    ]);
    // fireEvent returns false when the default action was prevented.
    expect(down).toBe(false);
    expect(up).toBe(false);
  });

  it("leaves other keys alone", () => {
    const { container } = render(<CategoryBreakdownChart rows={ROWS} />);
    const chart = container.firstElementChild;
    if (!chart) throw new Error("The chart did not render");
    const recorded = recordKeys();

    const tab = fireEvent.keyDown(chart, { key: "Tab" });
    const left = fireEvent.keyDown(chart, { key: "ArrowLeft" });
    recorded.stop();

    expect(recorded.keys).toStrictEqual(["Tab", "ArrowLeft"]);
    expect(tab).toBe(true);
    expect(left).toBe(true);
  });
});
