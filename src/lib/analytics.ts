import { londonDateString, londonDayStart } from "@/lib/dates";
import { dateKey } from "@/lib/replies";
import type { GroupId, Visit, VisitChannel } from "@/lib/types";

/** Same person refreshing the link should not look like a crowd. */
export const VISIT_DEDUPE_MS = 30 * 60 * 1000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

/** Next.js prefetch must not count as someone opening the link. */
export function isPrefetchRequest(headers: Headers): boolean {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`;
  if (purpose.toLowerCase().includes("prefetch")) return true;
  if (headers.get("next-router-prefetch") === "1") return true;
  if (headers.get("x-middleware-prefetch") === "1") return true;
  return false;
}

export function channelForVisitPath(
  groupId: GroupId,
  path: string,
): VisitChannel | null {
  if (groupId === "barnes" && path === "/barneswalks") return "day";
  if (groupId === "barnes" && path === "/barnesmums") return "evening";
  if (groupId === "french" && path === "/frenchmums") return "evening";
  if (path.startsWith("/g/") && !path.slice(3).includes("/")) return "both";
  return null;
}

export function groupIdForVisitPath(path: string): GroupId | "token" | null {
  if (path === "/barnesmums" || path === "/barneswalks") return "barnes";
  if (path === "/frenchmums") return "french";
  if (path.startsWith("/g/") && path.length > 3 && !path.slice(3).includes("/")) {
    return "token";
  }
  return null;
}

export function normalizeVisitPath(raw: string): string | null {
  if (!raw || raw.length > 180) return null;
  let path = raw.trim();
  if (!path.startsWith("/")) return null;
  const q = path.indexOf("?");
  if (q !== -1) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h !== -1) path = path.slice(0, h);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path.includes("..")) return null;
  return path;
}

/** What to do when this visitor already opened the same path recently. */
export function nextVisitWrite(
  recent: { id: string; member_id: string | null } | null,
  memberId: string | null,
): { action: "insert" } | { action: "update"; id: string } | { action: "skip" } {
  if (!recent) return { action: "insert" };
  if (memberId && !recent.member_id) return { action: "update", id: recent.id };
  return { action: "skip" };
}

export type TrafficCounts = {
  people: number;
  visits: number;
  peopleToday: number;
  visitsToday: number;
  /** Distinct visitors who never attached a name on this path. */
  openedWithoutName: number;
};

export function summarizeTraffic(
  visits: Visit[],
  opts: { groupId: string; path: string; now: Date },
): TrafficCounts {
  const weekStart = opts.now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const todayStart = londonDayStart(londonDateString(opts.now)).getTime();
  const rows = visits.filter((visit) => {
    if (visit.group_id !== opts.groupId || visit.path !== opts.path) return false;
    return new Date(visit.created_at).getTime() >= weekStart;
  });
  const people = new Set(rows.map((visit) => visit.visitor_id));
  const today = rows.filter(
    (visit) => new Date(visit.created_at).getTime() >= todayStart,
  );
  const todayPeople = new Set(today.map((visit) => visit.visitor_id));
  const named = new Set(
    rows.filter((visit) => visit.member_id).map((visit) => visit.visitor_id),
  );
  let openedWithoutName = 0;
  for (const id of people) {
    if (!named.has(id)) openedWithoutName += 1;
  }
  return {
    people: people.size,
    visits: rows.length,
    peopleToday: todayPeople.size,
    visitsToday: today.length,
    openedWithoutName,
  };
}

export type ReportStep = { label: string; count: number };

export type UnfinishedLine = { name: string; detail: string };

export type QuietArea = { area: string; places: string[] };

export type ChannelReport = {
  traffic: TrafficCounts;
  steps: ReportStep[];
  unfinished: UnfinishedLine[];
  quietPlaces: QuietArea[];
  /** voting or pick — nudge who still needs to finish */
  showUnfinished: boolean;
  trackPlaces: boolean;
};

type Dated = { member_id: string; date: string };

function answeredDateCount(
  memberId: string,
  dates: string[],
  votes: Dated[],
): number {
  const open = new Set(dates.map(dateKey));
  const hit = new Set<string>();
  for (const vote of votes) {
    if (vote.member_id !== memberId) continue;
    const key = dateKey(vote.date);
    if (open.size > 0 && !open.has(key)) continue;
    hit.add(key);
  }
  return hit.size;
}

export function buildChannelReport(input: {
  visits: Visit[];
  groupId: string;
  path: string;
  now: Date;
  kind: "evening" | "day";
  status: string | null;
  dates: string[];
  members: { id: string; first_name: string }[];
  dateVotes: Dated[];
  slotVotes: Dated[];
  picks: { member_id: string; option_id: string }[];
  places: { id: string; label: string; area: string }[];
}): ChannelReport {
  const traffic = summarizeTraffic(input.visits, {
    groupId: input.groupId,
    path: input.path,
    now: input.now,
  });
  const hasRound = Boolean(input.status);
  const votes = input.kind === "day" ? input.slotVotes : input.dateVotes;
  const datesTotal = input.dates.length;
  const progress = input.members.map((member) => ({
    id: member.id,
    name: member.first_name,
    datesAnswered: answeredDateCount(member.id, input.dates, votes),
  }));
  const placeIds = new Set(input.places.map((place) => place.id));
  const pickers = new Set(
    input.picks
      .filter((pick) => placeIds.has(pick.option_id))
      .map((pick) => pick.member_id),
  );
  const trackPlaces = input.kind === "evening" && input.places.length > 0;
  const showUnfinished =
    input.status === "voting" || input.status === "pick";

  const started = progress.filter((person) => person.datesAnswered > 0).length;
  const finishedDates = progress.filter(
    (person) => datesTotal > 0 && person.datesAnswered >= datesTotal,
  ).length;
  const chosePlace = progress.filter((person) => pickers.has(person.id)).length;

  const steps: ReportStep[] = [
    { label: "Opened the link", count: traffic.people },
    { label: "Added a name", count: input.members.length },
  ];
  if (hasRound && datesTotal > 0) {
    steps.push({
      label:
        input.kind === "day"
          ? "Marked at least one time"
          : "Answered at least one date",
      count: started,
    });
    steps.push({
      label: input.kind === "day" ? "Marked every date" : "Answered every date",
      count: finishedDates,
    });
  }
  if (hasRound && trackPlaces) {
    steps.push({ label: "Chose a place", count: chosePlace });
  }

  const unfinished: UnfinishedLine[] = [];
  if (showUnfinished && traffic.openedWithoutName > 0) {
    const n = traffic.openedWithoutName;
    unfinished.push({
      name: n === 1 ? "1 person" : `${n} people`,
      detail: "opened the link and didn't add a name",
    });
  }
  if (showUnfinished) {
    const named = [...progress].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
    for (const person of named) {
      if (datesTotal === 0) continue;
      if (person.datesAnswered === 0) {
        unfinished.push({
          name: person.name,
          detail:
            input.kind === "day"
              ? "hasn't marked a time yet"
              : "hasn't answered any dates",
        });
      } else if (person.datesAnswered < datesTotal) {
        unfinished.push({
          name: person.name,
          detail: `stopped halfway through the dates (${person.datesAnswered} of ${datesTotal})`,
        });
      } else if (trackPlaces && !pickers.has(person.id)) {
        unfinished.push({
          name: person.name,
          detail: "answered the dates and hasn't chosen a place",
        });
      }
    }
  }

  const chosenOptions = new Set(input.picks.map((pick) => pick.option_id));
  const byArea = new Map<string, string[]>();
  if (showUnfinished && trackPlaces) {
    for (const place of input.places) {
      if (chosenOptions.has(place.id)) continue;
      const list = byArea.get(place.area) ?? [];
      list.push(place.label);
      byArea.set(place.area, list);
    }
  }
  const quietPlaces: QuietArea[] = [...byArea.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "en"))
    .map(([area, places]) => ({ area, places }));

  return {
    traffic,
    steps,
    unfinished,
    quietPlaces,
    showUnfinished,
    trackPlaces,
  };
}
