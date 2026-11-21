import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

import { DESKTOP_WIDTH, setViewportWidth } from "./test/viewport";

expect.extend(toHaveNoViolations);

// Any console.error fails the test. React's act() and prop warnings, and
// errors a component swallows, only show up there; an ignored one hides a
// bug. A test that expects an error mocks console.error itself
// (jest.spyOn(console, "error").mockImplementation(...)), which replaces
// this wrapper until the spy is restored.
const consoleError = console.error;
let loggedErrors: unknown[][] = [];

beforeEach(() => {
  loggedErrors = [];
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args);
    consoleError(...args);
  };
});

afterEach(() => {
  console.error = consoleError;
  if (loggedErrors.length === 0) return;
  const messages = loggedErrors.map((args) =>
    args
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
      .join(" "),
  );
  throw new Error(
    `console.error was called during this test:\n- ${messages.join("\n- ")}`,
  );
});

// jsdom has no matchMedia. Every DOM test starts on a desktop-wide window;
// a test switches with setViewportWidth(PHONE_WIDTH).
if (typeof window !== "undefined") {
  beforeEach(() => setViewportWidth(DESKTOP_WIDTH));
}

// jsdom has no IntersectionObserver. Without it next/link marks itself
// visible on a timer, a state update that can land outside act() after a
// test's last await. This observer never fires, so links simply never
// prefetch in tests.
if (
  typeof window !== "undefined" &&
  typeof window.IntersectionObserver === "undefined"
) {
  class NoIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly scrollMargin = "0px";
    readonly thresholds = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = NoIntersectionObserver;
}

// jsdom has <dialog> but not showModal()/close(). This stub only toggles the
// `open` attribute and fires `close`, so components can run in tests. The real
// modal behavior (inert page, focus trap, Esc) comes from the browser and is
// checked there, not here.
// Tests that opt into `@jest-environment node` have no DOM, so skip it there.
if (
  typeof HTMLDialogElement !== "undefined" &&
  typeof HTMLDialogElement.prototype.showModal !== "function"
) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(returnValue?: string) {
    if (!this.open) return;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
