"use client";

import { useEffect, useState } from "react";

const CUES = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;

/** Calm wait state so a slow load doesn't look frozen. */
export function BreatheWait({
  label = "Opening organiser",
  compact = false,
  overlay = false,
}: {
  label?: string;
  compact?: boolean;
  overlay?: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((n) => (n + 1) % CUES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const inner = (
    <div
      className={
        compact && !overlay
          ? "flex items-center justify-center gap-4 py-2"
          : "flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-page text-center"
      }
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={`breathe-orb ${compact && !overlay ? "breathe-orb--sm" : ""}`}
      />
      <div>
        <p className="text-body text-[var(--ink)]">{CUES[step]}</p>
        <p className="mt-1 text-small text-[var(--grey)]">{label}</p>
      </div>
    </div>
  );

  if (!overlay) return inner;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--linen)]">{inner}</div>
  );
}
