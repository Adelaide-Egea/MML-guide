"use client";

import { addOptionCommentAction } from "@/actions/member";
import { Toast, useToast } from "@/components/toast";
import type { OptionComment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function OptionComments({
  token,
  optionId,
  comments,
  memberNames,
  canPost = true,
}: {
  token: string;
  optionId: string;
  comments: OptionComment[];
  memberNames: Map<string, string>;
  canPost?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const forOption = comments.filter((c) => c.option_id === optionId);

  if (!canPost && forOption.length === 0) return null;

  return (
    <div className="mt-2 border-t border-dashed border-[var(--border)] pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
      >
        {forOption.length > 0
          ? `${forOption.length} note${forOption.length === 1 ? "" : "s"}`
          : "Add a note"}
        {open ? " ▲" : " ▼"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {forOption.map((c) => (
            <p key={c.id} className="text-xs text-[var(--muted)]">
              <span className="font-semibold text-foreground">
                {memberNames.get(c.member_id) ?? "Mum"}
              </span>
              : {c.body}
            </p>
          ))}
          {canPost && (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!body.trim()) return;
                startTransition(async () => {
                  const res = await addOptionCommentAction(
                    token,
                    optionId,
                    body,
                  );
                  if (!res.ok) {
                    toast.show(res.error);
                    return;
                  }
                  setBody("");
                  router.refresh();
                });
              }}
            >
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Not available on Tuesdays"
                maxLength={280}
                className="min-h-11 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm"
              />
              <button
                type="submit"
                className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold"
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
