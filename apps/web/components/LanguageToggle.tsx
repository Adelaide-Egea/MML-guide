'use client';

import { CARE_LANGUAGES, chromeFor, matchCareLanguage } from '@mml/core';

/** Toggle for the caregiver's preferred reading / Ask language. */
export function LanguageToggle({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (tag: string) => void;
  /** Quiet control for the hotel-card header — no long hint, no chip row. */
  compact?: boolean;
}) {
  const current = matchCareLanguage(value);
  const chrome = chromeFor(current.tag);

  if (compact) {
    return (
      <label className="hotel-lang no-print">
        <span className="visually-hidden">{chrome.languageHint}</span>
        <select
          className="hotel-lang-select"
          value={current.tag}
          onChange={(e) => onChange(e.target.value)}
          aria-label={chrome.languageHint}
        >
          {CARE_LANGUAGES.map((lang) => (
            <option key={lang.tag} value={lang.tag}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="stack-tight no-print">
      <span className="hint">{chrome.languageHint}</span>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {CARE_LANGUAGES.map((lang) => (
          <button
            key={lang.tag}
            type="button"
            className="chip"
            aria-pressed={current.tag === lang.tag}
            title={lang.reason}
            onClick={() => onChange(lang.tag)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
