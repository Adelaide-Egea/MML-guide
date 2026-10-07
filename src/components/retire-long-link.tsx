"use client";

import { regenerateLinkAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import type { GroupId } from "@/lib/types";
import { useRouter } from "next/navigation";

export function RetireLongLink({
  groupId,
  label,
}: {
  groupId: GroupId;
  label: string;
}) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={`Retire ${label} long link`}
      danger
      confirmLabel="Short links stay. Tap again to retire the long one."
      onConfirm={async () => {
        await regenerateLinkAction(groupId);
        router.refresh();
      }}
    />
  );
}
