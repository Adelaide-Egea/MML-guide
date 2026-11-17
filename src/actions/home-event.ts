"use server";

import {
  getValidMemberForGroup,
  memberIdForChannel,
} from "@/lib/cookies";
import { resolveGroupByToken } from "@/lib/group-access";
import {
  isCraftGroup,
  isCraftVotingOpen,
  withoutNotes,
} from "@/lib/home-event";
import { groupVanityPaths } from "@/lib/invite-paths";
import { store } from "@/lib/store";
import { memberChannel, type GroupId } from "@/lib/types";
import { revalidatePath } from "next/cache";

function revalidateCraft(group: { id: GroupId; invite_token: string }) {
  revalidatePath(`/g/${group.invite_token}`);
  revalidatePath(`/admin/${group.id}`);
  for (const path of groupVanityPaths(group.id)) revalidatePath(path);
}

async function eveningMemberId(groupId: GroupId) {
  const cookie = await getValidMemberForGroup(groupId);
  if (!cookie) return null;
  const id = memberIdForChannel(cookie, "evening");
  if (!id) return null;
  const member = await store.getMember(groupId, id);
  if (!member?.active || memberChannel(member) !== "evening") return null;
  return member.id;
}

export async function saveCraftResponse(
  token: string,
  eventId: string,
  input: { dates: string[]; bringing: string[]; note: string },
) {
  const group = await resolveGroupByToken(token);
  if (!isCraftGroup(group.id)) {
    return { ok: false as const, error: "This evening is for Barnes Mums." };
  }
  const memberId = await eveningMemberId(group.id);
  if (!memberId) {
    return { ok: false as const, error: "Tell us who you are first." };
  }
  const event = await store.getHomeEvent(group.id, eventId);
  if (!event || event.status !== "open") {
    return { ok: false as const, error: "This evening isn't open." };
  }
  if (!isCraftVotingOpen(event)) {
    return { ok: false as const, error: "Voting has closed." };
  }
  try {
    await store.upsertHomeEventResponse(group.id, eventId, memberId, {
      dates: input.dates,
      bringing: input.bringing,
      note: input.note,
    });
    revalidateCraft(group);
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error && err.message === "Voting has closed."
        ? err.message
        : "Couldn't save your answer. Check your connection and tap again.";
    return { ok: false as const, error: message };
  }
}

export async function getCraftSnapshot(token: string, eventId: string) {
  const group = await resolveGroupByToken(token);
  if (!isCraftGroup(group.id)) {
    return { event: null, responses: [], myNote: null as string | null };
  }
  const event = await store.getHomeEvent(group.id, eventId);
  if (!event || event.status === "archived") {
    return { event: null, responses: [], myNote: null as string | null };
  }
  const responses = withoutNotes(
    await store.listHomeEventResponses(group.id, event.id, false),
  );
  const memberId = await eveningMemberId(group.id);
  const mine = memberId
    ? await store.getHomeEventResponse(group.id, event.id, memberId)
    : null;
  return {
    event,
    responses,
    myNote: mine?.note ?? null,
  };
}
