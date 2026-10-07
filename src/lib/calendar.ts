import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "@/lib/dates";

/** Build a minimal .ics for a night out in Europe/London. */
export function buildNightOutIcs(input: {
  title: string;
  venue?: string | null;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss or HH:mm
  arrivalNote?: string | null;
  url?: string | null;
}): string {
  const [hh, mm] = input.startTime.split(":").map(Number);
  const startLocal = `${input.date}T${String(hh).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}:00`;
  // End 3 hours later (typical night out)
  const endH = hh + 3;
  const endLocal = `${input.date}T${String(endH).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}:00`;
  const stamp = formatInTimeZone(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
  const uid = `${input.date}-${hh}${mm || 0}@mums-night-out`;
  const summary = escapeIcs(input.title);
  const location = escapeIcs(
    [input.venue].filter(Boolean).join(", ") || "London",
  );
  const description = escapeIcs(
    [
      input.arrivalNote,
      input.url ? `Tickets: ${input.url}` : null,
      "Mums' Night Out",
    ]
      .filter(Boolean)
      .join("\\n"),
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mums Night Out//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TZ}:${startLocal.replace(/[-:]/g, "").slice(0, 15)}`,
    `DTEND;TZID=${TZ}:${endLocal.replace(/[-:]/g, "").slice(0, 15)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function mapsSearchUrl(venue?: string | null, area?: string | null): string {
  const q = [venue, area, "London"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function bookedWhatsAppMessage(input: {
  title: string;
  venue?: string | null;
  dateLabel: string;
  timeLabel: string;
  arrivalNote?: string | null;
  link?: string | null;
}): string {
  const place = input.venue ? ` at ${input.venue}` : "";
  const note = input.arrivalNote ? ` ${input.arrivalNote}.` : "";
  const link = input.link ? ` ${input.link}` : "";
  return `It's on! 🎭 ${input.title}${place} — ${input.dateLabel}, ${input.timeLabel}.${note}${link}`;
}
