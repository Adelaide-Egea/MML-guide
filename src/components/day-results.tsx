import { formatLongDate } from "@/lib/dates";
import type { DaySlot } from "@/lib/types";

export function DayResultsView({
  dates,
  slots,
  members,
  isAdmin,
  onChoose,
  onOpenFinal,
}: {
  dates: string[];
  slots: { member_id: string; date: string; slot: DaySlot }[];
  members: { id: string; first_name: string }[];
  isAdmin?: boolean;
  onChoose?: (date: string) => void;
  onOpenFinal?: (date: string) => void;
}) {
  const rows = dates.map((date) => {
    const morning = new Set(
      slots.filter((s) => s.date === date && s.slot === "morning").map((s) => s.member_id),
    ).size;
    const afternoon = new Set(
      slots
        .filter((s) => s.date === date && s.slot === "afternoon")
        .map((s) => s.member_id),
    ).size;
    return { date, morning, afternoon, total: morning + afternoon };
  });
  const max = Math.max(0, ...rows.map((r) => r.total));
  const winners = rows.filter((r) => r.total === max && max > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--winner)] p-5 text-[var(--winner-fg)]">
        {max === 0 ? (
          <p className="font-display text-2xl">No answers yet.</p>
        ) : (
          <>
            <p className="font-display text-2xl leading-snug">
              Strongest day:{" "}
              <span className="text-[var(--gold)]">
                {formatLongDate(winners[0].date)}
              </span>
            </p>
            <p className="mt-2 text-sm opacity-80">
              Morning {winners[0].morning} · Afternoon {winners[0].afternoon}
              {winners.length > 1 ? " · joint favourites" : ""}
            </p>
          </>
        )}
        {isAdmin && onOpenFinal && winners.length === 1 ? (
          <>
            <button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl bg-white/15 px-4 text-sm font-semibold"
              onClick={() => onOpenFinal(winners[0].date)}
            >
              Open the final choice
            </button>
            <p className="mt-2 text-sm opacity-70">
              People can add themselves on this day only.
            </p>
          </>
        ) : !isAdmin ? (
          <p className="mt-4 text-sm opacity-70">
            The organiser is choosing the day.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <button
            key={r.date}
            type="button"
            disabled={!isAdmin || !onChoose}
            onClick={() => onChoose?.(r.date)}
            className="flex w-full flex-col gap-1 rounded-xl border border-[var(--border)] p-3 text-left disabled:cursor-default sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="min-w-0 flex-1 text-sm font-medium">
              {formatLongDate(r.date)}
            </div>
            <div className="flex gap-3 font-mono text-xs text-[var(--muted)]">
              <span>AM {r.morning}</span>
              <span>PM {r.afternoon}</span>
              <span className="text-foreground">{r.total}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {members.length} mums in this group
      </p>
    </div>
  );
}
