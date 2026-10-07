import type { Group, Option } from "@/lib/types";
import { weekdayOfDate } from "@/lib/types";

export type PickOptionRow = {
  option: Option;
  /** Closed on the chosen weekday (still shown, greyed) */
  closed: boolean;
  closedLabel: string | null;
};

function openDaysLabel(openDays: number[]): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = openDays.map((d) => names[d]).filter(Boolean);
  if (labels.length === 0) return "Check opening days";
  if (labels.length === 1) return `Open ${labels[0]}`;
  if (labels.length === 2) return `Open ${labels[0]}–${labels[1]}`;
  return `Open ${labels[0]}–${labels[labels.length - 1]}`;
}

/** Options for Pick the plan — closed venues stay visible but greyed. */
export function filterPickOptions(
  group: Group,
  options: Option[],
  chosenDate: string,
): PickOptionRow[] {
  const weekday = weekdayOfDate(chosenDate);
  return options
    .filter((o) => {
      if (o.group_id !== group.id) return false;
      if (o.status && o.status !== "approved") return false;
      if (o.seen) return false;
      if (o.upcoming) return false;
      if (o.runs_from && o.runs_from > chosenDate) return false;
      if (o.runs_to && o.runs_to < chosenDate) return false;
      if (group.id === "barnes" && !o.flexible_arrival) return false;
      if (
        o.kind === "show" &&
        group.show_budget != null &&
        o.price_from != null &&
        o.price_from > group.show_budget
      ) {
        return false;
      }
      return true;
    })
    .map((o) => {
      const closed = Boolean(
        o.open_days &&
          o.open_days.length > 0 &&
          !o.open_days.includes(weekday),
      );
      return {
        option: o,
        closed,
        closedLabel: closed
          ? o.availability_note ||
            (o.open_days ? openDaysLabel(o.open_days) : "Closed this day")
          : null,
      };
    })
    .sort((a, b) => {
      if (a.closed !== b.closed) return a.closed ? 1 : -1;
      if (a.option.is_new !== b.option.is_new) return a.option.is_new ? -1 : 1;
      const pa = a.option.price_from ?? Number.POSITIVE_INFINITY;
      const pb = b.option.price_from ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return a.option.title.localeCompare(b.option.title);
    });
}

export function sortByHearts<T extends { id: string }>(
  items: T[],
  heartCounts: Map<string, number>,
): T[] {
  return [...items].sort((a, b) => {
    const ha = heartCounts.get(a.id) ?? 0;
    const hb = heartCounts.get(b.id) ?? 0;
    if (ha !== hb) return hb - ha;
    return 0;
  });
}

export type MeetingPlace = {
  id: string;
  title: string;
  venue: string | null;
  area: string;
};

/** Places a mum can choose while the date poll is still open. */
export function meetingPlaces(group: Group, options: Option[]): MeetingPlace[] {
  return options
    .filter((option) => {
      if (option.group_id !== group.id) return false;
      if (option.status && option.status !== "approved") return false;
      if (option.seen || option.upcoming) return false;
      if (!option.area?.trim()) return false;
      if (group.id === "barnes" && option.flexible_arrival === false) return false;
      return true;
    })
    .map((option) => ({
      id: option.id,
      title: option.title,
      venue: option.venue,
      area: option.area!.trim(),
    }))
    .sort((a, b) => {
      const area = a.area.localeCompare(b.area, "en");
      if (area !== 0) return area;
      return a.title.localeCompare(b.title, "en");
    });
}

/** Distinct meeting areas from this group's places. */
export function meetingAreas(options: Option[], groupId: string): string[] {
  const names = new Set<string>();
  for (const option of options) {
    if (option.group_id !== groupId) continue;
    if (option.status && option.status !== "approved") continue;
    if (option.seen) continue;
    const area = option.area?.trim();
    if (area) names.add(area);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "en"));
}

export function tabsForGroup(groupId: string): { kind: string; label: string }[] {
  if (groupId === "french") {
    return [
      { kind: "show", label: "Shows" },
      { kind: "food", label: "Dinner & drinks" },
    ];
  }
  return [
    { kind: "drinks", label: "Drinks" },
    { kind: "food", label: "Food" },
  ];
}
