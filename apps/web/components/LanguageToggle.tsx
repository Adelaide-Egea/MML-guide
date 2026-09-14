'use client';

import { CARE_LANGUAGES, matchCareLanguage } from '@mml/core';

/** Toggle for the caregiver's preferred reading / Ask language. */
export function LanguageToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (tag: string) => void;
}) {
  const current = matchCareLanguage(value);

  return (
    <div className="stack-tight no-print">
      <span className="hint">
        Guide language — English or French by default, with a toggle into the languages most
        common among UK and French carers and cleaners (including Brazilian Portuguese and
        Tagalog). Safety facts stay in the parent&apos;s words; Ask answers in this language.
      </span>
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
