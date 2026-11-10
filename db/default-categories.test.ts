/**
 * @jest-environment node
 */
import { DEFAULT_CATEGORIES, defaultCategoriesFor } from "./default-categories";

describe("defaultCategoriesFor", () => {
  it("gives the user their own copy of every default category", () => {
    const rows = defaultCategoriesFor("user-1");

    expect(rows).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(rows.map(({ name, type, icon }) => ({ name, type, icon }))).toEqual(
      DEFAULT_CATEGORIES,
    );
    for (const row of rows) {
      expect(row.userId).toBe("user-1");
      expect(row.isDefault).toBe(true);
    }
  });
});
