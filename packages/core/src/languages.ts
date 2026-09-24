// Languages offered for the caregiver / cleaner view of a guide.
//
// Only languages with *complete* on-screen chrome are listed. Offering Tagalog
// (or Spanish, etc.) while buttons, routine kinds and the Call bar stay English
// is worse than a short list — it looks broken on the most important lines.
//
// Safety facts and parent-written notes stay in the parent's words in every
// language. Ask still answers in the selected language via the model.
//
// Incomplete chrome packs (pt, es, tl, ar, pl, ro, it) remain in chrome.ts for
// Ask / future use, but are not offered in the toggle until they are finished.

export interface CareLanguage {
  /** BCP-47 tag stored on the handover. */
  readonly tag: string;
  /** Short label on the toggle. */
  readonly label: string;
  /** Why it is offered — shown as a hint, not as marketing. */
  readonly reason: string;
}

/** Languages the caregiver can pick today — chrome is complete for these. */
export const CARE_LANGUAGES: readonly CareLanguage[] = [
  { tag: 'en', label: 'English', reason: 'Household writing language (UK / international).' },
  { tag: 'fr', label: 'Français', reason: 'Household writing language (France).' },
];

/**
 * Planned caregiver languages — not in the toggle until chrome (routine kinds,
 * Call, Ask placeholders, greetings) is fully translated.
 */
export const FUTURE_CARE_LANGUAGES: readonly CareLanguage[] = [
  {
    tag: 'pt-BR',
    label: 'Português (Brasil)',
    reason: 'Widely spoken among Latin American cleaners and carers in the UK, often undeclared.',
  },
  {
    tag: 'pt-PT',
    label: 'Português (Portugal)',
    reason: 'Largest immigrant group in French domestic employment (~23%).',
  },
  {
    tag: 'es',
    label: 'Español',
    reason: 'Latin American domestic workers in the UK (LAWRS and related research).',
  },
  {
    tag: 'tl',
    label: 'Tagalog',
    reason: 'Majority of UK Overseas Domestic Worker visas; Filipino carers and cleaners.',
  },
  {
    tag: 'ar',
    label: 'العربية',
    reason: 'Maghreb-origin workers are a large share of French domestic employment.',
  },
  {
    tag: 'pl',
    label: 'Polski',
    reason: 'Common among EU cleaners and nannies in the UK and France.',
  },
  {
    tag: 'ro',
    label: 'Română',
    reason: 'Common among EU domestic and care workers in Western Europe.',
  },
  {
    tag: 'it',
    label: 'Italiano',
    reason: 'Frequent among European au pairs and domestic staff in France / UK.',
  },
];

/** Resolve a stored or navigator tag to an offered language (en or fr). */
export function matchCareLanguage(tag: string): CareLanguage {
  const lower = tag.trim().toLowerCase();
  const exact = CARE_LANGUAGES.find((l) => l.tag.toLowerCase() === lower);
  if (exact) return exact;
  const prefix = lower.split('-')[0] ?? lower;
  return (
    CARE_LANGUAGES.find((l) => l.tag.toLowerCase() === prefix) ??
    CARE_LANGUAGES.find((l) => l.tag.toLowerCase().startsWith(prefix)) ??
    CARE_LANGUAGES[0]!
  );
}
