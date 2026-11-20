// jsdom has no layout and no window.matchMedia. These stand-ins answer
// `(min-width: …px)` queries for a pretend window width, so components that
// pick a desktop or phone layout in JS can be tested in both.

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: MediaQueryList["onchange"] = null;

  constructor(
    readonly media: string,
    readonly matches: boolean,
  ) {
    super();
  }

  // The old listener API; nothing here changes width while a test runs.
  addListener() {}
  removeListener() {}
}

/** For tests: answer media queries as if the window were this wide. */
export function setViewportWidth(width: number) {
  window.matchMedia = (query: string) => {
    const minWidth = /min-width:\s*(\d+)px/.exec(query)?.[1];
    const matches = minWidth !== undefined && width >= Number(minWidth);
    return new FakeMediaQueryList(query, matches);
  };
}

/** Wide enough for the desktop layout (Tailwind `lg`). */
export const DESKTOP_WIDTH = 1280;
/** A common phone width, as used in the manual checks. */
export const PHONE_WIDTH = 390;
