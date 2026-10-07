"use client";

import { getSeason, type Season } from "@/lib/season";
import { useEffect, useState } from "react";

/**
 * Brief seasonal cheer — plays ~4s then fades away.
 * Hidden entirely when prefers-reduced-motion.
 */
export function SeasonalCheer({ season }: { season?: Season }) {
  const [active, setActive] = useState<Season>(season ?? "autumn");
  const [festive, setFestive] = useState(false);
  const [phase, setPhase] = useState<"on" | "fade" | "off">("on");

  useEffect(() => {
    const s = season ?? getSeason();
    setActive(s);
    const month = new Date().getMonth() + 1;
    setFestive(month === 12 || (month === 1 && new Date().getDate() <= 6));

    const fadeTimer = window.setTimeout(() => setPhase("fade"), 3500);
    const offTimer = window.setTimeout(() => setPhase("off"), 4800);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(offTimer);
    };
  }, [season]);

  if (phase === "off") return null;

  const wrap = `seasonal-cheer seasonal-cheer--${festive ? "festive" : active} ${
    phase === "fade" ? "seasonal-cheer--fade" : ""
  }`;

  if (festive) {
    return (
      <div className={wrap} aria-hidden>
        <div className="cheer-tree">
          <span className="cheer-tree-top" />
          <span className="cheer-tree-mid" />
          <span className="cheer-tree-base" />
          <span className="cheer-tree-trunk" />
          <span className="cheer-tree-star" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="cheer-flake"
            style={{
              left: `${8 + i * 11}%`,
              animationDelay: `${i * 0.35}s`,
              animationDuration: "4.2s",
              animationIterationCount: 1,
            }}
          />
        ))}
      </div>
    );
  }

  if (active === "autumn") {
    return (
      <div className={wrap} aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`cheer-leaf cheer-leaf--${(i % 3) + 1}`}
            style={{
              left: `${4 + i * 9.5}%`,
              animationDelay: `${i * 0.28}s`,
              animationDuration: "4.5s",
              animationIterationCount: 1,
            }}
          />
        ))}
      </div>
    );
  }

  if (active === "winter") {
    return (
      <div className={wrap} aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="cheer-flake"
            style={{
              left: `${3 + i * 8}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: "4.2s",
              animationIterationCount: 1,
            }}
          />
        ))}
      </div>
    );
  }

  if (active === "spring") {
    return (
      <div className={wrap} aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="cheer-petal"
            style={{
              left: `${6 + i * 11}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: "4.5s",
              animationIterationCount: 1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={wrap} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="cheer-spark"
          style={{
            left: `${10 + i * 14}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: "4s",
            animationIterationCount: 1,
          }}
        />
      ))}
    </div>
  );
}
