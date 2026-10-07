import { cookies } from "next/headers";
import type { GroupId, MemberCookie, RoundKind } from "./types";

export const MEMBER_COOKIE = "mno_member";
export const ADMIN_COOKIE = "mno_admin";
export const VISITOR_COOKIE = "mno_visitor";

export async function getMemberCookie(): Promise<MemberCookie | null> {
  const jar = await cookies();
  const raw = jar.get(MEMBER_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
    const parsed = JSON.parse(decoded) as MemberCookie;
    if (!parsed.group_id || !parsed.member_id) return null;
    return parsed;
  } catch {
    try {
      const parsed = JSON.parse(raw) as MemberCookie;
      if (!parsed.group_id || !parsed.member_id) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}

export async function setMemberCookie(value: MemberCookie): Promise<void> {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearMemberCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

/** Returns member cookie only if it matches the link's group */
export async function getValidMemberForGroup(
  groupId: GroupId,
): Promise<MemberCookie | null> {
  const c = await getMemberCookie();
  if (!c || c.group_id !== groupId) return null;
  return c;
}

/** Which saved name belongs on this channel. Night and walk are stored apart. */
export function memberIdForChannel(
  cookie: MemberCookie,
  channel: RoundKind,
): string | null {
  if (channel === "day") return cookie.day_member_id ?? null;
  if (cookie.evening_member_id) return cookie.evening_member_id;
  if (cookie.day_member_id && cookie.member_id === cookie.day_member_id) return null;
  return cookie.member_id ?? null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function visitorIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(VISITOR_COOKIE)?.value ?? null;
  return value && UUID_RE.test(value) ? value : null;
}

export async function setVisitorCookie(visitorId: string): Promise<void> {
  const jar = await cookies();
  jar.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getAdminCookieEmail(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value ?? null;
}

export async function setAdminCookie(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, email.toLowerCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
