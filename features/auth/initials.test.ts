/**
 * @jest-environment node
 */
import { initials } from "./initials";

describe("initials", () => {
  it.each([
    ["Akun Demo", "AD"],
    ["bayu wicaksono pratama", "BW"],
    ["Bayu", "B"],
    ["  spaced   out  ", "SO"],
    ["", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
