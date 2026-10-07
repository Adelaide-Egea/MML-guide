"use client";

import { useRef, useState } from "react";

export function CopyButton({
  text,
  getText,
  label = "Copy",
  className = "",
}: {
  /** Prefer this from Server Components — serializable. */
  text?: string;
  /** Only pass from Client Components (e.g. async WhatsApp builders). */
  getText?: () => Promise<string | null> | string | null;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  async function handleCopy() {
    const value = text ?? (getText ? await getText() : null);
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFallback(value);
      requestAnimationFrame(() => {
        taRef.current?.focus();
        taRef.current?.select();
      });
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCopy}
        className="min-h-11 w-full rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
      >
        {copied ? "Copied!" : label}
      </button>
      {fallback && (
        <textarea
          ref={taRef}
          readOnly
          value={fallback}
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
          rows={4}
          onBlur={() => setFallback(null)}
        />
      )}
    </div>
  );
}
