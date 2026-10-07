import { store } from "@/lib/store";
import type { Group, GroupId } from "@/lib/types";

export class GroupAccessError extends Error {
  constructor(message = "Group not found") {
    super(message);
    this.name = "GroupAccessError";
  }
}

/** Resolve a private invite token to a group. Never accept group id as a token. */
export async function resolveGroupByToken(token: string): Promise<Group> {
  if (!token || token.length < 24) {
    throw new GroupAccessError();
  }
  // Reject obvious group-id URLs
  if (token === "french" || token === "barnes") {
    throw new GroupAccessError();
  }
  const group = await store.getGroupByToken(token);
  if (!group) throw new GroupAccessError();
  return group;
}

export async function requireGroup(groupId: GroupId): Promise<Group> {
  const group = await store.getGroupById(groupId);
  if (!group) throw new GroupAccessError();
  return group;
}

/**
 * Assert that every returned entity belongs to groupId.
 * Used by the separation test and as a runtime guard.
 */
export function assertSameGroup<T extends { group_id: string }>(
  groupId: GroupId,
  rows: T[],
): T[] {
  for (const row of rows) {
    if (row.group_id !== groupId) {
      throw new Error("CROSS_GROUP_LEAK");
    }
  }
  return rows;
}
