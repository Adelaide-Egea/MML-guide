"use client";

import {
  formatClosesExact,
  formatDayNumber,
  formatMonthShort,
  formatWeekdayShort,
} from "@/lib/dates";
import { countMembersReplied, dateKey } from "@/lib/replies";
import { setDateAvailability } from "@/actions/member";
import type { DateAvailability } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { Toast, useToast } from "@/components/toast";

type MemberLite = { id: string; first_name: string };
type VoteLite = {
  member_id: string;
  date: string;
  availability: DateAvailability;
};

const CHOICES: {
  value: DateAvailability;
  label: string;
  short: string;
}[] = [
  { value: "yes", label: "Yes", short: "Yes" },
  { value: "if_needed", label: "If needed", short: "If needed" },
  { value: "cant", label: "Can't", short: "Can't" },
];

export function VoteDates({
  token,
  roundId,
  dates,
  closesAt,
  locked,
  members,
  votes,
  memberId,
}: {
  token: string;
  roundId: string;
  dates: string[];
  closesAt: string;
  locked: boolean;
  members: MemberLite[];
  votes: VoteLite[];
  memberId: string;
}) {
  const toast = useToast();
  const [liveVotes, setLiveVotes] = useState(votes);

  useEffect(() => {
    setLiveVotes(votes);
  }, [votes]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { getMemberRoundSnapshot } = await import("@/actions/member");
        const snap = await getMemberRoundSnapshot(token, roundId);
        if (!cancelled && snap.votes) setLiveVotes(snap.votes as VoteLite[]);
      } catch {
        // ignore transient errors
      }
    }
    const t = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token, roundId]);

  const myMap = useMemo(() => {
    const map = new Map<string, DateAvailability>();
    for (const v of liveVotes) {
      if (v.member_id === memberId) map.set(v.date, v.availability);
    }
    return map;
  }, [liveVotes, memberId]);

  const repliedCount = useMemo(() => {
    return countMembersReplied(members, dates, liveVotes);
  }, [liveVotes, members, dates]);

  const yesCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dates) map.set(d, 0);
    for (const v of liveVotes) {
      if (v.availability === "yes" && map.has(dateKey(v.date))) {
        const key = dateKey(v.date);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [dates, liveVotes]);

  function onPick(date: string, availability: DateAvailability) {
    if (locked) return;
    if (myMap.get(date) === availability) return;
    const previous = liveVotes;
    setLiveVotes((prev) => {
      const rest = prev.filter(
        (vote) =>
          !(vote.member_id === memberId && dateKey(vote.date) === dateKey(date)),
      );
      return [...rest, { member_id: memberId, date, availability }];
    });
    void setDateAvailability(token, roundId, date, availability).then((res) => {
      if (!res.ok) {
        setLiveVotes(previous);
        toast.show(res.error);
      }
    });
  }

  const closesLabel = formatClosesExact(closesAt);
  const closed = locked || new Date(closesAt) <= new Date();

  return (
    <div className="space-y-4">
      <p className="text-body font-semibold text-[var(--ink)]">
        {repliedCount} of {members.length} replied
        {" · "}
        {closed ? "voting closed" : `voting closes ${closesLabel}`}
      </p>

      <div className="space-y-3">
        {dates.map((date) => {
          const picked = myMap.get(dateKey(date)) ?? myMap.get(date);
          return (
            <div
              key={date}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <div className="mb-3 flex items-end justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {formatWeekdayShort(date)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl leading-none">
                      {formatDayNumber(date)}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {formatMonthShort(date)}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-[var(--muted)]">
                  {yesCounts.get(date) ?? 0} yes
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CHOICES.map((c) => {
                  const on = picked === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      disabled={locked}
                      aria-pressed={on}
                      onClick={() => onPick(date, c.value)}
                      className={`min-h-tap rounded-card border px-1 text-center text-small font-semibold ${
                        on
                          ? "border-[var(--gold)] bg-white text-[var(--ink)]"
                          : "border-[var(--line)] bg-white text-[var(--ink)]"
                      } ${locked ? "opacity-70" : ""}`}
                    >
                      {c.short}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
