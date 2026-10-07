import type { Group, GroupId, RoundKind } from "@/lib/types";
import { getSiteUrl } from "@/lib/env";

/** Short public paths (no long token). Resolved by group id, not by token. */
export const VANITY_PATHS: Record<GroupId, string> = {
  barnes: "/barnesmums",
  french: "/frenchmums",
};

/** Barnes nights and walks are sent in different WhatsApp channels. */
const CHANNEL_PATHS: Partial<Record<GroupId, Partial<Record<RoundKind, string>>>> = {
  barnes: {
    evening: "/barnesmums",
    day: "/barneswalks",
  },
};

export function groupInvitePath(
  group: Pick<Group, "id" | "invite_token">,
  channel?: RoundKind,
): string {
  const specific = channel ? CHANNEL_PATHS[group.id]?.[channel] : undefined;
  if (specific) return specific;
  return VANITY_PATHS[group.id] ?? `/g/${group.invite_token}`;
}

export function groupInviteUrl(
  group: Pick<Group, "id" | "invite_token">,
  channel?: RoundKind,
): string {
  return `${getSiteUrl()}${groupInvitePath(group, channel)}`;
}

export function groupChannelLinks(
  group: Pick<Group, "id" | "invite_token">,
): { channel: RoundKind; label: string; path: string }[] {
  if (group.id === "barnes") {
    return [
      { channel: "evening", label: "Night out", path: "/barnesmums" },
      { channel: "day", label: "Day walk", path: "/barneswalks" },
    ];
  }
  return [
    {
      channel: "evening",
      label: "Invite",
      path: groupInvitePath(group),
    },
  ];
}

export function groupVanityPaths(groupId: GroupId): string[] {
  return groupChannelLinks({ id: groupId, invite_token: "" }).map((link) => link.path);
}

export function vanityGroupId(slug: string): GroupId | null {
  const path = slug.startsWith("/") ? slug : `/${slug}`;
  for (const [id, vanity] of Object.entries(VANITY_PATHS) as [GroupId, string][]) {
    if (vanity === path) return id;
  }
  return null;
}
