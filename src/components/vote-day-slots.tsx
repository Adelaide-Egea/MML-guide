"use client";

import { toggleSlotVote } from "@/actions/member";
import { Toast, useToast } from "@/components/toast";
import {
  formatClosesExact,
  formatDayNumber,
  formatMonthShort,
  formatWeekdayShort,
} from "@/lib/dates";
import type { DaySlot } from "@/lib/types";
import { useEffect, useMemo, useState, useTransition } from "react";

type MemberLite = { id: string; first_name: string };
type SlotLite = { member_id: string; date: string; slot: DaySlot };

export function VoteDaySlots({
  token,
  roundId,
  dates,
  closesAt,
  locked,
  members,
  slots,
  memberId,
}: {
  token: string;
  roundId: string;
  dates: string[];
  closesAt: string;
  locked: boolean;
  members: MemberLite[];
  slots: SlotLite[];
  memberId: string;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [live, setLive] = useState(slots);

  useEffect(() => setLive(slots), [slots]);

  const mine = useMemo(() => {
    const set = new Set(
      live
        .filter((s) => s.member_id === memberId)
        .map((s) => `${s.date}:${s.slot}`),
    );
    return set;
  }, [live, memberId]);

  const answered = useMemo(
    () => new Set(live.map((s) => s.member_id)),
    [live],
  );

  function count(date: string, slot: DaySlot) {
    return live.filter((s) => s.date === date && s.slot === slot).length;
  }

  function onToggle(date: string, slot: DaySlot) {
    if (locked) return;
    const key = `${date}:${slot}`;
    const free = !mine.has(key);
    startTransition(async () => {
      setLive((prev) => {
        if (free) {
          return [...prev, { member_id: memberId, date, slot }];
        }
        return prev.filter(
          (s) =>
            !(
              s.member_id === memberId &&
              s.date === date &&
              s.slot === slot
            ),
        );
      });
      const res = await toggleSlotVote(token, roundId, date, slot, free);
      if (!res.ok) toast.show(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-body font-semibold text-[var(--ink)]">
        {answered.size} of {members.length} replied
        {" · "}
        {locked ? "voting closed" : `voting closes ${formatClosesExact(closesAt)}`}
      </p>

      <div className="space-y-3">
        {dates.map((date) => (
          <div
            key={date}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-3"
          >
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {formatWeekdayShort(date)}
              </span>
              <span className="font-mono text-2xl">{formatDayNumber(date)}</span>
              <span className="text-sm text-[var(--muted)]">
                {formatMonthShort(date)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["morning", "afternoon"] as DaySlot[]).map((slot) => {
                const on = mine.has(`${date}:${slot}`);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={locked}
                    aria-pressed={on}
                    onClick={() => onToggle(date, slot)}
                    className={`min-h-14 rounded-xl border px-3 py-2 text-left ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <div className="text-sm font-semibold capitalize">{slot}</div>
                    <div className="font-mono text-xs text-[var(--muted)]">
                      {count(date, slot)} free
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
