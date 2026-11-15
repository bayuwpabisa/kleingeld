import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

import { DESKTOP_WIDTH, setViewportWidth } from "./test/viewport";

expect.extend(toHaveNoViolations);

// jsdom has no matchMedia. Every DOM test starts on a desktop-wide window;
// a test switches with setViewportWidth(PHONE_WIDTH).
if (typeof window !== "undefined") {
  beforeEach(() => setViewportWidth(DESKTOP_WIDTH));
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
