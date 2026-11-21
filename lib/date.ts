// Transaction dates are calendar dates ("YYYY-MM-DD") without a time zone.
// They are read as UTC midnight and formatted in UTC, so a date never moves
// to the day before or after because of the viewer's zone.

const DAY_MS = 24 * 60 * 60 * 1000;

const jakartaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
});
const fullDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dayMonth = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});
const weekdayDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const weekdayDateYear = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function shiftDays(date: string, days: number) {
  return new Date(toUtcDate(date).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Today's date in Indonesian time (WIB) as "YYYY-MM-DD". */
export function todayInJakarta(now = new Date()): string {
  return jakartaDay.format(now);
}

/** "2026-11-01" → "1 Nov 2026" */
export function formatDate(date: string): string {
  return fullDate.format(toUtcDate(date));
}

/** "1 Nov" this year, "12 Des 2025" in another year (`today` is "YYYY-MM-DD"). */
export function shortDate(date: string, today: string): string {
  return date.slice(0, 4) === today.slice(0, 4)
    ? dayMonth.format(toUtcDate(date))
    : formatDate(date);
}

/**
 * The heading of a day in a list: "Hari ini · Min, 15 Nov",
 * "Kemarin · Sab, 14 Nov", "Jum, 30 Okt", or with the year when it is not
 * the current one.
 */
export function dateGroupLabel(date: string, today: string): string {
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  const label = (sameYear ? weekdayDate : weekdayDateYear).format(
    toUtcDate(date),
  );
  if (date === today) return `Hari ini · ${label}`;
  if (date === shiftDays(today, -1)) return `Kemarin · ${label}`;
  return label;
}
