/**
 * @jest-environment node
 */
import {
  monthRange,
  monthsBetween,
  periodLabel,
  periodOf,
  recentMonths,
} from "./periods";

describe("monthsBetween", () => {
  it("lists every month from the first to the last, oldest first", () => {
    expect(monthsBetween("2026-06", "2026-11")).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
  });

  it("crosses a year boundary", () => {
    expect(monthsBetween("2026-11", "2027-02")).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("is one month when both ends are the same, and empty when reversed", () => {
    expect(monthsBetween("2026-11", "2026-11")).toEqual(["2026-11"]);
    expect(monthsBetween("2026-11", "2026-10")).toEqual([]);
  });
});

describe("monthRange", () => {
  it("covers the whole month, leap years included", () => {
    expect(monthRange("2026-11")).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
    expect(monthRange("2028-02")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });
});

describe("recentMonths", () => {
  it("lists the last 12 months, the current one first", () => {
    const months = recentMonths("2026-01-15");
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ value: "2026-01", label: "Januari 2026" });
    expect(months[1]).toEqual({ value: "2025-12", label: "Desember 2025" });
    expect(months[11]).toEqual({ value: "2025-02", label: "Februari 2025" });
  });
});

describe("periodOf", () => {
  it("is all time without dates", () => {
    expect(periodOf({})).toBe("all");
  });

  it("is a month when the range is exactly one month", () => {
    expect(periodOf({ from: "2026-11-01", to: "2026-11-30" })).toBe("2026-11");
  });

  it("is a custom range otherwise", () => {
    expect(periodOf({ from: "2026-11-01", to: "2026-11-15" })).toBe("custom");
    expect(periodOf({ from: "2026-11-01" })).toBe("custom");
  });
});

describe("periodLabel", () => {
  it.each([
    [{}, "Semua waktu"],
    [{ from: "2026-11-01", to: "2026-11-30" }, "November 2026"],
    [{ from: "2026-11-01", to: "2026-11-15" }, "1–15 Nov 2026"],
    [{ from: "2026-10-28", to: "2026-11-03" }, "28 Okt 2026 – 3 Nov 2026"],
    [{ from: "2026-11-01" }, "Sejak 1 Nov 2026"],
    [{ to: "2026-11-30" }, "Sampai 30 Nov 2026"],
  ])("labels %p as %p", (filters, label) => {
    expect(periodLabel(filters)).toBe(label);
  });
});
