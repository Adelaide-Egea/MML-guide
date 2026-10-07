"use client";

import { toggleOptionPick } from "@/actions/member";
import { OptionComments } from "@/components/option-comments";
import { SuggestPlace } from "@/components/suggest-place";
import { TicketCard } from "@/components/ticket-card";
import { Toast, useToast } from "@/components/toast";
import { formatFromTime, formatLongDate, initials } from "@/lib/dates";
import { filterPickOptions, sortByHearts, tabsForGroup } from "@/lib/options";
import type { Group, Member, Option, OptionComment } from "@/lib/types";
import { useMemo, useOptimistic, useState, useTransition } from "react";

export function PickPlan({
  token,
  roundId,
  group,
  chosenDate,
  freeNames,
  options,
  picks,
  comments = [],
  members,
  memberId,
  isAdmin,
  onBook,
}: {
  token: string;
  roundId: string;
  group: Group;
  chosenDate: string;
  freeNames: string[];
  options: Option[];
  picks: { member_id: string; option_id: string }[];
  comments?: OptionComment[];
  members: Member[];
  memberId: string;
  isAdmin?: boolean;
  onBook?: (optionId: string) => void;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const tabs = tabsForGroup(group.id).filter((t) =>
    options.some((o) => o.kind === t.kind),
  );
  const [tab, setTab] = useState(tabs[0]?.kind ?? "show");

  const myPicks = useMemo(
    () =>
      new Set(
        picks.filter((p) => p.member_id === memberId).map((p) => p.option_id),
      ),
    [picks, memberId],
  );

  const [optimisticMine, setOptimisticMine] = useOptimistic(
    myPicks,
    (current: Set<string>, action: { optionId: string; liked: boolean }) => {
      const next = new Set(current);
      if (action.liked) next.add(action.optionId);
      else next.delete(action.optionId);
      return next;
    },
  );

  const heartCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of picks) {
      map.set(p.option_id, (map.get(p.option_id) ?? 0) + 1);
    }
    for (const id of myPicks) {
      if (!optimisticMine.has(id)) {
        map.set(id, Math.max(0, (map.get(id) ?? 0) - 1));
      }
    }
    for (const id of optimisticMine) {
      if (!myPicks.has(id)) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [picks, myPicks, optimisticMine]);

  const eligible = filterPickOptions(group, options, chosenDate);
  const inTab = eligible.filter((row) => row.option.kind === tab);
  const sorted = sortByHearts(
    inTab.map((row) => row.option),
    heartCounts,
  )
    .map((opt) => inTab.find((row) => row.option.id === opt.id)!)
    .sort((a, b) => {
      if (a.closed !== b.closed) return a.closed ? 1 : -1;
      const ha = heartCounts.get(a.option.id) ?? 0;
      const hb = heartCounts.get(b.option.id) ?? 0;
      if (ha !== hb) return hb - ha;
      if (a.option.is_new !== b.option.is_new) return a.option.is_new ? -1 : 1;
      const pa = a.option.price_from ?? Number.POSITIVE_INFINITY;
      const pb = b.option.price_from ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return a.option.title.localeCompare(b.option.title);
    });

  const memberMap = new Map(members.map((m) => [m.id, m.first_name]));

  function initialsFor(optionId: string) {
    return picks
      .filter((p) => p.option_id === optionId)
      .map((p) => initials(memberMap.get(p.member_id) ?? "?"))
      .slice(0, 6);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-display text-2xl">{formatLongDate(chosenDate)}</p>
        <p className="text-sm text-[var(--muted)]">
          {formatFromTime(group.start_time)}
          {group.arrival_note ? ` · ${group.arrival_note}` : ""}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Free: {freeNames.join(", ") || "—"}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.kind}
            type="button"
            aria-pressed={tab === t.kind}
            onClick={() => setTab(t.kind)}
            className={`min-h-tap shrink-0 rounded-card border px-4 text-small font-semibold ${
              tab === t.kind
                ? "border-[var(--gold)] bg-white text-[var(--ink)]"
                : "border-[var(--line)] bg-white text-[var(--ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--foreground)]">
        These are your preferences for{" "}
        <span className="font-semibold">{formatLongDate(chosenDate)}</span>.
        {" "}
        <span className="font-semibold text-[var(--gold)]">Gold</span> means
        I&apos;d love this one
        {" "}
        — if it can&apos;t be booked, we&apos;ll try the next favourite. Greyed
        places are closed that day (no hearts).
      </p>

      {tab === "show" && group.id === "french" && (
        <p className="text-sm text-[var(--muted)]">
          Prices are the cheapest seats. Check there&apos;s a block of seats
          together before booking.
        </p>
      )}

      {!isAdmin && (
        <SuggestPlace token={token} groupId={group.id} compact />
      )}

      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
            Nothing fits this date yet — suggest a place above, or ask the
            organiser to add ideas.
          </p>
        )}
        {sorted.map(({ option: o, closed, closedLabel }) => (
          <div key={o.id}>
            <TicketCard
              title={o.title}
              venue={o.venue}
              station={o.station}
              lines={o.lines}
              preferredLines={group.preferred_lines}
              note={o.note}
              availabilityNote={closed ? null : o.availability_note}
              priceFrom={o.price_from}
              runsTo={o.runs_to}
              isNew={o.is_new}
              url={closed ? null : o.url}
              closed={closed}
              closedLabel={closedLabel}
              heart={!closed && optimisticMine.has(o.id)}
              heartCount={heartCounts.get(o.id) ?? 0}
              heartInitials={initialsFor(o.id)}
              onHeart={
                closed
                  ? undefined
                  : () => {
                      const liked = !optimisticMine.has(o.id);
                      startTransition(async () => {
                        setOptimisticMine({ optionId: o.id, liked });
                        const res = await toggleOptionPick(
                          token,
                          roundId,
                          o.id,
                          liked,
                        );
                        if (!res.ok) toast.show(res.error);
                      });
                    }
              }
              adminAction={
                isAdmin && onBook && !closed ? (
                  <button
                    type="button"
                    onClick={() => onBook(o.id)}
                    className="min-h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
                  >
                    Book this
                  </button>
                ) : null
              }
            />
            {!closed && (
              <OptionComments
                token={token}
                optionId={o.id}
                comments={comments}
                memberNames={memberMap}
                canPost={!isAdmin}
              />
            )}
          </div>
        ))}
      </div>
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
