"use client";

import { getSeason, SEASON_LABELS, type Season } from "@/lib/season";
import { useEffect, useState } from "react";

/** Tiny seasonal cue — colour does the heavy lifting; this just names it. */
export function SeasonCue({
  season,
  className = "",
}: {
  season?: Season;
  className?: string;
}) {
  const [active, setActive] = useState<Season>(season ?? getSeason());

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const fromDom = root.dataset.season as Season | undefined;
      if (fromDom && fromDom in SEASON_LABELS) setActive(fromDom);
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-season"] });
    return () => obs.disconnect();
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--season-ring)] bg-[var(--season-wash)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--season-ink)] ${className}`}
      title={SEASON_LABELS[active]}
    >
      <span
        className="season-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
        aria-hidden
      />
      {SEASON_LABELS[active]}
    </span>
  );
}
