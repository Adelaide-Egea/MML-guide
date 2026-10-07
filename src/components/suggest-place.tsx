"use client";

import { suggestOptionAction } from "@/actions/member";
import { Toast, useToast } from "@/components/toast";
import { tabsForGroup } from "@/lib/options";
import type { GroupId, OptionKind } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SuggestPlace({
  token,
  groupId,
  compact = false,
}: {
  token: string;
  groupId: GroupId;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const kinds = tabsForGroup(groupId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [kind, setKind] = useState<OptionKind>(
    (kinds[0]?.kind as OptionKind) ?? "drinks",
  );
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");

  function reset() {
    setTitle("");
    setVenue("");
    setNote("");
    setUrl("");
    setKind((kinds[0]?.kind as OptionKind) ?? "drinks");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await suggestOptionAction(token, {
        title,
        venue,
        kind,
        note,
        url,
      });
      if (!res.ok) {
        toast.show(res.error);
        return;
      }
      toast.show("Added — thanks!");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-4 text-sm font-semibold text-[var(--accent)] ${
            compact ? "" : "bg-[var(--background-elevated)]"
          }`}
        >
          Add a place
        </button>
        <Toast message={toast.message} onDismiss={toast.dismiss} />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-title">Add a place</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="min-h-11 px-2 text-sm text-[var(--muted)]"
        >
          Cancel
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {kinds.map((k) => (
          <button
            key={k.kind}
            type="button"
            aria-pressed={kind === k.kind}
            onClick={() => setKind(k.kind as OptionKind)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
              kind === k.kind
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "border border-[var(--border)]"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-semibold">Name</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Bull's Head"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>

      <label className="block text-sm">
        <span className="font-semibold">Venue / area</span>
        <span className="ml-1 font-normal text-[var(--muted)]">(optional)</span>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Barnes High Street"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>

      <label className="block text-sm">
        <span className="font-semibold">Note</span>
        <span className="ml-1 font-normal text-[var(--muted)]">(optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why it's good / when to go"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>

      <label className="block text-sm">
        <span className="font-semibold">Link</span>
        <span className="ml-1 font-normal text-[var(--muted)]">(optional)</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>

      <button
        type="submit"
        disabled={!title.trim()}
        className="min-h-12 w-full rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-fg)] disabled:opacity-50"
      >
        Add idea
      </button>
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </form>
  );
}
