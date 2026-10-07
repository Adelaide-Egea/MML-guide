"use client";

import { saveMemberPhone } from "@/actions/member";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PhoneOptIn({
  token,
  phone,
}: {
  token: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(phone ?? "");
  const [editing, setEditing] = useState(!phone);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!editing && phone) {
    return (
      <button
        type="button"
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-left text-sm"
        onClick={() => {
          setEditing(true);
          setValue(phone);
          setMessage(null);
          setError(null);
        }}
      >
        <span className="font-semibold">Phone for updates</span>
        <span className="mt-0.5 block text-[var(--muted)]">{phone}</span>
      </button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const res = await saveMemberPhone(token, value);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          const saved = value.trim();
          setMessage(
            saved
              ? "Saved — we'll use this if you're not on WhatsApp."
              : "Phone removed.",
          );
          setEditing(!saved);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold">Not on the WhatsApp group?</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Optional — leave your mobile and the organiser can text you the date,
          time and place. Only the organiser sees this.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Mobile number
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 07700 900123"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 flex-1 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
        >
          {pending ? "Saving…" : value.trim() ? "Save number" : "Skip for now"}
        </button>
        {phone && (
          <button
            type="button"
            className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm"
            onClick={() => {
              setEditing(false);
              setValue(phone);
              setError(null);
              setMessage(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
    </form>
  );
}
