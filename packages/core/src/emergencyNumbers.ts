// Country emergency numbers — carried forward from Held.
//
// These are public-service numbers, not parent-entered facts. They depend on
// where the household is, so a guide opened in France must show SAMU/Police/Fire
// and one opened in the UK must show 999 / 111. Leaving them out was a regression.

export const EMERGENCY_COUNTRIES = [
  'United Kingdom',
  'France',
  'Spain',
  'Germany',
  'Italy',
  'Portugal',
  'Belgium',
  'Switzerland',
  'Netherlands',
  'USA',
  'Canada',
  'Australia',
] as const;

export type EmergencyCountry = (typeof EMERGENCY_COUNTRIES)[number];

/** English labels — service words are localised separately for the caregiver.
 *  Newlines (not middle dots) so each number can sit on its own line and become a tel: link. */
export const EMERGENCY_NUMBERS: Record<EmergencyCountry, string> = {
  'United Kingdom': '999 (emergency)\n111 (NHS)',
  France: '15 (SAMU)\n17 (Police)\n18 (Fire)\n112',
  Spain: '112\n061 (ambulance)',
  Germany: '110 (Police)\n112',
  Italy: '112\n118 (ambulance)',
  Portugal: '112',
  Belgium: '101 (Police)\n100 (Ambulance)\n112',
  Switzerland: '117 (Police)\n144 (Ambulance)\n118 (Fire)',
  Netherlands: '112',
  USA: '911',
  Canada: '911',
  Australia: '000',
};

const ALIASES: Record<string, EmergencyCountry> = {
  uk: 'United Kingdom',
  gb: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  fr: 'France',
  france: 'France',
  es: 'Spain',
  spain: 'Spain',
  de: 'Germany',
  germany: 'Germany',
  it: 'Italy',
  italy: 'Italy',
  pt: 'Portugal',
  portugal: 'Portugal',
  be: 'Belgium',
  belgium: 'Belgium',
  ch: 'Switzerland',
  switzerland: 'Switzerland',
  nl: 'Netherlands',
  netherlands: 'Netherlands',
  us: 'USA',
  usa: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  ca: 'Canada',
  canada: 'Canada',
  au: 'Australia',
  australia: 'Australia',
};

const SERVICE_WORDS: Record<string, Record<string, string>> = {
  fr: {
    Police: 'Police',
    Fire: 'Pompiers',
    Ambulance: 'Ambulance',
    emergency: 'urgences',
    Emergency: 'Urgences',
  },
  es: {
    Police: 'Policía',
    Fire: 'Bomberos',
    Ambulance: 'Ambulancia',
    emergency: 'emergencia',
    Emergency: 'Emergencias',
  },
  de: {
    Police: 'Polizei',
    Fire: 'Feuerwehr',
    Ambulance: 'Rettungsdienst',
    emergency: 'Notruf',
    Emergency: 'Notruf',
  },
  it: {
    Police: 'Polizia',
    Fire: 'Vigili del fuoco',
    Ambulance: 'Ambulanza',
    emergency: 'emergenza',
    Emergency: 'Emergenze',
  },
  pt: {
    Police: 'Polícia',
    Fire: 'Bombeiros',
    Ambulance: 'Ambulância',
    emergency: 'emergência',
    Emergency: 'Emergência',
  },
  nl: {
    Police: 'Politie',
    Fire: 'Brandweer',
    Ambulance: 'Ambulance',
    emergency: 'noodhulp',
    Emergency: 'Noodgeval',
  },
};

/** Map free-text / ISO country to a known emergency table key. */
export function matchEmergencyCountry(country: string): EmergencyCountry | null {
  const raw = country.trim();
  if (!raw) return null;
  if ((EMERGENCY_COUNTRIES as readonly string[]).includes(raw)) {
    return raw as EmergencyCountry;
  }
  return ALIASES[raw.toLowerCase()] ?? null;
}

function localiseEmergency(text: string, languageTag: string): string {
  const lang = languageTag.split('-')[0]?.toLowerCase() ?? 'en';
  const map = SERVICE_WORDS[lang];
  if (!map) return text;
  let out = text;
  for (const [en, local] of Object.entries(map)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), local);
  }
  return out;
}

/** Public emergency numbers for a household country, or null when unknown. */
export function emergencyNumbersFor(
  country: string,
  languageTag = 'en',
): { country: EmergencyCountry; numbers: string } | null {
  const matched = matchEmergencyCountry(country);
  if (!matched) return null;
  return {
    country: matched,
    numbers: localiseEmergency(EMERGENCY_NUMBERS[matched], languageTag),
  };
}
