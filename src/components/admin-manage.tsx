"use client";

import {
  addMemberAction,
  approvePendingOption,
  deactivateMemberAction,
  deleteOptionAction,
  markOptionSeenAction,
  renameMemberAction,
  saveOptionAction,
} from "@/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import { ALL_LINE_KEYS } from "@/lib/tfl";
import type { Group, Member, Option, OptionKind, RoundKind } from "@/lib/types";
import { memberChannel } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminManage({
  group,
  members,
  options,
  part,
}: {
  group: Group;
  members: Member[];
  options: Option[];
  part: "names" | "ideas";
}) {
  if (part === "names") return <MembersPanel group={group} members={members} />;
  return <OptionsPanel groupId={group.id} options={options} />;
}

function MembersPanel({
  group,
  members,
}: {
  group: Group;
  members: Member[];
}) {
  const groupId = group.id;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<RoundKind>("evening");

  return (
    <section>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="space-y-2 rounded-xl border border-[var(--border)] px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                defaultValue={m.first_name}
                className="min-h-11 flex-1 rounded-lg border border-transparent bg-transparent px-2"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== m.first_name) {
                    startTransition(async () => {
                      await renameMemberAction(groupId, m.id, v);
                      router.refresh();
                    });
                  }
                }}
              />
              <ConfirmButton
                label="Deactivate"
                danger
                onConfirm={async () => {
                  await deactivateMemberAction(groupId, m.id);
                  router.refresh();
                }}
              />
            </div>
            {memberMeta(group, m) && (
              <p className="px-2 text-small text-[var(--grey)]">{memberMeta(group, m)}</p>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          startTransition(async () => {
            await addMemberAction(groupId, name, channel);
            setName("");
            router.refresh();
          });
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          className="min-h-11 flex-1 rounded-xl border border-[var(--border)] px-3"
        />
        {group.supports_day_meetups && (
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as RoundKind)}
            className="min-h-11 rounded-xl border border-[var(--border)] px-3 text-sm"
          >
            <option value="evening">Night out</option>
            <option value="day">Day walk</option>
          </select>
        )}
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] sm:self-auto"
        >
          Add
        </button>
      </form>
    </section>
  );
}

function memberMeta(group: Group, member: Member): string | null {
  const bits = [
    group.supports_day_meetups
      ? memberChannel(member) === "day"
        ? "Day walk"
        : "Night out"
      : null,
    member.phone,
  ].filter(Boolean);
  return bits.length > 0 ? bits.join(" · ") : null;
}

function OptionsPanel({
  groupId,
  options,
}: {
  groupId: Group["id"];
  options: Option[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="rounded-2xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Close" : "Add"}
        </button>
      </div>
      {showForm && (
        <OptionForm
          groupId={groupId}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
      <ul className="mt-4 space-y-2">
        {options.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-[var(--border)] p-3 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {o.title}{" "}
                  <span className="text-[var(--muted)]">· {o.kind}</span>
                  {o.seen && (
                    <span className="ml-2 text-[var(--muted)]">(seen)</span>
                  )}
                  {o.upcoming && (
                    <span className="ml-2 text-[var(--gold)]">coming soon</span>
                  )}
                  {o.status === "pending" && (
                    <span className="ml-2 text-[var(--accent)]">pending</span>
                  )}
                </p>
                {o.venue && (
                  <p className="text-[var(--muted)]">{o.venue}</p>
                )}
                {o.availability_note && (
                  <p className="mt-1 text-xs text-[var(--accent)]">
                    {o.availability_note}
                  </p>
                )}
                {o.open_days && o.open_days.length > 0 && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    Open:{" "}
                    {o.open_days
                      .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                {o.status === "pending" && (
                  <button
                    type="button"
                    className="min-h-11 rounded-xl bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]"
                    onClick={() =>
                      startTransition(async () => {
                        await approvePendingOption(groupId, o.id);
                        router.refresh();
                      })
                    }
                  >
                    Approve
                  </button>
                )}
                {!o.seen && (
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-[var(--border)] px-3 text-xs"
                    onClick={() =>
                      startTransition(async () => {
                        await markOptionSeenAction(groupId, o.id);
                        router.refresh();
                      })
                    }
                  >
                    Mark seen
                  </button>
                )}
                <ConfirmButton
                  label="Remove"
                  danger
                  onConfirm={async () => {
                    await deleteOptionAction(groupId, o.id);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OptionForm({
  groupId,
  onSaved,
}: {
  groupId: Group["id"];
  onSaved: () => void;
}) {
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<OptionKind>("drinks");
  const [venue, setVenue] = useState("");
  const [area, setArea] = useState("");
  const [station, setStation] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [runsFrom, setRunsFrom] = useState("");
  const [runsTo, setRunsTo] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [upcoming, setUpcoming] = useState(false);
  const [flexible, setFlexible] = useState(true);
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [openDays, setOpenDays] = useState<number[]>([]);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <form
      className="mt-4 space-y-3 rounded-xl bg-[var(--background)] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await saveOptionAction(groupId, {
            title,
            kind,
            venue,
            area,
            station,
            lines,
            price_from: price ? Number(price) : null,
            runs_from: runsFrom || null,
            runs_to: runsTo || null,
            url,
            note,
            is_new: isNew,
            upcoming,
            flexible_arrival: flexible,
            open_days: openDays.length ? openDays : null,
            availability_note: availabilityNote,
          });
          onSaved();
        });
      }}
    >
      <input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as OptionKind)}
        className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3"
      >
        <option value="show">Show</option>
        <option value="drinks">Drinks</option>
        <option value="food">Food</option>
        <option value="activity">Activity</option>
      </select>
      <input
        placeholder="Venue"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3"
      />
      <input
        placeholder="Area"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3"
      />
      <input
        placeholder="Station"
        value={station}
        onChange={(e) => setStation(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3"
      />
      <div className="flex flex-wrap gap-2">
        {ALL_LINE_KEYS.map((line) => {
          const on = lines.includes(line);
          return (
            <button
              key={line}
              type="button"
              aria-pressed={on}
              className={`min-h-11 rounded-full px-3 text-xs capitalize ${
                on
                  ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "border border-[var(--border)]"
              }`}
              onClick={() =>
                setLines((prev) =>
                  on ? prev.filter((x) => x !== line) : [...prev, line],
                )
              }
            >
              {line}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Price from"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="min-h-11 rounded-xl border border-[var(--border)] px-3"
        />
        <input
          placeholder="Link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-h-11 rounded-xl border border-[var(--border)] px-3"
        />
        <input
          type="date"
          value={runsFrom}
          onChange={(e) => setRunsFrom(e.target.value)}
          className="min-h-11 rounded-xl border border-[var(--border)] px-3"
        />
        <input
          type="date"
          value={runsTo}
          onChange={(e) => setRunsTo(e.target.value)}
          className="min-h-11 rounded-xl border border-[var(--border)] px-3"
        />
      </div>
      <textarea
        placeholder="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-20 w-full rounded-xl border border-[var(--border)] px-3 py-2"
      />
      <textarea
        placeholder="Availability note (e.g. Closed Tuesdays)"
        value={availabilityNote}
        onChange={(e) => setAvailabilityNote(e.target.value)}
        className="min-h-16 w-full rounded-xl border border-[var(--border)] px-3 py-2"
      />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Open days (leave empty = any day)
        </p>
        <div className="flex flex-wrap gap-2">
          {dayNames.map((label, d) => {
            const on = openDays.includes(d);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                className={`min-h-11 rounded-xl px-3 text-xs ${
                  on
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "border border-[var(--border)]"
                }`}
                onClick={() =>
                  setOpenDays((prev) =>
                    on ? prev.filter((x) => x !== d) : [...prev, d].sort(),
                  )
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          New?
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={upcoming}
            onChange={(e) => setUpcoming(e.target.checked)}
          />
          Coming soon?
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => setFlexible(e.target.checked)}
          />
          Flexible arrival?
        </label>
      </div>
      <button
        type="submit"
        className="min-h-12 w-full rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-fg)]"
      >
        Save option
      </button>
    </form>
  );
}
