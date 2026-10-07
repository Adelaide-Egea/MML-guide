"use client";

import { addOrganiserAction, removeOrganiserAction } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminOrganisers({
  ownerEmail,
  emails,
}: {
  ownerEmail: string;
  emails: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const owner = ownerEmail.toLowerCase();

  return (
    <section className="rounded-card border border-[var(--line)] bg-white p-4">
      <h2 className="font-display text-title">Organisers</h2>
      <p className="mt-1 text-small text-[var(--grey)]">
        Add an email. They get a sign-in link.
      </p>
      <ul className="mt-4 space-y-2">
        {emails.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2"
          >
            <span className="text-sm">
              {item}
              {item === owner ? (
                <span className="text-[var(--muted)]"> · you</span>
              ) : null}
            </span>
            {item !== owner && (
              <button
                type="button"
                disabled={pending}
                className="min-h-11 shrink-0 text-sm text-[var(--muted)] underline-offset-2 hover:underline"
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const res = await removeOrganiserAction(item);
                    if (res && !res.ok) setError(res.error);
                    else router.refresh();
                  });
                }}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await addOrganiserAction(email);
            if (!res.ok) setError(res.error);
            else {
              setEmail("");
              router.refresh();
            }
          });
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their email"
          className="min-h-12 flex-1 rounded-xl border border-[var(--border)] px-3"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
        >
          Add organiser
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
