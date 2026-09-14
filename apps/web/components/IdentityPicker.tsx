'use client';

import type { CareSubject, SubjectIdentity, SubjectKind } from '@mml/core';

const COLOURS: readonly { token: string; label: string }[] = [
  { token: '--id-petrol', label: 'Petrol' },
  { token: '--id-clay', label: 'Clay' },
  { token: '--id-indigo', label: 'Indigo' },
  { token: '--id-olive', label: 'Olive' },
  { token: '--id-plum', label: 'Plum' },
  { token: '--id-forest', label: 'Forest' },
];

const SHAPES: readonly string[] = ['●', '▲', '■', '◆', '★', '✚'];

const EMOJIS: Record<SubjectKind, readonly string[]> = {
  child: ['👧', '👦', '👶', '🧒', '⭐', '🌙', '🐻', '🐰', '🦊', '🦋', '🌈', '⚽'],
  pet: ['🐕', '🐈', '🐰', '🐹', '🐦', '🐢', '🐠', '🐾', '🦮', '🐩'],
  place: ['🏠', '🔑', '🪴', '🚪', '🪟', '🧹', '🧺', '🧼', '🪣', '🛋️'],
};

export function IdentityPicker({
  subject,
  onChange,
}: {
  subject: CareSubject;
  onChange: (identity: SubjectIdentity) => void;
}) {
  const emojis = EMOJIS[subject.kind];

  return (
    <div className="stack-tight" style={{ marginTop: 'var(--space-3)' }}>
      <span className="hint">
        Mark — a colour plus a symbol or emoji, so colour is never the only signal.
      </span>
      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {COLOURS.map((colour) => (
          <button
            key={colour.token}
            type="button"
            className="identity-swatch"
            aria-label={colour.label}
            aria-pressed={subject.identity.colourToken === colour.token}
            onClick={() => onChange({ ...subject.identity, colourToken: colour.token })}
            style={{ background: `var(${colour.token})` }}
          />
        ))}
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {[...SHAPES, ...emojis].map((symbol) => (
          <button
            key={symbol}
            type="button"
            className="identity-glyph"
            aria-pressed={subject.identity.symbol === symbol}
            onClick={() => onChange({ ...subject.identity, symbol })}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
