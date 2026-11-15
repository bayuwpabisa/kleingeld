import { dateGroupLabel, formatDate, todayInJakarta } from "./date";

describe("todayInJakarta", () => {
  it("follows Indonesian time, not UTC", () => {
    // 23:30 UTC on 15 Nov is already 06:30 on 16 Nov in Jakarta.
    expect(todayInJakarta(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16");
    expect(todayInJakarta(new Date("2026-11-15T10:00:00Z"))).toBe("2026-11-15");
  });
});

describe("formatDate", () => {
  it.each([
    ["2026-11-01", "1 Nov 2026"],
    ["2026-10-31", "31 Okt 2026"],
    ["2026-01-01", "1 Jan 2026"],
  ])("formats %p as %p", (date, text) => {
    expect(formatDate(date)).toBe(text);
  });
});

describe("dateGroupLabel", () => {
  const today = "2026-11-15";

  it("calls today and yesterday by name", () => {
    expect(dateGroupLabel("2026-11-15", today)).toBe("Hari ini · Min, 15 Nov");
    expect(dateGroupLabel("2026-11-14", today)).toBe("Kemarin · Sab, 14 Nov");
  });

  it("shows other days of this year with the weekday", () => {
    expect(dateGroupLabel("2026-10-30", today)).toBe("Jum, 30 Okt");
  });

  it("adds the year for other years", () => {
    expect(dateGroupLabel("2025-12-31", today)).toBe("Rab, 31 Des 2025");
  });

  it("knows yesterday across a month and a year", () => {
    expect(dateGroupLabel("2026-10-31", "2026-11-01")).toBe(
      "Kemarin · Sab, 31 Okt",
    );
    expect(dateGroupLabel("2025-12-31", "2026-01-01")).toBe(
      "Kemarin · Rab, 31 Des 2025",
    );
  });
});
