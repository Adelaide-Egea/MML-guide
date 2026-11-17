"use client";

import { saveCraftResponse, getCraftSnapshot } from "@/actions/home-event";
import { Toast, useToast } from "@/components/toast";
import {
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
  initials,
} from "@/lib/dates";
import {
  BRING_OPTIONS,
  bringLine,
  bringTotals,
  comingOnDate,
  craftDeadlineLabel,
  craftHeadlineTime,
  dateVoteCounts,
  isCraftVotingOpen,
  namedComing,
  winningCraftDate,
} from "@/lib/home-event";
import type {
  BringKind,
  HomeEvent,
  Member,
  PublicHomeEventResponse,
} from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type MemberLite = Pick<Member, "id" | "first_name">;

export function CraftEveningCard({
  token,
  event,
  members,
  responses,
  member,
  myNote,
}: {
  token: string;
  event: HomeEvent;
  members: MemberLite[];
  responses: PublicHomeEventResponse[];
  member: MemberLite | null;
  myNote: string;
}) {
  const closed = !isCraftVotingOpen(event);
  if (closed) {
    return (
      <CraftRecap event={event} members={members} responses={responses} />
    );
  }
  if (!member) return null;
  return (
    <CraftPollForm
      token={token}
      event={event}
      members={members}
      responses={responses}
      member={member}
      myNote={myNote}
    />
  );
}

function CraftPollForm({
  token,
  event,
  members,
  responses,
  member,
  myNote,
}: {
  token: string;
  event: HomeEvent;
  members: MemberLite[];
  responses: PublicHomeEventResponse[];
  member: MemberLite;
  myNote: string;
}) {
  const toast = useToast();
  const mine = responses.find((row) => row.member_id === member.id);
  const [dates, setDates] = useState<string[]>(mine?.dates ?? []);
  const [bringing, setBringing] = useState<BringKind[]>(mine?.bringing ?? []);
  const [note, setNote] = useState(myNote);
  const [live, setLive] = useState(responses);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLive(responses);
  }, [responses]);

  useEffect(() => {
    const next = responses.find((row) => row.member_id === member.id);
    setDates(next?.dates ?? []);
    setBringing(next?.bringing ?? []);
  }, [responses, member.id]);

  useEffect(() => {
    setNote(myNote);
  }, [myNote]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const snap = await getCraftSnapshot(token, event.id);
        if (!cancelled && snap.responses) setLive(snap.responses);
      } catch {
        // ignore transient errors
      }
    }
    const t = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token, event.id]);

  const counts = useMemo(
    () => dateVoteCounts(event.dates, live),
    [event.dates, live],
  );
  const answered = useMemo(() => {
    const ids = new Set(live.map((row) => row.member_id));
    return members.filter((item) => ids.has(item.id));
  }, [live, members]);

  function persist(
    nextDates: string[],
    nextBring: BringKind[],
    nextNote: string,
  ) {
    void saveCraftResponse(token, event.id, {
      dates: nextDates,
      bringing: nextBring,
      note: nextNote,
    }).then((res) => {
      if (!res.ok) toast.show(res.error);
    });
  }

  function toggleDate(date: string) {
    const next = dates.includes(date)
      ? dates.filter((item) => item !== date)
      : [...dates, date];
    setDates(next);
    setLive((prev) => upsertLocal(prev, member.id, next, bringing));
    persist(next, bringing, note);
  }

  function toggleBring(kind: BringKind) {
    const next = bringing.includes(kind)
      ? bringing.filter((item) => item !== kind)
      : [...bringing, kind];
    setBringing(next);
    setLive((prev) => upsertLocal(prev, member.id, dates, next));
    persist(dates, next, note);
  }

  function onNote(value: string) {
    const clipped = value.slice(0, 300);
    setNote(clipped);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      persist(dates, bringing, clipped);
    }, 400);
  }

  const welcome = event.note?.trim() || "Little babies are very welcome!";

  return (
    <section className="craft-card rounded-card p-4">
      <h2 className="font-display text-xl text-[var(--ink)]">
        🧶 {event.title}
      </h2>
      <p className="mt-1 text-body text-[var(--ink)]">
        From <strong>{timeWord(event.start_time)}</strong>. {welcome}
      </p>
      <p className="mt-1 text-small text-[var(--grey)]">
        Voting closes <strong>{craftDeadlineLabel(event.closes_at)}</strong>
      </p>

      <fieldset className="mt-5">
        <legend className="text-body font-semibold text-[var(--ink)]">
          1. Which evenings can you come?
        </legend>
        <p className="mt-1 text-small text-[var(--grey)]">Tap all that work</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {event.dates.map((date) => {
            const on = dates.includes(date);
            const n = counts.get(date) ?? 0;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDate(date)}
                className={`craft-tile min-h-tap rounded-card border px-3 py-3 text-left ${
                  on
                    ? "border-[var(--craft-ink)] bg-[var(--craft-fill)] text-[var(--ink)]"
                    : "border-[var(--craft-line)] bg-[var(--background-elevated)] text-[var(--ink)]"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--grey)]">
                  {formatWeekdayShort(date)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl leading-none">
                    {formatDayNumber(date)}
                  </span>
                  <span className="text-sm text-[var(--grey)]">
                    {formatMonthShort(date)}
                  </span>
                </div>
                <div className="mt-1 text-small text-[var(--grey)]">
                  {n} can come
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-body font-semibold text-[var(--ink)]">
          2. What will you bring?
        </legend>
        <p className="mt-1 text-small text-[var(--grey)]">Tap as many as you like</p>
        <div className="mt-3 flex flex-col gap-2">
          {BRING_OPTIONS.map((item) => {
            const on = bringing.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleBring(item.id)}
                className={`min-h-tap rounded-card border px-4 text-left text-body ${
                  on
                    ? "border-[var(--craft-ink)] bg-[var(--craft-fill)] text-[var(--ink)]"
                    : "border-[var(--craft-line)] bg-[var(--background-elevated)] text-[var(--ink)]"
                }`}
              >
                {item.emoji} {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-body font-semibold text-[var(--ink)]">
          3. A note for Adelaide
        </span>
        <span className="mt-1 block text-small text-[var(--grey)]">
          Optional · only she sees this
        </span>
        <textarea
          value={note}
          maxLength={300}
          rows={3}
          placeholder="e.g. bringing my 3-month-old, I'll do knitting, I can bring extra scissors…"
          onChange={(e) => onNote(e.target.value)}
          className="mt-2 min-h-tap w-full rounded-card border border-[var(--craft-line)] bg-[var(--background-elevated)] p-3 text-body text-[var(--ink)]"
        />
        <span className="mt-1 block text-right text-small text-[var(--grey)]">
          {note.length}/300
        </span>
      </label>

      <p className="mt-4 text-small text-[var(--ink)]">
        {answered.length} {answered.length === 1 ? "mum has" : "mums have"}{" "}
        answered
        {answered.length > 0 ? (
          <span className="text-[var(--grey)]">
            {" "}
            · {answered.map((item) => initials(item.first_name)).join(" ")}
          </span>
        ) : null}
      </p>
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </section>
  );
}

function CraftRecap({
  event,
  members,
  responses,
}: {
  event: HomeEvent;
  members: MemberLite[];
  responses: PublicHomeEventResponse[];
}) {
  const chosen = winningCraftDate(event, responses);
  const coming = namedComing(comingOnDate(responses, chosen), members);
  const totals = bringTotals(coming);
  const welcome = event.note?.trim() || "Little babies are very welcome!";
  const emptyNudges = BRING_OPTIONS.filter(
    (item) => coming.length > 0 && totals[item.id] === 0,
  );

  return (
    <section className="craft-card rounded-card p-4">
      <h2 className="font-display text-xl text-[var(--ink)]">
        ✨ It&apos;s on! {event.title}
      </h2>
      {chosen ? (
        <p className="mt-2 text-body font-semibold text-[var(--ink)]">
          {formatLongDate(chosen)} · {craftHeadlineTime(event.start_time)}
        </p>
      ) : (
        <p className="mt-2 text-body text-[var(--ink)]">Date to be confirmed</p>
      )}
      <p className="mt-1 text-body text-[var(--ink)]">
        {welcome} 👶
      </p>

      <p className="mt-4 text-body font-semibold text-[var(--ink)]">
        Coming ({coming.length}):{" "}
        <span className="font-normal">
          {coming.length === 0
            ? "nobody yet"
            : coming.map((row) => row.name).join(", ")}
        </span>
      </p>

      {coming.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-small">
            <thead>
              <tr className="text-[var(--grey)]">
                <th className="pb-2 pr-3 font-semibold">Who</th>
                <th className="pb-2 font-semibold">Brings</th>
              </tr>
            </thead>
            <tbody>
              {coming.map((row) => (
                <tr key={row.memberId} className="border-t border-[var(--craft-line)]">
                  <td className="py-2 pr-3 text-[var(--ink)]">{row.name}</td>
                  <td className="py-2 text-[var(--ink)]">
                    {bringLine(row.bringing)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-body text-[var(--ink)]">
        <strong>Totals:</strong> 🧵 {totals.crafts} crafts · 🍰 {totals.food}{" "}
        food · 🍷 {totals.drink} drinks
      </p>
      {emptyNudges.map((item) => (
        <p key={item.id} className="mt-1 text-small text-[var(--grey)]">
          {item.emptyNudge}
        </p>
      ))}
    </section>
  );
}

function upsertLocal(
  prev: PublicHomeEventResponse[],
  memberId: string,
  dates: string[],
  bringing: BringKind[],
): PublicHomeEventResponse[] {
  const rest = prev.filter((row) => row.member_id !== memberId);
  return [
    ...rest,
    {
      event_id: prev[0]?.event_id ?? "",
      member_id: memberId,
      dates,
      bringing,
      updated_at: new Date().toISOString(),
    },
  ];
}

function timeWord(startTime: string): string {
  return craftHeadlineTime(startTime).replace(/^from /i, "");
}
