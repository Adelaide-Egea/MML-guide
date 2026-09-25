'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type ChromeCopy,
  type GuideBlock,
  type Handover,
  bulletRecap,
  shouldOfferRecap,
} from '@mml/core';

/** Parent reviews bullet drafts, edits them, then approves onto the handover. */
export function BulletRecapEditor({
  chrome,
  handover,
  blocks,
  onSave,
}: {
  chrome: ChromeCopy;
  handover: Handover;
  blocks: readonly GuideBlock[];
  onSave: (entryRecaps: Readonly<Record<string, string>>) => void;
}) {
  const candidates = useMemo(
    () =>
      blocks.filter(
        (b) => b.id.startsWith('entry:') && !b.critical && shouldOfferRecap(b.body),
      ),
    [blocks],
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const block of candidates) {
      const entryId = block.id.slice('entry:'.length);
      next[entryId] = handover.entryRecaps[entryId] ?? bulletRecap(block.body);
    }
    setDrafts(next);
  }, [candidates, handover.entryRecaps, handover.id]);

  if (candidates.length === 0) return null;

  const approvedCount = candidates.filter((b) => {
    const id = b.id.slice('entry:'.length);
    return Boolean(handover.entryRecaps[id]?.trim());
  }).length;

  return (
    <section className="card stack-tight no-print" style={{ marginBottom: 'var(--space-4)' }}>
      <strong>{chrome.bulletRecapTitle}</strong>
      <p className="muted" style={{ margin: 0 }}>
        {chrome.bulletRecapHint}
      </p>
      {candidates.map((block) => {
        const entryId = block.id.slice('entry:'.length);
        return (
          <div key={block.id} className="stack-tight" style={{ marginTop: 'var(--space-3)' }}>
            <span className="eyebrow">{block.heading}</span>
            <label className="stack-tight">
              <span className="muted">{chrome.bulletRecapDraft}</span>
              <textarea
                className="input"
                rows={Math.min(8, Math.max(3, (drafts[entryId] ?? '').split('\n').length + 1))}
                value={drafts[entryId] ?? ''}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [entryId]: e.target.value }))
                }
              />
            </label>
            <details>
              <summary className="muted">{chrome.bulletRecapFullLabel}</summary>
              <p className="block-body" style={{ marginTop: 'var(--space-2)' }}>
                {block.body}
              </p>
            </details>
          </div>
        );
      })}
      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const next: Record<string, string> = {};
            for (const [id, text] of Object.entries(drafts)) {
              const trimmed = text.trim();
              if (trimmed) next[id] = trimmed;
            }
            onSave(next);
          }}
        >
          {chrome.bulletRecapApprove}
        </button>
        {approvedCount > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={() => onSave({})}>
            {chrome.bulletRecapClear}
          </button>
        ) : null}
      </div>
      {approvedCount > 0 ? (
        <p className="hint" style={{ margin: 0 }}>
          {chrome.bulletRecapApproved}
        </p>
      ) : null}
    </section>
  );
}
