const EVENING_STEPS = [
  "Vote dates",
  "Results",
  "Pick the plan",
  "It's on",
] as const;

const DAY_STEPS = ["Vote days", "Results", "It's on"] as const;

export function ProgressBar({
  current,
  kind = "evening",
}: {
  current: 1 | 2 | 3 | 4;
  kind?: "evening" | "day";
}) {
  if (kind === "day") {
    // Map evening steps → day: 1→1, 2→2, 3/4→3
    const dayCurrent = current <= 2 ? current : 3;
    return (
      <ol className="grid grid-cols-3 gap-1.5" aria-label="Progress">
        {DAY_STEPS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3;
          const active = step === dayCurrent;
          const done = step < dayCurrent;
          return (
            <li key={label} className="min-w-0">
              <div
                className={`mb-1.5 h-1.5 rounded-full transition-colors ${
                  active || done ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
              />
              <span
                className={`block truncate text-[10px] uppercase tracking-wider ${
                  active
                    ? "font-semibold text-[var(--accent)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Progress">
      {EVENING_STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4;
        const active = step === current;
        const done = step < current;
        return (
          <li key={label} className="min-w-0">
            <div
              className={`mb-1.5 h-1.5 rounded-full transition-colors ${
                active || done ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            />
            <span
              className={`block truncate text-[10px] uppercase tracking-wider ${
                active
                  ? "font-semibold text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
