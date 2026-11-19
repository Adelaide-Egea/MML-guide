"use client";

import {
  addCraftDate,
  archiveCraftPoll,
  closeCraftPollNow,
  extendCraftPoll,
  getCraftExtraDayMessage,
  getCraftInviteMessage,
  getCraftWhatsAppMessage,
  openCraftPoll,
  setCraftChosenDate,
} from "@/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import {
  addHoursLondon,
  formatClosesExact,
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
  TZ,
} from "@/lib/dates";
import {
  bringLine,
  CRAFT_DEFAULT_DATES,
  craftHeadlineTime,
  dateVoteCounts,
  isCraftVotingOpen,
  winningCraftDate,
} from "@/lib/home-event";
import type { GroupId, HomeEvent, HomeEventResponse, Member } from "@/lib/types";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function AdminCraftPanel({
  groupId,
  event,
  members,
  responses,
}: {
  groupId: GroupId;
  event: HomeEvent | null;
  members: Pick<Member, "id" | "first_name" | "phone">[];
  responses: HomeEventResponse[];
}) {
  if (groupId !== "barnes") return null;
  if (!event) return <OpenCraftForm groupId={groupId} />;
  const closed = !isCraftVotingOpen(event);
  return closed ? (
    <CraftRecapAdmin
      groupId={groupId}
      event={event}
      members={members}
      responses={responses}
    />
  ) : (
    <CraftLiveAdmin
      groupId={groupId}
      event={event}
      members={members}
      responses={responses}
    />
  );
}

function OpenCraftForm({ groupId }: { groupId: GroupId }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dates, setDates] = useState<string[]>(CRAFT_DEFAULT_DATES);
  const [closesLocal, setClosesLocal] = useState(() =>
    formatInTimeZone(addHoursLondon(new Date(), 48), TZ, "yyyy-MM-dd'T'HH:mm"),
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(date: string) {
    setDates((prev) =>
      prev.includes(date) ? prev.filter((item) => item !== date) : [...prev, date],
    );
  }

  return (
    <section className="craft-card rounded-card p-4">
      <h2 className="font-display text-xl text-[var(--ink)]">
        🧶 Craft evening at Adelaide&apos;s
      </h2>
      <p className="mt-1 text-small text-[var(--grey)]">
        Barnes only · from 8pm · little babies welcome
      </p>
      <fieldset className="mt-4">
        <legend className="text-body font-semibold text-[var(--ink)]">Dates</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CRAFT_DEFAULT_DATES.map((date) => {
            const on = dates.includes(date);
            return (
              <button
                key={date}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(date)}
                className={`min-h-tap rounded-card border px-3 py-2 text-left ${
                  on
                    ? "border-[var(--craft-ink)] bg-[var(--craft-fill)]"
                    : "border-[var(--craft-line)] bg-[var(--background-elevated)]"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--grey)]">
                  {formatWeekdayShort(date)}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl">{formatDayNumber(date)}</span>
                  <span className="text-small text-[var(--grey)]">
                    {formatMonthShort(date)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="mt-4 block text-body font-semibold text-[var(--ink)]">
        Voting closes
        <input
          type="datetime-local"
          value={closesLocal}
          onChange={(e) => setClosesLocal(e.target.value)}
          className="mt-2 min-h-tap w-full rounded-card border border-[var(--craft-line)] bg-[var(--background-elevated)] px-3 text-body"
        />
      </label>
      {error && <p className="mt-2 text-small text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        className="mt-4 min-h-tap w-full rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-fg)]"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const closesAt = fromZonedTime(closesLocal, TZ).toISOString();
            const res = await openCraftPoll(groupId, { dates, closesAt });
            if (!res.ok) setError(res.error);
            router.refresh();
          })
        }
      >
        Open craft poll
      </button>
    </section>
  );
}

function CraftLiveAdmin({
  groupId,
  event,
  members,
  responses,
}: {
  groupId: GroupId;
  event: HomeEvent;
  members: Pick<Member, "id" | "first_name" | "phone">[];
  responses: HomeEventResponse[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [extraDate, setExtraDate] = useState("");
  const [addedDate, setAddedDate] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const byId = useMemo(
    () => new Map(members.map((member) => [member.id, member.first_name])),
    [members],
  );
  const counts = dateVoteCounts(event.dates, responses);
  const answeredIds = new Set(responses.map((row) => row.member_id));
  const phones = members.filter((member) => member.phone?.trim());
  const answeredPhones = phones.filter((member) => answeredIds.has(member.id));
  const extraForMessage =
    addedDate ??
    event.dates.filter((date) => !CRAFT_DEFAULT_DATES.includes(date)).at(-1) ??
    null;

  return (
    <section className="craft-card rounded-card p-4">
      <h2 className="font-display text-xl text-[var(--ink)]">🧶 {event.title}</h2>
      <p className="mt-1 text-small text-[var(--grey)]">
        Voting closes {formatClosesExact(event.closes_at)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.dates.map((date) => (
          <span
            key={date}
            className="rounded-full border border-[var(--craft-line)] px-3 py-1 text-small"
          >
            {formatWeekdayShort(date)} {formatDayNumber(date)} · {counts.get(date) ?? 0}
          </span>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-small">
          <thead>
            <tr className="text-[var(--grey)]">
              <th className="pb-2 pr-2 font-semibold">Who</th>
              <th className="pb-2 pr-2 font-semibold">Dates</th>
              <th className="pb-2 pr-2 font-semibold">Brings</th>
              <th className="pb-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {responses.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-[var(--grey)]">
                  Nobody has answered yet.
                </td>
              </tr>
            ) : (
              responses.map((row) => (
                <tr key={row.member_id} className="border-t border-[var(--craft-line)] align-top">
                  <td className="py-2 pr-2">{byId.get(row.member_id) ?? "Someone"}</td>
                  <td className="py-2 pr-2">
                    {row.dates.length === 0
                      ? "—"
                      : row.dates
                          .map(
                            (date) =>
                              `${formatWeekdayShort(date)} ${formatDayNumber(date)}`,
                          )
                          .join(", ")}
                  </td>
                  <td className="py-2 pr-2">{bringLine(row.bringing)}</td>
                  <td className="py-2">{row.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <label className="mt-4 block text-body font-semibold text-[var(--ink)]">
        Add another evening
        <input
          type="date"
          value={extraDate}
          onChange={(e) => setExtraDate(e.target.value)}
          className="mt-2 min-h-tap w-full rounded-card border border-[var(--craft-line)] bg-[var(--background-elevated)] px-3 text-body"
        />
      </label>
      {addError && <p className="mt-2 text-small text-[var(--danger)]">{addError}</p>}
      <button
        type="button"
        className="mt-2 min-h-tap w-full rounded-xl border border-[var(--craft-line)] bg-[var(--background-elevated)] font-semibold"
        onClick={() =>
          startTransition(async () => {
            setAddError(null);
            const res = await addCraftDate(groupId, extraDate);
            if (!res.ok) {
              setAddError(res.error);
              return;
            }
            setAddedDate(res.date);
            setExtraDate("");
            router.refresh();
          })
        }
      >
        Add evening
      </button>
      <p className="mt-3 text-small text-[var(--grey)]">
        The app doesn&apos;t send texts. Copy the note and WhatsApp them, or tell
        them one by one.
      </p>
      {(answeredPhones.length > 0 ? answeredPhones : phones).length > 0 && (
        <ul className="mt-2 space-y-1 text-small text-[var(--ink)]">
          {(answeredPhones.length > 0 ? answeredPhones : phones).map((member) => (
            <li key={member.id}>
              {member.first_name}: {member.phone}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {extraForMessage && (
          <CopyButton
            label="Copy extra-day message"
            getText={async () => {
              const res = await getCraftExtraDayMessage(groupId, extraForMessage);
              return res.ok ? res.text : null;
            }}
          />
        )}
        <button
          type="button"
          className="min-h-tap w-full rounded-xl border border-[var(--craft-line)] bg-[var(--background-elevated)] font-semibold"
          onClick={() =>
            startTransition(async () => {
              await extendCraftPoll(groupId, 12);
              router.refresh();
            })
          }
        >
          +12 hours
        </button>
        <ConfirmButton
          label="Close now"
          confirmLabel="Tap again to close"
          onConfirm={async () => {
            await closeCraftPollNow(groupId);
            router.refresh();
          }}
        />
        <CopyButton
          label="Copy invite message"
          getText={async () => {
            const res = await getCraftInviteMessage(groupId);
            return res.ok ? res.text : null;
          }}
        />
      </div>
    </section>
  );
}

function CraftRecapAdmin({
  groupId,
  event,
  members,
  responses,
}: {
  groupId: GroupId;
  event: HomeEvent;
  members: Pick<Member, "id" | "first_name" | "phone">[];
  responses: HomeEventResponse[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const chosen = winningCraftDate(event, responses);
  const byId = new Map(members.map((member) => [member.id, member.first_name]));

  return (
    <section className="craft-card rounded-card p-4">
      <h2 className="font-display text-xl text-[var(--ink)]">
        ✨ It&apos;s on! {event.title}
      </h2>
      <p className="mt-1 text-body text-[var(--ink)]">
        {chosen ? formatLongDate(chosen) : "Pick a date"} ·{" "}
        {craftHeadlineTime(event.start_time)}
      </p>
      <label className="mt-4 block text-body font-semibold text-[var(--ink)]">
        Chosen date
        <select
          value={chosen ?? ""}
          onChange={(e) =>
            startTransition(async () => {
              await setCraftChosenDate(groupId, e.target.value);
              router.refresh();
            })
          }
          className="mt-2 min-h-tap w-full rounded-card border border-[var(--craft-line)] bg-[var(--background-elevated)] px-3 text-body"
        >
          {event.dates.map((date) => (
            <option key={date} value={date}>
              {formatLongDate(date)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-small text-[var(--grey)]">
        Notes stay here — mums never see them.
      </p>
      <ul className="mt-2 space-y-1 text-small">
        {responses
          .filter((row) => row.note)
          .map((row) => (
            <li key={row.member_id}>
              <strong>{byId.get(row.member_id) ?? "Someone"}:</strong> {row.note}
            </li>
          ))}
      </ul>
      <div className="mt-4 flex flex-col gap-2">
        <CopyButton
          label="Copy WhatsApp message"
          getText={async () => {
            const res = await getCraftWhatsAppMessage(groupId);
            return res.ok ? res.text : null;
          }}
        />
        <CopyButton
          label="Copy invite message"
          getText={async () => {
            const res = await getCraftInviteMessage(groupId);
            return res.ok ? res.text : null;
          }}
        />
        <ConfirmButton
          label="Archive"
          confirmLabel="Tap again to archive"
          danger
          onConfirm={async () => {
            await archiveCraftPoll(groupId);
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}
