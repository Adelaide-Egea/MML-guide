"use client";

import { toggleOptionPick } from "@/actions/member";
import { Toast, useToast } from "@/components/toast";
import type { MeetingPlace } from "@/lib/options";
import { useEffect, useMemo, useRef, useState } from "react";

type PickLite = { member_id: string; option_id: string };

export function VoteAreas({
  token,
  roundId,
  places,
  picks,
  memberId,
  locked,
  showIntro = true,
}: {
  token: string;
  roundId: string;
  places: MeetingPlace[];
  picks: PickLite[];
  memberId: string;
  locked: boolean;
  showIntro?: boolean;
}) {
  const toast = useToast();
  const [live, setLive] = useState(picks);
  const pending = useRef(new Map<string, boolean>());

  useEffect(() => {
    setLive(picks);
  }, [picks]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { getMemberRoundSnapshot } = await import("@/actions/member");
        const snap = await getMemberRoundSnapshot(token, roundId);
        if (cancelled || !snap.picks) return;
        setLive((current) => mergePending(snap.picks, current, pending.current, memberId));
      } catch {
        // ignore transient errors
      }
    }
    const timer = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, roundId, memberId]);

  const mine = useMemo(
    () =>
      new Set(
        live.filter((pick) => pick.member_id === memberId).map((pick) => pick.option_id),
      ),
    [live, memberId],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const place of places) map.set(place.id, 0);
    for (const pick of live) {
      if (map.has(pick.option_id)) {
        map.set(pick.option_id, (map.get(pick.option_id) ?? 0) + 1);
      }
    }
    return map;
  }, [places, live]);

  const grouped = useMemo(() => {
    const map = new Map<string, MeetingPlace[]>();
    for (const place of places) {
      const list = map.get(place.area) ?? [];
      list.push(place);
      map.set(place.area, list);
    }
    return [...map.entries()];
  }, [places]);

  function onToggle(optionId: string) {
    if (locked) return;
    const chosen = !mine.has(optionId);
    const previous = live;
    pending.current.set(optionId, chosen);
    setLive((prev) => applyPick(prev, memberId, optionId, chosen));
    void toggleOptionPick(token, roundId, optionId, chosen).then((res) => {
      pending.current.delete(optionId);
      if (!res.ok) {
        setLive(previous);
        toast.show(res.error);
      }
    });
  }

  if (places.length === 0) return null;

  return (
    <div className={showIntro ? "mt-6 space-y-4 border-t border-[var(--line)] pt-4" : "space-y-4"}>
      {showIntro && (
        <p className="text-body font-semibold text-[var(--ink)]">Where</p>
      )}
      {grouped.map(([area, spots]) => (
        <div key={area} className="space-y-2">
          <p className="text-small font-semibold text-[var(--grey)]">{area}</p>
          {spots.map((place) => {
            const on = mine.has(place.id);
            const detail =
              place.venue && place.venue !== place.title ? place.venue : null;
            return (
              <button
                key={place.id}
                type="button"
                disabled={locked}
                aria-pressed={on}
                onClick={() => onToggle(place.id)}
                className={`flex min-h-tap w-full items-center justify-between gap-3 rounded-card border bg-white px-4 py-2 text-left text-[var(--ink)] ${
                  on ? "border-[var(--gold)]" : "border-[var(--line)]"
                } ${locked ? "opacity-70" : ""}`}
              >
                <span>
                  <span className="block text-body font-semibold">{place.title}</span>
                  {detail && (
                    <span className="block text-small font-normal text-[var(--grey)]">
                      {detail}
                    </span>
                  )}
                </span>
                <span className="text-small font-normal text-[var(--grey)]">
                  {counts.get(place.id) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      ))}
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}

function applyPick(
  picks: PickLite[],
  memberId: string,
  optionId: string,
  chosen: boolean,
): PickLite[] {
  const rest = picks.filter(
    (pick) => !(pick.member_id === memberId && pick.option_id === optionId),
  );
  return chosen ? [...rest, { member_id: memberId, option_id: optionId }] : rest;
}

function mergePending(
  server: PickLite[],
  current: PickLite[],
  pendingPicks: Map<string, boolean>,
  memberId: string,
): PickLite[] {
  let next = server.filter((pick) => !pendingPicks.has(pick.option_id) || pick.member_id !== memberId);
  for (const [optionId, chosen] of pendingPicks) {
    next = applyPick(next, memberId, optionId, chosen);
  }
  if (pendingPicks.size === 0) return server;
  return next.length === current.length ? next : next;
}
