import { formatLongDate, initials } from "@/lib/dates";
import type { DateAvailability } from "@/lib/types";
import { isFreeEnough } from "@/lib/types";

type VoteLite = {
  member_id: string;
  date: string;
  availability?: DateAvailability;
};

export function ResultsView({
  dates,
  votes,
  members,
  isAdmin,
  onChoose,
}: {
  dates: string[];
  votes: VoteLite[];
  members: { id: string; first_name: string }[];
  isAdmin?: boolean;
  onChoose?: (date: string) => void;
}) {
  const memberMap = new Map(members.map((m) => [m.id, m.first_name]));
  const counts = dates.map((date) => {
    const dayVotes = votes.filter((v) => v.date === date);
    const yes = dayVotes.filter((v) => (v.availability ?? "yes") === "yes");
    const ifNeeded = dayVotes.filter(
      (v) => (v.availability ?? "yes") === "if_needed",
    );
    const free = dayVotes.filter((v) =>
      isFreeEnough({
        round_id: "",
        member_id: v.member_id,
        date: v.date,
        availability: v.availability ?? "yes",
      }),
    );
    return {
      date,
      yesCount: yes.length,
      ifNeededCount: ifNeeded.length,
      freeCount: free.length,
      who: free.map((v) => v.member_id),
    };
  });
  const maxYes = Math.max(0, ...counts.map((c) => c.yesCount));
  const winners = counts.filter((c) => {
    if (c.yesCount !== maxYes || maxYes === 0) return false;
    const maxIf = Math.max(
      0,
      ...counts.filter((x) => x.yesCount === maxYes).map((x) => x.ifNeededCount),
    );
    return c.ifNeededCount === maxIf;
  });
  const total = members.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--winner)] p-5 text-[var(--winner-fg)] animate-fade-up">
        {maxYes === 0 ? (
          <p className="font-display text-2xl leading-snug">
            No solid Yes yet — check If needed below.
          </p>
        ) : winners.length > 1 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              Joint favourites
            </p>
            <p className="mt-2 font-display text-2xl leading-snug">
              {winners.map((w) => formatLongDate(w.date)).join(" · ")}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl leading-snug">
              Most of you said Yes to{" "}
              <span className="text-[var(--gold)]">
                {formatLongDate(winners[0].date)}
              </span>
            </p>
            <p className="mt-2 text-sm opacity-80">
              {winners[0].yesCount} yes
              {winners[0].ifNeededCount > 0
                ? ` · ${winners[0].ifNeededCount} if needed`
                : ""}{" "}
              of {total}
              {" · "}
              {winners[0].who
                .map((id) => memberMap.get(id) ?? "?")
                .join(", ")}
            </p>
          </>
        )}
        {!isAdmin && (
          <p className="mt-4 text-sm opacity-70">
            The organiser is choosing the date.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {counts.map(({ date, yesCount, ifNeededCount, who }) => {
          const pct = maxYes > 0 ? Math.max(8, (yesCount / maxYes) * 100) : 8;
          const winning = winners.some((w) => w.date === date);
          return (
            <button
              key={date}
              type="button"
              disabled={!isAdmin || !onChoose}
              onClick={() => onChoose?.(date)}
              className="flex w-full items-center gap-3 text-left disabled:cursor-default"
            >
              <div className="w-28 shrink-0 text-sm">
                <div className="font-mono text-xs text-[var(--muted)]">
                  {formatLongDate(date).split(" ").slice(0, 1).join(" ")}
                </div>
                <div className="truncate text-sm">
                  {formatLongDate(date).replace(/^\w+ /, "")}
                </div>
              </div>
              <div className="h-8 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className={`h-full rounded-full transition-all ${
                    winning ? "bg-[var(--accent)]" : "bg-[var(--muted)]/40"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-16 text-right font-mono text-xs leading-tight">
                <div>{yesCount} yes</div>
                {ifNeededCount > 0 && (
                  <div className="text-[var(--muted)]">{ifNeededCount} if</div>
                )}
              </div>
              {isAdmin && (
                <span className="sr-only">
                  {who.map((id) => initials(memberMap.get(id) ?? "?")).join(" ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
