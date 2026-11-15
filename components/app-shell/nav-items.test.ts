import { isActivePath } from "./nav-items";

describe("isActivePath", () => {
  it("marks a section and the pages under it", () => {
    expect(isActivePath("/transactions", "/transactions")).toBe(true);
    expect(isActivePath("/transactions/abc/edit", "/transactions")).toBe(true);
    expect(isActivePath("/transactionsx", "/transactions")).toBe(false);
  });

  it("marks nothing while the pathname is not known yet", () => {
    expect(isActivePath(null, "/transactions")).toBe(false);
  });
});
