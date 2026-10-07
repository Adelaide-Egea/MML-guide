"use client";

import {
  buildNightOutIcs,
  mapsSearchUrl,
  whatsappShareUrl,
} from "@/lib/calendar";

export function BookedActions({
  title,
  venue,
  area,
  date,
  startTime,
  arrivalNote,
  url,
  shareText,
}: {
  title: string;
  venue?: string | null;
  area?: string | null;
  date: string;
  startTime: string;
  arrivalNote?: string | null;
  url?: string | null;
  shareText: string;
}) {
  const mapHref = mapsSearchUrl(venue, area);
  const waHref = whatsappShareUrl(shareText);

  function downloadIcs() {
    const ics = buildNightOutIcs({
      title,
      venue,
      date,
      startTime,
      arrivalNote,
      url,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `mums-night-out-${date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mt-5 grid gap-2">
      <a
        href={mapHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm font-semibold"
      >
        Open in Maps ↗
      </a>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm font-semibold"
      >
        Add to calendar
      </button>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
      >
        Share to WhatsApp
      </a>
    </div>
  );
}
