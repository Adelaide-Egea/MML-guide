import { formatClosesExact, formatFromTime, formatLongDate } from "@/lib/dates";
import { dateKey } from "@/lib/replies";
import type {
  BringKind,
  HomeEvent,
  HomeEventResponse,
  Member,
  PublicHomeEventResponse,
} from "@/lib/types";

export const CRAFT_GROUP_ID = "barnes" as const;

export const CRAFT_DEFAULT_TITLE = "Craft evening at Adelaide's";
export const CRAFT_DEFAULT_NOTE = "Little babies are very welcome!";
export const CRAFT_DEFAULT_START = "20:00";

/** Tue 24 Nov, Thu 26 Nov, Tue 1 Dec, Wed 2 Dec, Thu 3 Dec 2026 */
export const CRAFT_DEFAULT_DATES = [
  "2026-11-24",
  "2026-11-26",
  "2026-12-01",
  "2026-12-02",
  "2026-12-03",
];

export const BRING_OPTIONS: {
  id: BringKind;
  emoji: string;
  label: string;
  short: string;
  emptyNudge: string;
}[] = [
  {
    id: "crafts",
    emoji: "🧵",
    label: "Crafts / materials",
    short: "crafts",
    emptyNudge: "Nobody's bringing crafts yet!",
  },
  {
    id: "food",
    emoji: "🍰",
    label: "Something to eat",
    short: "food",
    emptyNudge: "Nobody's bringing food yet!",
  },
  {
    id: "drink",
    emoji: "🍷",
    label: "Something to drink",
    short: "drink",
    emptyNudge: "Nobody's bringing drinks yet!",
  },
];

const BRING_SET = new Set<BringKind>(BRING_OPTIONS.map((item) => item.id));

export function isCraftGroup(groupId: string): boolean {
  return groupId === CRAFT_GROUP_ID;
}

/** Night-out dates don't sit under the craft card — it looks like an old poll. */
export function roundsBesideCraft<T extends { kind: string }>(
  rounds: T[],
  homeEvent: { id: string } | null,
): T[] {
  if (!homeEvent) return rounds;
  return rounds.filter((round) => round.kind !== "evening");
}

export function isCraftVotingOpen(event: HomeEvent, now = new Date()): boolean {
  if (event.status !== "open") return false;
  return new Date(event.closes_at).getTime() > now.getTime();
}

export function normalizeDateList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = dateKey(String(value));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function normalizeBringList(values: unknown): BringKind[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<BringKind>();
  const out: BringKind[] = [];
  for (const value of values) {
    const id = String(value) as BringKind;
    if (!BRING_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function clipCraftNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 300);
  return trimmed.length > 0 ? trimmed : null;
}

export function withoutNotes(
  rows: HomeEventResponse[],
): PublicHomeEventResponse[] {
  return rows.map(({ note: _note, ...rest }) => rest);
}

export function dateVoteCounts(
  dates: string[],
  responses: Pick<HomeEventResponse, "dates">[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(date, 0);
  for (const row of responses) {
    for (const date of row.dates) {
      const key = dateKey(date);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Most "can come" votes wins. On a tie, the earliest date.
 * An organiser override (chosen_date) always wins.
 */
export function winningCraftDate(
  event: Pick<HomeEvent, "dates" | "chosen_date">,
  responses: Pick<HomeEventResponse, "dates">[],
): string | null {
  if (event.chosen_date && event.dates.includes(event.chosen_date)) {
    return event.chosen_date;
  }
  const counts = dateVoteCounts(event.dates, responses);
  let best: string | null = event.dates[0] ?? null;
  let bestCount = -1;
  for (const date of event.dates) {
    const count = counts.get(date) ?? 0;
    if (count > bestCount || (count === bestCount && date < (best ?? date))) {
      best = date;
      bestCount = count;
    }
  }
  return best;
}

export function comingOnDate(
  responses: Pick<HomeEventResponse, "member_id" | "dates" | "bringing">[],
  chosenDate: string | null,
): Pick<HomeEventResponse, "member_id" | "dates" | "bringing">[] {
  if (!chosenDate) return [];
  return responses.filter((row) =>
    row.dates.map(dateKey).includes(dateKey(chosenDate)),
  );
}

export function bringTotals(
  coming: Pick<HomeEventResponse, "bringing">[],
): Record<BringKind, number> {
  const totals: Record<BringKind, number> = {
    crafts: 0,
    food: 0,
    drink: 0,
  };
  for (const row of coming) {
    for (const kind of row.bringing) {
      if (kind in totals) totals[kind] += 1;
    }
  }
  return totals;
}

export function bringLine(bringing: BringKind[], withEmoji = true): string {
  const labels = BRING_OPTIONS.filter((item) => bringing.includes(item.id)).map(
    (item) => (withEmoji ? `${item.emoji} ${item.short}` : item.short),
  );
  if (labels.length === 0) return "—";
  return withEmoji ? labels.join(" · ") : labels.join(", ");
}

export function craftDeadlineLabel(closesAt: string): string {
  return formatClosesExact(closesAt);
}

export function craftExtraDayMessage(input: {
  date: string;
  link: string;
}): string {
  return [
    `Hey — I've added another evening to the craft poll: ${formatLongDate(input.date)} from 8pm.`,
    `Tap it if you can come (same link):`,
    input.link,
  ].join("\n");
}

export function craftInviteMessage(input: {
  link: string;
  closesAt: string;
}): string {
  return [
    `Hi ladies! 🧶 Craft evening at mine, from 8pm (little babies welcome!).`,
    `Tap the dates you can do + what you'll bring before ${craftDeadlineLabel(input.closesAt)}:`,
    input.link,
  ].join("\n");
}

export function craftWhatsAppMessage(input: {
  chosenDate: string;
  coming: { name: string; bringing: BringKind[] }[];
  totals: Record<BringKind, number>;
}): string {
  const people =
    input.coming.length === 0
      ? "• (nobody yet)"
      : input.coming
          .map((row) => `• ${row.name}: ${bringLine(row.bringing, false)}`)
          .join("\n");
  return [
    `✨ Craft evening at mine is ON!`,
    `📅 ${formatLongDate(input.chosenDate)} from 8pm`,
    `👶 Little babies welcome`,
    ``,
    `Who's coming & bringing what:`,
    people,
    ``,
    `Totals: 🧵 ${input.totals.crafts} · 🍰 ${input.totals.food} · 🍷 ${input.totals.drink}`,
    `See you there! 🧶`,
  ].join("\n");
}

export function namedComing(
  coming: Pick<HomeEventResponse, "member_id" | "bringing">[],
  members: Pick<Member, "id" | "first_name">[],
): { name: string; memberId: string; bringing: BringKind[] }[] {
  const byId = new Map(members.map((member) => [member.id, member.first_name]));
  return coming
    .map((row) => ({
      memberId: row.member_id,
      name: byId.get(row.member_id) ?? "Someone",
      bringing: row.bringing,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
}

export function craftHeadlineTime(startTime: string): string {
  return formatFromTime(startTime || CRAFT_DEFAULT_START);
}
