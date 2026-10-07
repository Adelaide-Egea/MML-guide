"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { addHoursLondon, generateCandidateDates } from "@/lib/dates";
import { getSiteUrl } from "@/lib/env";
import { requireGroup } from "@/lib/group-access";
import { groupInviteUrl, groupVanityPaths } from "@/lib/invite-paths";
import { store } from "@/lib/store";
import type { GroupId, Option, OptionKind } from "@/lib/types";
import { londonDateString } from "@/lib/dates";
import { revalidatePath } from "next/cache";

function revalidateAdmin(groupId: GroupId, token?: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/${groupId}`);
  if (token) revalidatePath(`/g/${token}`);
  for (const path of groupVanityPaths(groupId)) revalidatePath(path);
}

export async function openVoting(
  groupId: GroupId,
  input: {
    evenings: number[];
    leadDays: number;
    horizonDays: number;
    voteHours: number;
    dates: string[];
    kind?: "evening" | "day";
    meeting_point?: string | null;
    pushchair_friendly?: boolean | null;
    coffee_stop?: string | null;
  },
) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const kind = input.kind ?? "evening";
  if (kind === "day" && !group.supports_day_meetups) {
    return {
      ok: false as const,
      error: "Day meetups aren't enabled for this group.",
    };
  }
  const existing = await store.getActiveRound(groupId, kind);
  if (existing) {
    return {
      ok: false as const,
      error:
        kind === "day"
          ? "There's already an open day walk."
          : "There's already an open night out.",
    };
  }
  const dates =
    input.dates.length > 0
      ? input.dates
      : generateCandidateDates(
          input.evenings,
          input.leadDays,
          input.horizonDays,
        );
  if (dates.length === 0) {
    return { ok: false as const, error: "No dates in that window." };
  }
  const closes = addHoursLondon(new Date(), input.voteHours);
  const round = await store.createRound(groupId, {
    dates,
    closes_at: closes.toISOString(),
    status: "voting",
    kind,
    meeting_point: kind === "day" ? input.meeting_point ?? null : null,
    pushchair_friendly:
      kind === "day" ? (input.pushchair_friendly ?? null) : null,
    coffee_stop: kind === "day" ? input.coffee_stop ?? null : null,
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const, roundId: round.id };
}

async function resolveRound(groupId: GroupId, roundId?: string) {
  if (roundId) return store.getRound(groupId, roundId);
  return store.getActiveRound(groupId);
}

export async function extendVoting(
  groupId: GroupId,
  hours = 12,
  roundId?: string,
) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round || (round.status !== "voting" && round.status !== "pick")) {
    return { ok: false as const, error: "No voting round to extend." };
  }
  const base =
    new Date(round.closes_at) > new Date()
      ? new Date(round.closes_at)
      : new Date();
  const closes = addHoursLondon(base, hours);
  await store.updateRound(groupId, round.id, {
    closes_at: closes.toISOString(),
    status: "voting",
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function closeVotingNow(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round || round.status !== "voting") {
    return { ok: false as const, error: "Voting isn't open." };
  }
  await store.updateRound(groupId, round.id, {
    closes_at: new Date().toISOString(),
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function cancelRound(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round) return { ok: false as const, error: "No open round." };
  await store.updateRound(groupId, round.id, { status: "cancelled" });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function chooseDate(
  groupId: GroupId,
  date: string,
  roundId?: string,
) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round) return { ok: false as const, error: "No open round." };
  if (!round.dates.includes(date)) {
    return { ok: false as const, error: "That date isn't in this round." };
  }
  // Day walks skip venue picking — go straight to "it's on"
  await store.updateRound(groupId, round.id, {
    chosen_date: date,
    status: round.kind === "day" ? "decided" : "pick",
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function bookOption(
  groupId: GroupId,
  optionId: string,
  roundId?: string,
) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round || round.status !== "pick") {
    return { ok: false as const, error: "Not in the pick step." };
  }
  const option = await store.getOption(groupId, optionId);
  if (!option) return { ok: false as const, error: "Option not found." };
  await store.updateRound(groupId, round.id, {
    chosen_option_id: optionId,
    status: "decided",
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function changeDate(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round) return { ok: false as const, error: "No open round." };
  await store.updateRound(groupId, round.id, {
    chosen_date: null,
    chosen_option_id: null,
    status: "voting",
    closes_at: new Date().toISOString(),
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function changePlan(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round) return { ok: false as const, error: "No open round." };
  await store.updateRound(groupId, round.id, {
    chosen_option_id: null,
    status: "pick",
  });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function finishRound(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round || round.status !== "decided") {
    return { ok: false as const, error: "Nothing to mark done." };
  }
  const date = round.chosen_date ?? londonDateString();

  if (round.kind === "day") {
    await store.addHistory(groupId, {
      date,
      option_id: null,
      title: "Day walk / catch-up",
    });
    await store.updateRound(groupId, round.id, { status: "done" });
    revalidateAdmin(groupId, group.invite_token);
    return { ok: true as const };
  }

  if (!round.chosen_option_id) {
    return { ok: false as const, error: "Nothing to mark done." };
  }
  const option = await store.getOption(groupId, round.chosen_option_id);
  if (!option) return { ok: false as const, error: "Option missing." };
  await store.upsertOption(
    groupId,
    {
      ...option,
      title: option.title,
      kind: option.kind,
      seen: true,
      seen_on: date,
    },
    option.id,
  );
  await store.addHistory(groupId, {
    date,
    option_id: option.id,
    title: option.title,
  });
  await store.updateRound(groupId, round.id, { status: "done" });
  revalidateAdmin(groupId, group.invite_token);
  return { ok: true as const };
}

export async function addMemberAction(
  groupId: GroupId,
  firstName: string,
  channel: "evening" | "day" = "evening",
) {
  await requireAdmin();
  if (!firstName.trim()) {
    return { ok: false as const, error: "Enter a first name." };
  }
  const list = channel === "day" && groupId === "barnes" ? "day" : "evening";
  await store.addMember(groupId, firstName, null, list);
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function addOrganiserAction(email: string) {
  await requireAdmin();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false as const, error: "Enter a real email address." };
  }
  await store.addOrganiserEmail(normalized);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function removeOrganiserAction(email: string) {
  const me = await requireAdmin();
  const { getAdminEmail } = await import("@/lib/env");
  const normalized = email.trim().toLowerCase();
  if (normalized === getAdminEmail()) {
    return { ok: false as const, error: "That email stays. It's the original organiser." };
  }
  if (normalized === me) {
    return { ok: false as const, error: "Ask the other organiser to remove you." };
  }
  await store.removeOrganiserEmail(normalized);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function renameMemberAction(
  groupId: GroupId,
  memberId: string,
  firstName: string,
) {
  await requireAdmin();
  await store.updateMember(groupId, memberId, { first_name: firstName });
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function deactivateMemberAction(
  groupId: GroupId,
  memberId: string,
) {
  await requireAdmin();
  await store.updateMember(groupId, memberId, { active: false });
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function saveOptionAction(
  groupId: GroupId,
  data: {
    id?: string;
    title: string;
    kind: OptionKind;
    venue?: string;
    area?: string;
    station?: string;
    lines?: string[];
    price_from?: number | null;
    runs_from?: string | null;
    runs_to?: string | null;
    url?: string;
    note?: string;
    is_new?: boolean;
    upcoming?: boolean;
    flexible_arrival?: boolean;
    open_days?: number[] | null;
    availability_note?: string | null;
  },
) {
  await requireAdmin();
  await store.upsertOption(
    groupId,
    {
      title: data.title,
      kind: data.kind,
      venue: data.venue ?? null,
      area: data.area ?? null,
      station: data.station ?? null,
      lines: data.lines ?? [],
      price_from: data.price_from ?? null,
      runs_from: data.runs_from || null,
      runs_to: data.runs_to || null,
      url: data.url ?? null,
      note: data.note ?? null,
      is_new: data.is_new ?? false,
      upcoming: data.upcoming ?? false,
      flexible_arrival: data.flexible_arrival ?? true,
      open_days: data.open_days ?? null,
      availability_note: data.availability_note?.trim() || null,
      status: "approved",
    },
    data.id,
  );
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function markOptionSeenAction(
  groupId: GroupId,
  optionId: string,
) {
  await requireAdmin();
  const option = await store.getOption(groupId, optionId);
  if (!option) return { ok: false as const, error: "Not found." };
  await store.upsertOption(
    groupId,
    {
      ...option,
      title: option.title,
      kind: option.kind,
      seen: true,
      seen_on: londonDateString(),
    },
    option.id,
  );
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function deleteOptionAction(groupId: GroupId, optionId: string) {
  await requireAdmin();
  await store.deleteOption(groupId, optionId);
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function approvePendingOption(groupId: GroupId, optionId: string) {
  await requireAdmin();
  const option = await store.getOption(groupId, optionId);
  if (!option) return { ok: false as const, error: "Not found." };
  await store.upsertOption(
    groupId,
    { ...option, title: option.title, kind: option.kind, status: "approved" },
    option.id,
  );
  revalidateAdmin(groupId);
  return { ok: true as const };
}

export async function regenerateLinkAction(groupId: GroupId) {
  await requireAdmin();
  const token = await store.regenerateToken(groupId);
  revalidateAdmin(groupId);
  const group = await requireGroup(groupId);
  return {
    ok: true as const,
    token,
    url: groupInviteUrl({ id: groupId, invite_token: token }),
  };
}

export async function getWhatsAppVoteMessage(
  groupId: GroupId,
  roundId?: string,
) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round) return { ok: false as const, error: "No open round." };
  const { formatClosesExact, formatFromTime } = await import("@/lib/dates");
  const deadline = formatClosesExact(round.closes_at);
  const link = groupInviteUrl(group, round.kind);
  if (round.kind === "day") {
    const text = `Hi ladies! Fancy a ${group.name} day walk? Tap the mornings or afternoons you could do. Voting closes ${deadline}. ${link}`;
    return { ok: true as const, text };
  }
  const time = formatFromTime(group.start_time);
  const text = `Hi ladies! Time to plan our next ${group.name} night out (${time}). Mark each evening Yes, If needed, or Can't, and tap the places you'd like. Voting closes ${deadline}. ${link}`;
  return { ok: true as const, text };
}

export async function getPickMessage(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round?.chosen_date) {
    return { ok: false as const, error: "Choose a date first." };
  }
  const votes = await store.listDateVotes(groupId, round.id);
  const { isFreeEnough } = await import("@/lib/types");
  const freeCount = new Set(
    votes
      .filter((v) => v.date === round.chosen_date && isFreeEnough(v))
      .map((v) => v.member_id),
  ).size;
  const options = await store.listOptions(groupId);
  const picks = await store.listOptionPicks(groupId, round.id);
  const counts = new Map<string, number>();
  for (const p of picks) {
    counts.set(p.option_id, (counts.get(p.option_id) ?? 0) + 1);
  }
  const { filterPickOptions } = await import("@/lib/options");
  const eligible = filterPickOptions(group, options, round.chosen_date).filter(
    (row) => !row.closed,
  );
  const top = [...eligible]
    .sort(
      (a, b) =>
        (counts.get(b.option.id) ?? 0) - (counts.get(a.option.id) ?? 0),
    )
    .slice(0, 3);
  const { formatLongDate } = await import("@/lib/dates");
  const dateLabel = formatLongDate(round.chosen_date);
  const bullets = top
    .map((row) => {
      const o = row.option;
      const price =
        o.price_from != null ? ` from £${Number(o.price_from)}` : "";
      return `• ${o.title}${price}`;
    })
    .join(" ");
  const link = groupInviteUrl(group, round.kind);
  const text = `${freeCount} of us are free on ${dateLabel}! 🎉 Heart what you'd like (♥ = I'd love this one): ${bullets} ${link}`;
  return { ok: true as const, text };
}

export async function getDecidedMessage(groupId: GroupId, roundId?: string) {
  await requireAdmin();
  const group = await requireGroup(groupId);
  const round = await resolveRound(groupId, roundId);
  if (!round?.chosen_date) {
    return { ok: false as const, error: "Nothing booked yet." };
  }
  const { formatLongDate, formatFromTime } = await import("@/lib/dates");
  const link = groupInviteUrl(group, round.kind);
  if (round.kind === "day") {
    const text = `It's on! ☀️ ${group.name} day walk — ${formatLongDate(round.chosen_date)}. Check the chat for morning vs afternoon. ${link}`;
    return { ok: true as const, text };
  }
  if (!round.chosen_option_id) {
    return { ok: false as const, error: "Nothing booked yet." };
  }
  const option = await store.getOption(groupId, round.chosen_option_id);
  if (!option) return { ok: false as const, error: "Option missing." };
  const text = `It's on! 🎭 ${option.title}${option.venue ? ` at ${option.venue}` : ""} — ${formatLongDate(round.chosen_date)}, ${formatFromTime(group.start_time)}. ${group.arrival_note ?? ""} Details: ${link}`;
  return { ok: true as const, text };
}

export type { Option };
