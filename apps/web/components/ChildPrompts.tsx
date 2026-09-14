'use client';

import { type CareSubject, type ChildPrompt, promptsForChild, childAgeBand } from '@mml/core';

const BAND_HINT: Record<ReturnType<typeof childAgeBand>, string> = {
  baby: 'Under 3 — milk, nappies, sleep and comfort first.',
  preschool: 'About 3–5 — food, nursery, toilet and what to do if upset.',
  school: '5 and up — school run, screens, bedtime and independence.',
  unknown: 'Add an age above (e.g. “3 years”) to tailor these. Until then, the preschool set.',
};

/** Held's age-adaptive questions, as one-tap starters that create ordinary entries.
 *
 *  Open entries are what let the same product cover a dog and a flat. Children still
 *  need the questions a parent would answer with their coat on — so these chips fill
 *  an entry draft rather than inventing a second schema.
 */
export function ChildPrompts({
  subject,
  existingTitles,
  onPick,
}: {
  subject: CareSubject;
  existingTitles: ReadonlySet<string>;
  onPick: (prompt: ChildPrompt) => void;
}) {
  if (subject.kind !== 'child') return null;

  const band = childAgeBand(subject.descriptor);
  const prompts = promptsForChild(subject.descriptor).filter((p) => !existingTitles.has(p.title));

  if (prompts.length === 0) return null;

  return (
    <div className="card stack-tight" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="eyebrow">From Held — start with what matters</div>
      <p className="muted" style={{ margin: 0 }}>
        {BAND_HINT[band]} Tap one to fill it in. Everything stays editable.
      </p>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="chip"
            onClick={() => onPick(prompt)}
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
