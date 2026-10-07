"use client";

import { LineChips } from "@/components/line-chips";
import { formatLongDate } from "@/lib/dates";
import type { HistoryEntry, Option } from "@/lib/types";
import { useState } from "react";

export function WhatsOn({
  ideas,
  comingSoon,
  past,
  preferredLines,
  bare = false,
}: {
  ideas: Option[];
  comingSoon: Option[];
  past: HistoryEntry[];
  preferredLines: string[];
  /** Already inside a tab — skip the show/hide and empty sections. */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(bare);
  const body = (
    <div className="flex flex-col gap-4">
      <Bucket title="Ideas" hideEmpty={bare}>
        {ideas.map((o) => (
          <IdeaRow key={o.id} option={o} preferredLines={preferredLines} />
        ))}
      </Bucket>
      <Bucket title="Coming soon" hideEmpty={bare}>
        {comingSoon.map((o) => (
          <IdeaRow key={o.id} option={o} preferredLines={preferredLines} />
        ))}
      </Bucket>
      <Bucket title="Past nights" hideEmpty={bare}>
        {past.map((h) => (
          <div key={h.id} className="text-body">
            <span className="text-[var(--grey)]">{formatLongDate(h.date)}</span>
            <span className="mx-2 text-[var(--grey)]">·</span>
            <span>{h.title}</span>
          </div>
        ))}
      </Bucket>
    </div>
  );

  if (bare) {
    const empty = ideas.length === 0 && comingSoon.length === 0 && past.length === 0;
    if (empty) return null;
    return body;
  }

  return (
    <section className="rounded-card border border-[var(--line)] bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-tap w-full items-center justify-between px-4 text-left"
      >
        <span className="font-display text-title">What&apos;s on</span>
        <span className="text-small text-[var(--grey)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t border-[var(--line)] px-4 py-4">{body}</div>}
    </section>
  );
}

function Bucket({
  title,
  hideEmpty = false,
  children,
}: {
  title: string;
  hideEmpty?: boolean;
  children: React.ReactNode[];
}) {
  if (children.length === 0) {
    if (hideEmpty) return null;
    return null;
  }
  return (
    <div>
      <h3 className="mb-2 text-small font-semibold text-[var(--grey)]">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function IdeaRow({
  option,
  preferredLines,
}: {
  option: Option;
  preferredLines: string[];
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {option.title}
            {option.is_new && (
              <span className="ml-2 rounded bg-[var(--gold-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--gold)]">
                New
              </span>
            )}
          </p>
          {option.venue && (
            <p className="text-sm text-[var(--muted)]">{option.venue}</p>
          )}
        </div>
        {option.price_from != null && (
          <span className="font-mono text-sm">from £{option.price_from}</span>
        )}
      </div>
      {option.lines?.length > 0 && (
        <div className="mt-2">
          <LineChips lines={option.lines} preferred={preferredLines} />
        </div>
      )}
    </div>
  );
}
