"use client";

import { switchMember } from "@/actions/member";
import { BreatheWait } from "@/components/breathe-wait";
import type { RoundKind } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function NotYou({
  token,
  name,
  channel,
}: {
  token: string;
  name: string;
  channel?: RoundKind;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      {pending && <BreatheWait overlay label="Switching" />}
      <button
        type="button"
        disabled={pending}
        aria-label={`Switch from ${name}`}
        className="inline-flex min-h-tap items-center text-body text-[var(--grey)]"
        onClick={() => {
          startTransition(async () => {
            await switchMember(token, channel);
            router.refresh();
          });
        }}
      >
        Switch
      </button>
    </>
  );
}
