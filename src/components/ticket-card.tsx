import { BookedActions } from "@/components/booked-actions";
import { LineChips } from "@/components/line-chips";
import { formatLondon } from "@/lib/dates";

export function TicketCard({
  title,
  venue,
  station,
  lines,
  preferredLines = [],
  note,
  availabilityNote,
  priceFrom,
  runsTo,
  isNew,
  url,
  heart,
  onHeart,
  heartCount,
  heartInitials,
  adminAction,
  showNote,
  closed,
  closedLabel,
}: {
  title: string;
  venue?: string | null;
  station?: string | null;
  lines?: string[];
  preferredLines?: string[];
  note?: string | null;
  availabilityNote?: string | null;
  priceFrom?: number | null;
  runsTo?: string | null;
  isNew?: boolean;
  url?: string | null;
  heart?: boolean;
  onHeart?: () => void;
  heartCount?: number;
  heartInitials?: string[];
  adminAction?: React.ReactNode;
  showNote?: boolean;
  closed?: boolean;
  closedLabel?: string | null;
}) {
  return (
    <article
      className={`animate-fade-up overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--ticket)] shadow-[0_8px_24px_-16px_rgba(28,21,32,0.35)] ${
        closed ? "opacity-55" : ""
      }`}
    >
      <div className="flex">
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl leading-tight">{title}</h3>
            {closed && (
              <span className="rounded-md bg-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                {closedLabel || "Closed"}
              </span>
            )}
            {isNew && !closed && (
              <span className="rounded-md bg-[var(--gold-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
                New
              </span>
            )}
          </div>
          {(venue || station) && (
            <p className="text-sm text-[var(--muted)]">
              {[venue, station].filter(Boolean).join(" · ")}
            </p>
          )}
          {lines && lines.length > 0 && (
            <div className="mt-2">
              <LineChips lines={lines} preferred={preferredLines} />
            </div>
          )}
          {note && showNote !== false && (
            <p className="mt-2 text-sm text-[var(--muted)]">{note}</p>
          )}
          {availabilityNote && (
            <p className="mt-1 text-xs font-medium text-[var(--accent)]">
              {availabilityNote}
            </p>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)]"
            >
              Tickets ↗
            </a>
          )}
          {onHeart && !closed && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-pressed={heart}
                aria-label={heart ? "Remove heart" : "I'd love this one"}
                onClick={onHeart}
                className={`inline-flex min-h-tap min-w-12 items-center justify-center rounded-full border text-body ${
                  heart
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-[var(--line)] text-[var(--grey)]"
                }`}
              >
                ♥
              </button>
              <div className="text-sm text-[var(--muted)]">
                <span className="font-mono text-foreground">{heartCount ?? 0}</span>
                {heartInitials && heartInitials.length > 0 && (
                  <span className="ml-2">{heartInitials.join(", ")}</span>
                )}
              </div>
            </div>
          )}
          {adminAction && <div className="mt-3">{adminAction}</div>}
        </div>
        <div className="ticket-perforation w-px shrink-0 self-stretch" aria-hidden />
        <div className="flex w-[88px] shrink-0 flex-col items-center justify-center gap-2 bg-[var(--ticket-stub)] p-3 text-center">
          <div className="font-mono text-sm font-semibold">
            {priceFrom != null ? `from £${Number(priceFrom)}` : "—"}
          </div>
          {runsTo && (
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              until {formatLondon(`${runsTo}T12:00:00`, "d MMM")}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function BigNightTicket({
  title,
  venue,
  area,
  dateLabel,
  timeLabel,
  arrivalNote,
  station,
  lines,
  preferredLines = [],
  url,
  date,
  startTime,
  shareText,
}: {
  title: string;
  venue?: string | null;
  area?: string | null;
  dateLabel: string;
  timeLabel: string;
  arrivalNote?: string | null;
  station?: string | null;
  lines?: string[];
  preferredLines?: string[];
  url?: string | null;
  /** yyyy-MM-dd — enables calendar + map + WhatsApp actions */
  date?: string;
  startTime?: string;
  shareText?: string;
}) {
  return (
    <article className="animate-fade-up overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--ticket)] shadow-[0_16px_40px_-20px_rgba(28,21,32,0.45)]">
      <div className="border-b border-dashed border-[var(--border)] bg-[var(--accent-soft)] px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
        It&apos;s booked
      </div>
      <div className="p-5">
        <h2 className="font-display text-3xl leading-tight">{title}</h2>
        {venue && <p className="mt-1 text-[var(--muted)]">{venue}</p>}
        <p className="mt-4 font-mono text-sm">{dateLabel}</p>
        <p className="mt-1 text-sm">
          {timeLabel}
          {arrivalNote ? ` · ${arrivalNote}` : ""}
        </p>
        {station && (
          <p className="mt-3 text-sm text-[var(--muted)]">{station}</p>
        )}
        {lines && lines.length > 0 && (
          <div className="mt-2">
            <LineChips lines={lines} preferred={preferredLines} />
          </div>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold"
          >
            Tickets / Details ↗
          </a>
        )}
        {date && startTime && shareText && (
          <BookedActions
            title={title}
            venue={venue}
            area={area ?? station}
            date={date}
            startTime={startTime}
            arrivalNote={arrivalNote}
            url={url}
            shareText={shareText}
          />
        )}
      </div>
    </article>
  );
}
