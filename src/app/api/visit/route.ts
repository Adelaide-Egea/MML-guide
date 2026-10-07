import { NextResponse } from "next/server";
import {
  channelForVisitPath,
  groupIdForVisitPath,
  isPrefetchRequest,
  isUuid,
  normalizeVisitPath,
} from "@/lib/analytics";
import { setVisitorCookie, visitorIdFromCookie } from "@/lib/cookies";
import { store } from "@/lib/store";
import type { GroupId } from "@/lib/types";

export async function POST(request: Request) {
  if (isPrefetchRequest(request.headers)) {
    return NextResponse.json({ ok: true, skipped: "prefetch" });
  }

  let body: {
    path?: string;
    group_id?: string;
    member_id?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = normalizeVisitPath(body.path ?? "");
  const groupId = body.group_id;
  if (!path || (groupId !== "french" && groupId !== "barnes")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pathGroup = groupIdForVisitPath(path);
  if (!pathGroup || (pathGroup !== "token" && pathGroup !== groupId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const channel = channelForVisitPath(groupId, path);
  if (!channel) return NextResponse.json({ ok: false }, { status: 400 });

  const group = await store.getGroupById(groupId);
  if (!group) return NextResponse.json({ ok: false }, { status: 400 });
  if (path.startsWith("/g/") && path !== `/g/${group.invite_token}`) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let memberId: string | null = isUuid(body.member_id) ? body.member_id : null;
  if (memberId) {
    const member = await store.getMember(groupId, memberId);
    if (!member?.active) memberId = null;
  }

  const visitorId = (await visitorIdFromCookie()) ?? crypto.randomUUID();
  try {
    await store.recordVisit({
      groupId: groupId as GroupId,
      channel,
      path,
      visitorId,
      memberId,
    });
  } catch (error) {
    console.error("visit", error);
  }

  await setVisitorCookie(visitorId);
  return NextResponse.json({ ok: true });
}
