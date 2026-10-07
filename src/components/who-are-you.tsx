"use client";

import { identifyMember, joinAsNewMember } from "@/actions/member";
import type { RoundKind } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function WhoAreYou({
  token,
  members,
  channel,
}: {
  token: string;
  members: { id: string; first_name: string }[];
  channel?: RoundKind;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(members.length === 0);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [duplicate, setDuplicate] = useState<{
    id: string;
    first_name: string;
  } | null>(null);

  function findDuplicate(name: string) {
    const needle = name.trim().toLowerCase();
    return members.find((m) => m.first_name.toLowerCase() === needle) ?? null;
  }

  const ordered = [...members].sort((a, b) =>
    a.first_name.localeCompare(b.first_name, "en", { sensitivity: "base" }),
  );

  return (
    <div>
      <h2 className="font-display text-title text-[var(--ink)]">Who are you?</h2>

      {ordered.length > 0 && !showNew && (
        <div className="mt-4 grid gap-4">
          {ordered.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={pending}
              className="min-h-tap w-full rounded-card border border-[var(--line)] bg-white px-4 text-left text-body text-[var(--ink)]"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await identifyMember(token, m.id, channel);
                  if (!res.ok) setError(res.error);
                  else router.refresh();
                });
              }}
            >
              {m.first_name}
            </button>
          ))}
          <button
            type="button"
            className="min-h-tap text-small text-[var(--grey)]"
            onClick={() => {
              setShowNew(true);
              setDuplicate(null);
              setError(null);
            }}
          >
            + Add my name
          </button>
        </div>
      )}

      {showNew && duplicate && (
        <div className="mt-6 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
          <p className="font-display text-xl">
            Is this you: {duplicate.first_name}?
          </p>
          <p className="text-sm text-[var(--muted)]">
            That name is already in the group. Tap yes to continue as them, or
            no to use a different name (e.g. Adelaide B).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={pending}
              className="min-h-tap rounded-card bg-[var(--ink)] font-semibold text-white"
              onClick={() => {
                startTransition(async () => {
                  const res = await identifyMember(token, duplicate.id, channel);
                  if (!res.ok) setError(res.error);
                  else router.refresh();
                });
              }}
            >
              Yes, that&apos;s me
            </button>
            <button
              type="button"
              className="min-h-tap rounded-card border border-[var(--line)] bg-white font-semibold"
              onClick={() => {
                setDuplicate(null);
                setFirstName("");
              }}
            >
              No, different name
            </button>
          </div>
        </div>
      )}

      {showNew && !duplicate && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const existing = findDuplicate(firstName);
            if (existing) {
              setDuplicate(existing);
              return;
            }
            startTransition(async () => {
              const res = await joinAsNewMember(token, firstName, phone, channel);
              if (!res.ok) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <label className="block text-sm font-medium">
            First name
            <input
              autoFocus
              required
              maxLength={40}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              className="mt-1 min-h-tap w-full rounded-card border border-[var(--line)] bg-white px-4 text-body"
            />
          </label>
          <label className="block text-sm font-medium">
            Mobile{" "}
            <span className="font-normal text-[var(--muted)]">(optional)</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="If you're not on WhatsApp"
              className="mt-1 min-h-tap w-full rounded-card border border-[var(--line)] bg-white px-4 text-body"
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Only the organiser sees this. Leave blank if you&apos;re already in
            the WhatsApp group.
          </p>
          <button
            type="submit"
            disabled={pending || !firstName.trim()}
            className="min-h-tap w-full rounded-card bg-[var(--ink)] text-body font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Continue"}
          </button>
          {members.length > 0 && (
            <button
              type="button"
              className="min-h-11 w-full text-sm text-[var(--muted)] underline-offset-2 hover:underline"
              onClick={() => {
                setShowNew(false);
                setError(null);
              }}
            >
              Back to names
            </button>
          )}
        </form>
      )}

      {error && (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
