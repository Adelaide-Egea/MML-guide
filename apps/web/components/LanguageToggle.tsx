'use client';

import { CARE_LANGUAGES, chromeFor, matchCareLanguage } from '@mml/core';

/** Toggle for the caregiver's preferred reading / Ask language. */
export function LanguageToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (tag: string) => void;
}) {
  const current = matchCareLanguage(value);
  const chrome = chromeFor(current.tag);

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
