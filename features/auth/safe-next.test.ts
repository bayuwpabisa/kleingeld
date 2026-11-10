/**
 * @jest-environment node
 */
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps a path inside the app", () => {
    expect(safeNext("/transactions")).toBe("/transactions");
    expect(safeNext("/transactions?type=expense")).toBe(
      "/transactions?type=expense",
    );
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["another origin", "https://evil.example"],
    ["protocol-relative", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["relative path", "dashboard"],
  ])("drops a %s value", (_, value) => {
    expect(safeNext(value)).toBeUndefined();
  });
});
