import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const TZ = "Europe/London";

export function nowLondon(): Date {
  return toZonedTime(new Date(), TZ);
}

export function formatLondon(
  date: Date | string,
  pattern: string,
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TZ, pattern);
}

export function londonDateString(date: Date = new Date()): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

/** Start of a calendar day in Europe/London as UTC Date */
export function londonDayStart(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, TZ);
}

export function addHoursLondon(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export function generateCandidateDates(
  evenings: number[],
  leadDays: number,
  horizonDays: number,
  from: Date = new Date(),
): string[] {
  const start = addDays(toZonedTime(from, TZ), leadDays);
  const end = addDays(toZonedTime(from, TZ), horizonDays);
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    if (evenings.includes(cursor.getDay())) {
      dates.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function formatWeekdayShort(dateStr: string): string {
  return formatLondon(londonDayStart(dateStr), "EEE").toUpperCase();
}

export function formatDayNumber(dateStr: string): string {
  return formatLondon(londonDayStart(dateStr), "d");
}

export function formatMonthShort(dateStr: string): string {
  return formatLondon(londonDayStart(dateStr), "MMM");
}

export function formatLongDate(dateStr: string): string {
  return formatLondon(londonDayStart(dateStr), "EEEE d MMMM");
}

export function formatTimeLabel(startTime: string): string {
  // "19:00:00" or "19:00" → "7pm" / "8pm"
  const [h] = startTime.split(":").map(Number);
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

export function formatFromTime(startTime: string): string {
  return `from ${formatTimeLabel(startTime)}`;
}

export function formatCountdown(closesAt: string, now = new Date()): string {
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return "Closed";
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const deadline = formatLondon(closesAt, "EEE d MMM, HH:mm");
  return `Closes in ${hours}h ${mins}m · ${deadline}`;
}

/** Exact close moment in London, e.g. "Fri 2 Oct, 4:17pm". */
export function formatClosesExact(closesAt: string): string {
  const label = formatLondon(closesAt, "EEE d MMM, h:mm a");
  return label.replace(/ AM$/, "am").replace(/ PM$/, "pm");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
