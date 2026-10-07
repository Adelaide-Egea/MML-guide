"use client";

import { SEASON_LABELS, type Season } from "@/lib/season";
import { useEffect, useState } from "react";

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

/** Demo/home control — try every palette without waiting for the calendar. */
export function SeasonPreview({ current }: { current: Season }) {
  const [active, setActive] = useState<Season>(current);

  useEffect(() => {
    document.documentElement.dataset.season = active;
  }, [active]);

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)]/80 p-4 backdrop-blur">
      <p className="text-sm font-semibold">Seasonal colours</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        The app follows Europe/London seasons. Tap to preview.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SEASONS.map((s) => {
          const on = active === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(s)}
              className={`min-h-11 rounded-xl px-3 text-left text-sm transition ${
                on
                  ? "bg-[var(--accent)] font-semibold text-[var(--accent-fg)]"
                  : "border border-[var(--border)] bg-[var(--background)]"
              }`}
            >
              {SEASON_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
