"use server";

import {
  clearMemberCookie,
  getMemberCookie,
  getValidMemberForGroup,
  memberIdForChannel,
  setMemberCookie,
} from "@/lib/cookies";
import { resolveGroupByToken } from "@/lib/group-access";
import { normalizePhone } from "@/lib/phone";
import { store } from "@/lib/store";
import type { GroupId, RoundKind } from "@/lib/types";
import { memberChannel } from "@/lib/types";
import { groupVanityPaths } from "@/lib/invite-paths";
import { revalidatePath } from "next/cache";

function revalidateMemberPaths(
  group: { id: GroupId; invite_token: string },
  token: string,
) {
  revalidatePath(`/g/${token}`);
  for (const path of groupVanityPaths(group.id)) revalidatePath(path);
}

function placeIsListed(
  group: { id: GroupId },
  option: {
    status?: string | null;
    seen?: boolean | null;
    upcoming?: boolean | null;
    area?: string | null;
    flexible_arrival?: boolean | null;
  },
) {
  if (option.status && option.status !== "approved") return false;
  if (option.seen || option.upcoming) return false;
  if (!option.area?.trim()) return false;
  if (group.id === "barnes" && option.flexible_arrival === false) return false;
  return true;
}

async function actingMemberId(groupId: GroupId, channel: RoundKind) {
  const cookie = await getValidMemberForGroup(groupId);
  if (!cookie) return null;
  const id = memberIdForChannel(cookie, channel);
  if (!id) return null;
  const member = await store.getMember(groupId, id);
  if (!member?.active || memberChannel(member) !== channel) return null;
  return member.id;
}

export async function identifyMember(
  token: string,
  memberId: string,
  channel?: RoundKind,
) {
  const group = await resolveGroupByToken(token);
  const member = await store.getMember(group.id, memberId);
  if (!member || !member.active) {
    return { ok: false as const, error: "Couldn't find that name." };
  }
  const slot = channel ?? memberChannel(member);
  if (memberChannel(member) !== slot) {
    return { ok: false as const, error: "That name is on the other list." };
  }
  await rememberMember(group.id, member.id, slot);
  revalidateMemberPaths(group, token);
  return { ok: true as const };
}

async function rememberMember(
  groupId: GroupId,
  memberId: string,
  channel: RoundKind,
) {
  const prev = await getMemberCookie();
  const same = prev?.group_id === groupId ? prev : null;
  const evening =
    channel === "evening"
      ? memberId
      : same?.evening_member_id ||
        (same && !same.day_member_id ? same.member_id : null);
  const day = channel === "day" ? memberId : same?.day_member_id ?? null;
  await setMemberCookie({
    group_id: groupId,
    member_id: memberId,
    evening_member_id: evening,
    day_member_id: day,
  });
}

/** Mum adds her own first name; cookie remembers her for next visits. */
export async function joinAsNewMember(
  token: string,
  firstName: string,
  phoneRaw = "",
  channel: RoundKind = "evening",
) {
  const group = await resolveGroupByToken(token);
  const list = channel === "day" && group.id === "barnes" ? "day" : "evening";
  const name = firstName.trim().replace(/\s+/g, " ");
  if (name.length < 1) {
    return { ok: false as const, error: "Enter your first name." };
  }
  if (name.length > 40) {
    return { ok: false as const, error: "That name is a bit long — try a first name." };
  }
  let phone: string | null = null;
  try {
    phone = normalizePhone(phoneRaw);
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Check that phone number.",
    };
  }
  const existing = (await store.listMembers(group.id, true)).find(
    (m) =>
      memberChannel(m) === list &&
      m.first_name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    if (phone && !existing.phone) {
      await store.updateMember(group.id, existing.id, { phone });
    }
    await rememberMember(group.id, existing.id, list);
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  }
  try {
    const member = await store.addMember(group.id, name, phone, list);
    await rememberMember(group.id, member.id, list);
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save your name. Check your connection and try again.",
    };
  }
}

/** Optional mobile for updates if they're not in the WhatsApp group. */
export async function saveMemberPhone(token: string, phoneRaw: string) {
  const group = await resolveGroupByToken(token);
  const cookie = await getValidMemberForGroup(group.id);
  if (!cookie) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  let phone: string | null;
  try {
    phone = normalizePhone(phoneRaw);
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Check that phone number.",
    };
  }
  try {
    await store.updateMember(group.id, cookie.member_id, { phone });
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save that number. Try again in a moment.",
    };
  }
}

export async function switchMember(token: string, channel?: RoundKind) {
  const group = await resolveGroupByToken(token);
  const prev = await getMemberCookie();
  if (!channel || !prev || prev.group_id !== group.id) {
    await clearMemberCookie();
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  }
  if (channel === "day") {
    const evening =
      prev.evening_member_id ||
      (prev.day_member_id ? null : prev.member_id);
    if (!evening) await clearMemberCookie();
    else {
      await setMemberCookie({
        group_id: group.id,
        member_id: evening,
        evening_member_id: evening,
        day_member_id: null,
      });
    }
  } else {
    const day = prev.day_member_id;
    if (!day) await clearMemberCookie();
    else {
      await setMemberCookie({
        group_id: group.id,
        member_id: day,
        evening_member_id: null,
        day_member_id: day,
      });
    }
  }
  revalidateMemberPaths(group, token);
  return { ok: true as const };
}

export async function toggleSlotVote(
  token: string,
  roundId: string,
  date: string,
  slot: "morning" | "afternoon",
  free: boolean,
) {
  const group = await resolveGroupByToken(token);
  const memberId = await actingMemberId(group.id, "day");
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const round = await store.getRound(group.id, roundId);
  if (!round || round.status !== "voting" || round.kind !== "day") {
    return { ok: false as const, error: "Voting isn't open right now." };
  }
  if (new Date(round.closes_at) <= new Date()) {
    return { ok: false as const, error: "Voting has closed." };
  }
  if (!round.dates.includes(date)) {
    return { ok: false as const, error: "That date isn't on this round." };
  }
  try {
    await store.setSlotVote(
      group.id,
      roundId,
      memberId,
      date,
      slot,
      free,
    );
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save your answer. Check your connection and tap again.",
    };
  }
}

export async function suggestOptionAction(
  token: string,
  input: {
    title: string;
    venue?: string;
    kind: import("@/lib/types").OptionKind;
    note?: string;
    url?: string;
  },
) {
  const group = await resolveGroupByToken(token);
  const memberId = await actingMemberId(group.id, "evening");
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const member = await store.getMember(group.id, memberId);
  if (!member?.active) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2) {
    return { ok: false as const, error: "Give the place a name." };
  }
  if (title.length > 80) {
    return { ok: false as const, error: "That name is a bit long." };
  }
  const allowed = (
    await import("@/lib/options")
  ).tabsForGroup(group.id).map((t) => t.kind);
  if (!allowed.includes(input.kind)) {
    return { ok: false as const, error: "Pick a valid category." };
  }
  const venue = input.venue?.trim().slice(0, 80) || null;
  const noteRaw = input.note?.trim().slice(0, 200) || "";
  const note = [
    `Suggested by ${member.first_name}`,
    noteRaw || null,
  ]
    .filter(Boolean)
    .join(" — ");
  let url = input.url?.trim() || null;
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  if (url && url.length > 300) {
    return { ok: false as const, error: "That link is too long." };
  }
  try {
    await store.upsertOption(group.id, {
      title,
      kind: input.kind,
      venue,
      area: null,
      station: null,
      lines: [],
      price_from: null,
      runs_from: null,
      runs_to: null,
      url,
      note,
      is_new: true,
      upcoming: false,
      flexible_arrival: true,
      open_days: null,
      availability_note: null,
      status: "approved",
      seen: false,
      seen_on: null,
    });
    revalidateMemberPaths(group, token);
    revalidatePath(`/admin/${group.id}`);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save that idea. Check your connection and try again.",
    };
  }
}

export async function addOptionCommentAction(
  token: string,
  optionId: string,
  body: string,
) {
  const group = await resolveGroupByToken(token);
  const memberId = await actingMemberId(group.id, "evening");
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const text = body.trim();
  if (text.length < 2) {
    return { ok: false as const, error: "Write a short note first." };
  }
  if (text.length > 280) {
    return { ok: false as const, error: "Keep it under 280 characters." };
  }
  try {
    await store.addOptionComment(
      group.id,
      optionId,
      memberId,
      text,
    );
    revalidateMemberPaths(group, token);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save that note. Try again in a moment.",
    };
  }
}

export async function setDateAvailability(
  token: string,
  roundId: string,
  date: string,
  availability: import("@/lib/types").DateAvailability,
) {
  const group = await resolveGroupByToken(token);
  const round = await store.getRound(group.id, roundId);
  if (!round || round.status !== "voting") {
    return { ok: false as const, error: "Voting isn't open right now." };
  }
  const memberId = await actingMemberId(
    group.id,
    round.kind === "day" ? "day" : "evening",
  );
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  if (new Date(round.closes_at) <= new Date()) {
    return { ok: false as const, error: "Voting has closed." };
  }
  if (!round.dates.includes(date)) {
    return { ok: false as const, error: "That date isn't on this round." };
  }
  if (!["yes", "if_needed", "cant"].includes(availability)) {
    return { ok: false as const, error: "Pick Yes, If needed, or Can't." };
  }
  try {
    await store.setDateVote(
      group.id,
      roundId,
      memberId,
      date,
      availability,
    );
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save your answer. Check your connection and tap again.",
    };
  }
}

export async function setAreaVote(
  token: string,
  roundId: string,
  area: string,
  chosen: boolean,
) {
  const group = await resolveGroupByToken(token);
  const memberId = await actingMemberId(group.id, "evening");
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const round = await store.getRound(group.id, roundId);
  if (!round || round.status !== "voting" || round.kind !== "evening") {
    return { ok: false as const, error: "Voting isn't open right now." };
  }
  if (new Date(round.closes_at) <= new Date()) {
    return { ok: false as const, error: "Voting has closed." };
  }
  const name = area.trim();
  if (!name || name.length > 80) {
    return { ok: false as const, error: "Pick an area from the list." };
  }
  const { meetingAreas } = await import("@/lib/options");
  const options = await store.listOptions(group.id);
  if (!meetingAreas(options, group.id).includes(name)) {
    return { ok: false as const, error: "That area isn't on this poll." };
  }
  try {
    await store.setAreaVote(group.id, roundId, memberId, name, chosen);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save that area. Check your connection and tap again.",
    };
  }
}

/** @deprecated use setDateAvailability — kept for any stale clients */
export async function toggleDateVote(
  token: string,
  roundId: string,
  date: string,
  free: boolean,
) {
  return setDateAvailability(token, roundId, date, free ? "yes" : "cant");
}

export async function toggleOptionPick(
  token: string,
  roundId: string,
  optionId: string,
  liked: boolean,
) {
  const group = await resolveGroupByToken(token);
  const memberId = await actingMemberId(group.id, "evening");
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const [round, option] = await Promise.all([
    store.getRound(group.id, roundId),
    store.getOption(group.id, optionId),
  ]);
  if (!round || round.kind === "day") {
    return { ok: false as const, error: "Picking isn't open right now." };
  }
  if (!option) {
    return { ok: false as const, error: "That place isn't on the list." };
  }
  if (round.status === "voting") {
    if (new Date(round.closes_at) <= new Date()) {
      return { ok: false as const, error: "Voting has closed." };
    }
    if (!placeIsListed(group, option)) {
      return { ok: false as const, error: "That place isn't on the list." };
    }
  } else if (round.status === "pick" && round.chosen_date) {
    const { filterPickOptions } = await import("@/lib/options");
    const row = filterPickOptions(group, [option], round.chosen_date).find(
      (r) => r.option.id === optionId,
    );
    if (!row || row.closed) {
      return {
        ok: false as const,
        error: "That place is closed on this date — no hearts.",
      };
    }
  } else {
    return { ok: false as const, error: "Picking isn't open right now." };
  }
  try {
    await store.setOptionPick(
      group.id,
      roundId,
      memberId,
      optionId,
      liked,
    );
    if (round.status === "pick") revalidateMemberPaths(group, token);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Couldn't save your heart. Check your connection and tap again.",
    };
  }
}

export async function getMemberRoundSnapshot(
  token: string,
  roundId?: string,
) {
  const group = await resolveGroupByToken(token);
  const round = roundId
    ? await store.getRound(group.id, roundId)
    : await store.getActiveRound(group.id);
  if (!round) {
    return {
      groupId: group.id as GroupId,
      votes: [] as {
        member_id: string;
        date: string;
        availability: import("@/lib/types").DateAvailability;
      }[],
      picks: [] as { member_id: string; option_id: string }[],
      areaVotes: [] as { member_id: string; area: string }[],
      closes_at: null as string | null,
      status: null as string | null,
    };
  }
  const votes = await store.listDateVotes(group.id, round.id);
  const picks = await store.listOptionPicks(group.id, round.id);
  const areaVotes =
    round.kind === "evening"
      ? await store.listAreaVotes(group.id, round.id)
      : [];
  return {
    groupId: group.id as GroupId,
    votes: votes.map((v) => ({
      member_id: v.member_id,
      date: v.date,
      availability: v.availability ?? "yes",
    })),
    picks: picks.map((p) => ({
      member_id: p.member_id,
      option_id: p.option_id,
    })),
    areaVotes: areaVotes.map((v) => ({
      member_id: v.member_id,
      area: v.area,
    })),
    closes_at: round.closes_at,
    status: round.status,
  };
}
