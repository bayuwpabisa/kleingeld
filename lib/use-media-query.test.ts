import { renderHook } from "@testing-library/react";

import { PHONE_WIDTH, setViewportWidth } from "@/test/viewport";

import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  it("is true when the query matches", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(true);
  });

  it("is false when it does not", () => {
    setViewportWidth(PHONE_WIDTH);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
  });
});
