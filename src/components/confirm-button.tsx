"use client";

import { useState } from "react";

export function ConfirmButton({
  label,
  confirmLabel = "Tap again to confirm",
  onConfirm,
  className = "",
  danger = false,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  danger?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      className={`min-h-11 rounded-xl px-4 text-sm font-medium transition ${
        armed
          ? danger
            ? "bg-[var(--danger)] text-white"
            : "bg-[var(--accent)] text-[var(--accent-fg)]"
          : "border border-[var(--border)] bg-[var(--background-elevated)]"
      } ${className}`}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
          return;
        }
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    >
      {busy ? "…" : armed ? confirmLabel : label}
    </button>
  );
}
