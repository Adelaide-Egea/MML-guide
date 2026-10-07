"use client";

import { demoAdminLogin, requestMagicLink } from "@/actions/auth";
import { BreatheWait } from "@/components/breathe-wait";
import { useState, useTransition } from "react";

export function AdminLoginForm({
  demoMode,
  defaultEmail,
}: {
  demoMode: boolean;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const res = demoMode
            ? await demoAdminLogin(email)
            : await requestMagicLink(email);
          if (res && "ok" in res && !res.ok) setError(res.error);
          if (res && "ok" in res && res.ok && "message" in res)
            setMessage(res.message as string);
        });
      }}
    >
      <label className="block text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
        />
      </label>
      {pending ? (
        <BreatheWait compact label="Sending your sign-in link" />
      ) : (
        <button
          type="submit"
          className="min-h-tap w-full rounded-card bg-[var(--ink)] font-semibold text-white"
        >
          {demoMode ? "Open organiser" : "Email me a magic link"}
        </button>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      {demoMode && (
        <p className="text-xs text-[var(--muted)]">
          Demo mode (no Supabase). Use the ADMIN_EMAIL from your env — default{" "}
          <code>admin@example.com</code>.
        </p>
      )}
    </form>
  );
}
