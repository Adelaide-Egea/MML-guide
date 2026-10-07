"use client";

import type { GroupId } from "@/lib/types";
import { useEffect } from "react";

/** Records that this invite link was opened. Prefetch does not run this effect. */
export function VisitBeacon({
  groupId,
  memberId,
}: {
  groupId: GroupId;
  memberId: string | null;
}) {
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const key = `mno-visit:${path}:${memberId ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode can block storage; the server still dedupes.
    }
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        group_id: groupId,
        member_id: memberId,
      }),
      keepalive: true,
    });
  }, [groupId, memberId]);

  return null;
}
