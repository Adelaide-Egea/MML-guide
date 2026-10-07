"use client";

import {
  bookOption,
  cancelRound,
  changeDate,
  changePlan,
  chooseDate,
  closeVotingNow,
  extendVoting,
  finishRound,
  getDecidedMessage,
  getPickMessage,
  getPresenceMessage,
  getWhatsAppVoteMessage,
  openVoting,
  setPresenceOpen,
} from "@/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { DayResultsView } from "@/components/day-results";
import { PickPlan } from "@/components/pick-plan";
import { ResultsView } from "@/components/results-view";
import { BigNightTicket } from "@/components/ticket-card";
import {
  formatFromTime,
  formatLongDate,
  generateCandidateDates,
} from "@/lib/dates";
import { groupInvitePath } from "@/lib/invite-paths";
import { meetingPlaces } from "@/lib/options";
import { dateKey } from "@/lib/replies";
import { memberChannel } from "@/lib/types";
import type { Group, Member, Option, Round } from "@/lib/types";
import { votingStep } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AdminRoundPanel({
  group,
  round,
  members,
  votes,
  slotVotes = [],
  picks,
  options,
  token,
  launchPreferredKind,
  launchLockedKinds = [],
  startCollapsed = false,
  view = "poll",
}: {
  group: Group;
  round: Round | null;
  members: Member[];
  votes: {
    member_id: string;
    date: string;
    availability?: import("@/lib/types").DateAvailability;
  }[];
  slotVotes?: { member_id: string; date: string; slot: "morning" | "afternoon" }[];
  picks: { member_id: string; option_id: string }[];
  options: Option[];
  token: string;
  launchPreferredKind?: "evening" | "day";
  launchLockedKinds?: Array<"evening" | "day">;
  /** Hide the planner until she asks, when another poll is already open. */
  startCollapsed?: boolean;
  /** Poll is the actions. Results is the scoreboard. */
  view?: "poll" | "results";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const step = votingStep(round);
  const isDay = round?.kind === "day";

  const roster = members.filter(
    (member) => memberChannel(member) === (isDay ? "day" : "evening"),
  );
  const stillGoing = dateProgress(roster, round?.dates ?? [], isDay ? slotVotes : votes);

  if (view === "results") {
    if (!round || round.status === "done" || round.status === "cancelled") {
      return <p className="text-body text-[var(--ink)]">No poll open.</p>;
    }
    return (
      <div className="rounded-card border border-[var(--line)] bg-white p-4">
        {isDay ? (
          <DayResultsView dates={round.dates} slots={slotVotes} members={members} />
        ) : (
          <ResultsView
            dates={round.dates}
            votes={votes}
            members={members}
            picks={picks}
            places={meetingPlaces(group, options)}
            isAdmin
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!round || round.status === "done" || round.status === "cancelled" ? (
        <LaunchPanel
          group={group}
          preferredKind={launchPreferredKind}
          lockedKinds={launchLockedKinds}
          startCollapsed={startCollapsed}
        />
      ) : (
        <>
          {step === 1 && round.status === "voting" && (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
              <h3 className="font-display text-xl">
                {isDay ? "Day walk — voting" : "Night out — voting"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm"
                  onClick={() =>
                    startTransition(async () => {
                      await extendVoting(group.id, 12, round.id);
                      router.refresh();
                    })
                  }
                >
                  +12 hours
                </button>
                <ConfirmButton
                  label="Close now"
                  onConfirm={async () => {
                    await closeVotingNow(group.id, round.id);
                    router.refresh();
                  }}
                />
                <ConfirmButton
                  label="Cancel round"
                  danger
                  onConfirm={async () => {
                    await cancelRound(group.id, round.id);
                    router.refresh();
                  }}
                />
              </div>
              <div>
                <p className="text-body font-semibold">Still going</p>
                {stillGoing.length === 0 ? (
                  <p className="mt-1 text-body text-[var(--grey)]">Done</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {stillGoing.map((line) => (
                      <li key={line.name} className="text-body">
                        <span className="font-semibold">{line.name}</span>
                        <span className="text-[var(--grey)]"> · {line.detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <CopyButton
                  className="mt-2"
                  label="Copy reminder"
                  getText={() => {
                    const names = stillGoing.map((line) => line.name).join(", ");
                    const need = isDay ? "times" : "dates";
                    const invitePath = groupInvitePath(
                      group,
                      isDay ? "day" : "evening",
                    );
                    return names
                      ? `Still need ${need} from: ${names}. ${typeof window !== "undefined" ? window.location.origin : ""}${invitePath}`
                      : null;
                  }}
                />
              </div>
              <CopyButton
                label="Copy WhatsApp message"
                getText={async () => {
                  const res = await getWhatsAppVoteMessage(group.id, round.id);
                  return res.ok ? res.text : null;
                }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
              <h3 className="font-display text-xl">Results</h3>
              {isDay ? (
                <DayResultsBlock
                  dates={round.dates}
                  slots={slotVotes}
                  members={members}
                  onChoose={(date) =>
                    startTransition(async () => {
                      await chooseDate(group.id, date, round.id);
                      router.refresh();
                    })
                  }
                />
              ) : (
                <ResultsView
                  dates={round.dates}
                  votes={votes}
                  members={members}
                  picks={picks}
                  places={meetingPlaces(group, options)}
                  isAdmin
                  onChoose={(date) =>
                    startTransition(async () => {
                      await chooseDate(group.id, date, round.id);
                      router.refresh();
                    })
                  }
                />
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm"
                  onClick={() =>
                    startTransition(async () => {
                      await extendVoting(group.id, 12, round.id);
                      router.refresh();
                    })
                  }
                >
                  Reopen 12h
                </button>
              </div>
              <p className="text-sm text-[var(--muted)]">
                After you pick the date, you can open just that night so people
                can still add their name.
              </p>
            </div>
          )}

          {step === 3 && round.chosen_date && !isDay && (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
              <PresenceControls
                groupId={group.id}
                roundId={round.id}
                date={round.chosen_date}
                open={round.presence_open}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <ConfirmButton
                  label="Change date"
                  onConfirm={async () => {
                    await changeDate(group.id, round.id);
                    router.refresh();
                  }}
                />
                <CopyButton
                  label="Copy message"
                  getText={async () => {
                    const res = await getPickMessage(group.id, round.id);
                    return res.ok ? res.text : null;
                  }}
                />
              </div>
              <PickPlan
                token={token}
                roundId={round.id}
                group={group}
                chosenDate={round.chosen_date}
                freeNames={votes
                  .filter(
                    (v) =>
                      v.date === round.chosen_date &&
                      (v.availability ?? "yes") !== "cant",
                  )
                  .map(
                    (v) =>
                      members.find((m) => m.id === v.member_id)?.first_name ??
                      "?",
                  )}
                options={options}
                picks={picks}
                members={members}
                memberId={members[0]?.id ?? ""}
                isAdmin
                onBook={(optionId) =>
                  startTransition(async () => {
                    await bookOption(group.id, optionId, round.id);
                    router.refresh();
                  })
                }
              />
            </div>
          )}

          {step === 4 && round.chosen_date && (
            isDay ? (
              <DayDecidedAdmin
                groupId={group.id}
                roundId={round.id}
                date={round.chosen_date}
                meetingPoint={round.meeting_point}
                pushchairFriendly={round.pushchair_friendly}
                coffeeStop={round.coffee_stop}
                presenceOpen={round.presence_open}
              />
            ) : round.chosen_option_id ? (
              <DecidedAdmin
                group={group}
                roundId={round.id}
                option={options.find((o) => o.id === round.chosen_option_id)!}
                date={round.chosen_date}
                presenceOpen={round.presence_open}
              />
            ) : null
          )}

        </>
      )}
    </div>
  );
}

function DayResultsBlock({
  dates,
  slots,
  members,
  onChoose,
}: {
  dates: string[];
  slots: { member_id: string; date: string; slot: "morning" | "afternoon" }[];
  members: Member[];
  onChoose: (date: string) => void;
}) {
  return (
    <DayResultsView
      dates={dates}
      slots={slots}
      members={members}
      isAdmin
      onChoose={onChoose}
    />
  );
}

function DayDecidedAdmin({
  groupId,
  roundId,
  date,
  meetingPoint,
  pushchairFriendly,
  coffeeStop,
  presenceOpen,
}: {
  groupId: Group["id"];
  roundId: string;
  date: string;
  meetingPoint?: string | null;
  pushchairFriendly?: boolean | null;
  coffeeStop?: string | null;
  presenceOpen: boolean;
}) {
  const router = useRouter();
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
      <PresenceControls
        groupId={groupId}
        roundId={roundId}
        date={date}
        open={presenceOpen}
      />
      <h3 className="font-display text-title">Day walk locked in</h3>
      <p className="font-mono text-sm">{formatLongDate(date)}</p>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Meeting point</dt>
          <dd>{meetingPoint?.trim() || "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Pushchair-friendly</dt>
          <dd>
            {pushchairFriendly == null
              ? "—"
              : pushchairFriendly
                ? "Yes"
                : "No"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Coffee stop</dt>
          <dd>{coffeeStop?.trim() || "—"}</dd>
        </div>
      </dl>
      <ConfirmButton
        label="Done"
        onConfirm={async () => {
          await finishRound(groupId, roundId);
          router.refresh();
        }}
      />
    </div>
  );
}

function LaunchPanel({
  group,
  preferredKind,
  lockedKinds = [],
  startCollapsed = false,
}: {
  group: Group;
  preferredKind?: "evening" | "day";
  lockedKinds?: Array<"evening" | "day">;
  startCollapsed?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initialKind =
    preferredKind && !lockedKinds.includes(preferredKind)
      ? preferredKind
      : lockedKinds.includes("evening")
        ? "day"
        : "evening";
  const [kind, setKind] = useState<"evening" | "day">(initialKind);
  const [evenings, setEvenings] = useState(
    initialKind === "day" ? [1, 2, 3, 4, 5] : group.evenings,
  );
  const [leadDays, setLeadDays] = useState(group.lead_days);
  const [horizonDays, setHorizonDays] = useState(group.horizon_days);
  const [voteHours, setVoteHours] = useState(group.vote_hours);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [pushchairFriendly, setPushchairFriendly] = useState(true);
  const [coffeeStop, setCoffeeStop] = useState("");
  const [plannerOpen, setPlannerOpen] = useState(!startCollapsed);
  const dayChoices = kind === "day" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
  const generated = useMemo(
    () => generateCandidateDates(evenings, leadDays, horizonDays),
    [evenings, leadDays, horizonDays],
  );
  const [dates, setDates] = useState<string[] | null>(null);
  const preview = dates ?? generated;
  const nightOk = !lockedKinds.includes("evening");
  const dayOk = group.supports_day_meetups && !lockedKinds.includes("day");
  const showKindToggle = nightOk && dayOk;
  if (!plannerOpen) {
    return (
      <div className="flex flex-col gap-2">
        {nightOk && (
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-card border border-[var(--line)] bg-white text-small font-semibold"
            onClick={() => {
              setKind("evening");
              setEvenings(group.evenings);
              setDates(null);
              setPlannerOpen(true);
            }}
          >
            Plan a night out
          </button>
        )}
        {dayOk && (
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-card border border-[var(--line)] bg-white text-small font-semibold"
            onClick={() => {
              setKind("day");
              setEvenings([1, 2, 3, 4, 5]);
              setDates(null);
              setPlannerOpen(true);
            }}
          >
            Plan a day walk
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">
          {kind === "day" ? "Plan a day walk" : "Plan the next night out"}
        </h3>
        {startCollapsed && (
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-[var(--grey)]"
            onClick={() => setPlannerOpen(false)}
          >
            Close
          </button>
        )}
      </div>
      {showKindToggle && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={lockedKinds.includes("evening")}
            aria-pressed={kind === "evening"}
            className={`min-h-12 rounded-xl px-3 text-sm font-semibold ${
              kind === "evening"
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "border border-[var(--border)]"
            } disabled:opacity-40`}
            onClick={() => {
              setKind("evening");
              setEvenings(group.evenings);
              setDates(null);
            }}
          >
            Night out
          </button>
          <button
            type="button"
            disabled={lockedKinds.includes("day")}
            aria-pressed={kind === "day"}
            className={`min-h-12 rounded-xl px-3 text-sm font-semibold ${
              kind === "day"
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "border border-[var(--border)]"
            } disabled:opacity-40`}
            onClick={() => {
              setKind("day");
              setEvenings([1, 2, 3, 4, 5]);
              setDates(null);
            }}
          >
            Day walk
          </button>
        </div>
      )}
      {kind === "day" && (
        <div className="space-y-3 rounded-xl border border-[var(--border)] p-3">
          <label className="block text-sm">
            <span className="font-semibold">Meeting point</span>
            <input
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="e.g. Barnes Pond"
              className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
            />
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={pushchairFriendly}
              onChange={(e) => setPushchairFriendly(e.target.checked)}
              className="h-5 w-5"
            />
            Pushchair-friendly
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Coffee stop</span>
            <input
              value={coffeeStop}
              onChange={(e) => setCoffeeStop(e.target.value)}
              placeholder="e.g. Gail's / Olympic Studios"
              className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
            />
          </label>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold">
          {kind === "day" ? "Days" : "Evenings"}
        </p>
        <div className="flex flex-wrap gap-2">
          {dayChoices.map((d) => {
            const on = evenings.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                className={`min-h-11 rounded-xl px-3 text-sm ${
                  on
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "border border-[var(--border)]"
                }`}
                onClick={() => {
                  setDates(null);
                  setEvenings((prev) =>
                    on ? prev.filter((x) => x !== d) : [...prev, d].sort(),
                  );
                }}
              >
                {DAY_LABELS[d]}
              </button>
            );
          })}
        </div>
      </div>
      <Stepper
        label="Earliest"
        value={leadDays}
        unit="days"
        step={1}
        min={1}
        onChange={(v) => {
          setDates(null);
          setLeadDays(v);
        }}
        hint={generated[0] ? `from ${generated[0]}` : "no dates"}
      />
      <Stepper
        label="Latest"
        value={horizonDays}
        unit="days"
        step={1}
        min={leadDays}
        onChange={(v) => {
          setDates(null);
          setHorizonDays(v);
        }}
        hint={generated.at(-1) ? `until ${generated.at(-1)}` : "no dates"}
      />
      <Stepper
        label="Voting open for"
        value={voteHours}
        unit="h"
        step={6}
        min={6}
        onChange={setVoteHours}
      />
      <div className="flex flex-wrap gap-2">
        {preview.map((d) => (
          <button
            key={d}
            type="button"
            className="min-h-11 rounded-full border border-[var(--border)] px-3 font-mono text-xs"
            onClick={() =>
              setDates(preview.filter((x) => x !== d))
            }
            title="Tap to remove"
          >
            {d} ×
          </button>
        ))}
      </div>
      <button
        type="button"
        className="min-h-12 w-full rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-fg)]"
        onClick={() =>
          startTransition(async () => {
            await openVoting(group.id, {
              evenings,
              leadDays,
              horizonDays,
              voteHours,
              dates: preview,
              kind,
              meeting_point: meetingPoint.trim() || null,
              pushchair_friendly: pushchairFriendly,
              coffee_stop: coffeeStop.trim() || null,
            });
            router.refresh();
          })
        }
      >
        Open {kind === "day" ? "day walk" : "night out"} voting
      </button>
    </div>
  );
}

function Stepper({
  label,
  value,
  unit,
  step,
  min,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="font-mono text-xs text-[var(--muted)]">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]"
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <span className="min-w-14 text-center font-mono text-sm">
          {value}
          {unit}
        </span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]"
          onClick={() => onChange(value + step)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function DecidedAdmin({
  group,
  roundId,
  option,
  date,
  presenceOpen,
}: {
  group: Group;
  roundId: string;
  option: Option;
  date: string;
  presenceOpen: boolean;
}) {
  const router = useRouter();

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] p-3 sm:p-4">
      <PresenceControls
        groupId={group.id}
        roundId={roundId}
        date={date}
        open={presenceOpen}
      />
      <BigNightTicket
        title={option.title}
        venue={option.venue}
        area={option.area}
        dateLabel={formatLongDate(date)}
        timeLabel={formatFromTime(group.start_time)}
        arrivalNote={group.arrival_note}
        station={option.station}
        lines={option.lines}
        preferredLines={group.preferred_lines}
        url={option.url}
        date={date}
        startTime={group.start_time}
        shareText={`It's on! 🎭 ${option.title}${option.venue ? ` at ${option.venue}` : ""} — ${formatLongDate(date)}, ${formatFromTime(group.start_time)}.`}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <CopyButton
          label="Copy message"
          getText={async () => {
            const res = await getDecidedMessage(group.id, roundId);
            return res.ok ? res.text : null;
          }}
        />
        <ConfirmButton
          label="Change plan"
          onConfirm={async () => {
            await changePlan(group.id, roundId);
            router.refresh();
          }}
        />
        <ConfirmButton
          label="Done"
          onConfirm={async () => {
            await finishRound(group.id, roundId);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

function PresenceControls({
  groupId,
  roundId,
  date,
  open,
}: {
  groupId: Group["id"];
  roundId: string;
  date: string;
  open: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
      <p className="text-sm font-semibold">
        {open
          ? `Taking names on ${formatLongDate(date)}`
          : "Open the final choice"}
      </p>
      <p className="text-sm text-[var(--muted)]">
        {open
          ? "The rest of the poll stays closed. People can still say if they're coming."
          : "Open only this date so people can add themselves without reopening the whole poll."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-medium"
          onClick={() =>
            startTransition(async () => {
              await setPresenceOpen(groupId, !open, roundId);
              router.refresh();
            })
          }
        >
          {open ? "Stop taking names" : "Open the final choice"}
        </button>
        {open && (
          <CopyButton
            label="Copy message"
            getText={async () => {
              const res = await getPresenceMessage(groupId, roundId);
              return res.ok ? res.text : null;
            }}
          />
        )}
      </div>
    </div>
  );
}

function dateProgress(
  roster: { first_name: string; id: string }[],
  dates: string[],
  votes: { member_id: string; date: string }[],
): { name: string; detail: string }[] {
  const open = new Set(dates.map(dateKey));
  return roster
    .map((member) => {
      const hit = new Set<string>();
      for (const vote of votes) {
        if (vote.member_id !== member.id) continue;
        const key = dateKey(vote.date);
        if (open.size > 0 && !open.has(key)) continue;
        hit.add(key);
      }
      return { name: member.first_name, count: hit.size };
    })
    .filter((line) => dates.length === 0 || line.count < dates.length)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
    .map((line) => ({
      name: line.name,
      detail: line.count === 0 ? "not started" : `${line.count} of ${dates.length}`,
    }));
}

