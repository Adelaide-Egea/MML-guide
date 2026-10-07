import { normalizeLine, TFL_LINES } from "@/lib/tfl";

export function LineChips({
  lines,
  preferred = [],
}: {
  lines: string[];
  preferred?: string[];
}) {
  if (!lines.length) return null;
  const preferredSet = new Set(preferred.map(normalizeLine));

  return (
    <div className="flex flex-wrap gap-1.5">
      {lines.map((raw) => {
        const key = normalizeLine(raw);
        const meta = TFL_LINES[key] ?? TFL_LINES[raw.toLowerCase()];
        const isPreferred = preferredSet.size === 0 || preferredSet.has(key);
        const label = meta?.label ?? raw;
        if (!meta) {
          return (
            <span
              key={raw}
              className="rounded-md border border-[var(--chip-outline)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[var(--muted)]"
            >
              {label}
            </span>
          );
        }
        if (isPreferred) {
          return (
            <span
              key={raw}
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                meta.darkBorder ? "dark:outline dark:outline-1 dark:outline-white/40" : ""
              }`}
              style={{ backgroundColor: meta.bg, color: meta.text }}
            >
              {label}
            </span>
          );
        }
        return (
          <span
            key={raw}
            className="rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide opacity-70"
            style={{ borderColor: meta.bg, color: "var(--muted)" }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
