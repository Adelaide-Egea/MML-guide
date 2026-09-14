// Languages offered for the caregiver / cleaner view of a guide.
//
// Official statistics for domestic work are thin (ONS and equivalents often cannot
// publish language-by-occupation estimates), so this list combines what is published
// with what researchers and community organisations consistently report for UK and
// French households — including large undeclared or grey-market groups.
//
// Sources informing the set (not a ranking):
// - UK Rights Lab / Voice of Domestic Workers (2023): Filipino / Tagalog dominant on
//   Overseas Domestic Worker visas (~55%); survey circulated in EN, ES, PT, TL.
// - LAWRS and UK Latin American domestic-work research: Spanish and Brazilian /
//   Portuguese speakers are widely present, often undeclared.
// - France FEPEM / Observatoire de l'emploi à domicile: Portuguese-born workers ~23%
//   of immigrant domestic employees; Maghreb (Arabic / French) also large.
// - Common EU cleaner / nanny corridors: Polish, Romanian.
//
// English and French stay first as the household writing languages for Domela's
// launch markets. The caregiver can toggle into their own language for Ask and for
// on-screen chrome; safety-critical facts stay in the parent's words.

export interface CareLanguage {
  /** BCP-47 tag stored on the handover. */
  readonly tag: string;
  /** Short label on the toggle. */
  readonly label: string;
  /** Why it is offered — shown as a hint, not as marketing. */
  readonly reason: string;
}

export const CARE_LANGUAGES: readonly CareLanguage[] = [
  { tag: 'en', label: 'English', reason: 'Household writing language (UK / international).' },
  { tag: 'fr', label: 'Français', reason: 'Household writing language (France).' },
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

/** Resolve a stored or navigator tag to the closest offered language. */
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
