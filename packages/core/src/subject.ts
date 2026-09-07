// What you are leaving in someone else's care.
//
// The v1 model gave a child a fixed set of fields — food, milk, nappies, school,
// screenTime. That shape cannot describe a dog, and it cannot describe a flat with
// plants in it, so a product that wants to cover "any handover" cannot be built on
// it. Worse, it silently decides what a parent is allowed to think is important:
// there was no field for "she will only eat out of the orange bowl", which is
// exactly the kind of thing handovers fail on.
//
// So a subject carries an open list of entries instead. An entry is one thing worth
// knowing, with a topic, a body, and optionally a photo or a short video. That one
// change is what makes the same engine serve the grandparent, the nanny, the cleaner
// and the person watering the plants, and it is also what makes the guide
// answerable: an entry is the unit that a question gets matched against and the
// unit that an answer cites.
//
// Safety-critical facts stay in their own typed slot rather than becoming entries,
// because they are the one thing that must never be summarised, translated in place,
// or reordered below the fold.

export type SubjectKind = 'child' | 'pet' | 'place';

export type MediaKind = 'photo' | 'video';

/** A photo or a short video attached to an entry.
 *
 *  This exists because showing is not the same as telling. "Make the bed properly"
 *  and a forty-second video of the bed being made are not the same instruction, and
 *  the gap between them is most of why handovers go wrong across a language barrier.
 */
export interface Media {
  readonly id: string;
  readonly kind: MediaKind;
  /** Storage key, not a URL. URLs are minted per viewer, with an expiry, by the
   *  surface — a guide shared with a caregiver must not become a permanently public
   *  photo of the inside of someone's house. */
  readonly key: string;
  /** Shown under the media and read out by the assistant. A photo of a cupboard is
   *  useless to a screen-reader user and to search without it. */
  readonly caption: string;
  /** Seconds. Null for photos. */
  readonly durationSeconds: number | null;
}

/** Topics exist so that retrieval and ordering do not depend on free text, and so
 *  that a caregiver can be shown "meals" without the parent having used that word.
 *  Deliberately coarse: a longer list would push the parent into filing rather than
 *  writing, which is the failure mode this product is supposed to remove.
 */
export type EntryTopic =
  | 'routine'
  | 'meals'
  | 'sleep'
  | 'clothing'
  | 'out-of-the-house'
  | 'comfort'
  | 'health'
  | 'access'
  | 'cleaning'
  | 'house-rules'
  | 'other';

export const ENTRY_TOPICS: readonly EntryTopic[] = [
  'routine',
  'meals',
  'sleep',
  'clothing',
  'out-of-the-house',
  'comfort',
  'health',
  'access',
  'cleaning',
  'house-rules',
  'other',
];

/** One thing worth knowing. */
export interface Entry {
  readonly id: string;
  readonly topic: EntryTopic;
  readonly title: string;
  readonly body: string;
  readonly media: readonly Media[];
  /** ISO-8601. Shown to the caregiver next to the answer, because "written in
   *  October" and "written last night" are different kinds of instruction. */
  readonly writtenAt: string;
  readonly writtenBy: string;
  /** BCP-47 tag for `title` and `body`. The parent's language, which is frequently
   *  not the caregiver's — the whole point of storing it. */
  readonly language: string;
}

/** Identity is a colour *token* plus a symbol, never a raw hex value: the palette
 *  has to be swappable centrally, and colour must never be the only thing telling
 *  one subject's information from another's. */
export interface SubjectIdentity {
  readonly colourToken: string;
  readonly symbol: string;
}

/** Facts that must survive verbatim from the parent's keyboard to the caregiver's
 *  screen. Nothing here may be paraphrased, summarised, translated in place or
 *  omitted, and nothing here may originate from a language model.
 *
 *  A place has these too — a boiler cut-off or an alarm code is the same class of
 *  fact as an allergy, in that getting it slightly wrong is the whole problem.
 */
export interface SafetyCritical {
  readonly allergies: string;
  readonly medication: string;
  readonly medicalNotes: string;
  /** Vet, emergency plumber, alarm company — whoever is called when it goes wrong
   *  for this particular subject. Household-wide contacts live on the household. */
  readonly emergencyNotes: string;
}

export const EMPTY_SAFETY: SafetyCritical = {
  allergies: '',
  medication: '',
  medicalNotes: '',
  emergencyNotes: '',
};

export interface CareSubject {
  readonly id: string;
  readonly kind: SubjectKind;
  readonly name: string;
  /** Free text so it works for every kind: "4 years", "Labrador, 7", "top floor
   *  flat". Structured age was only ever used to print a label. */
  readonly descriptor: string;
  readonly identity: SubjectIdentity;
  readonly safety: SafetyCritical;
  readonly entries: readonly Entry[];
}

// ── Normalisation ────────────────────────────────────────────────────────────
//
// Every string is trimmed on the way in so that '   ', '' and undefined are one
// case rather than three. The allergy bug survived as long as it did partly because
// "is there an allergy here?" was answered differently in four places.

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function hasText(value: unknown): boolean {
  return text(value).length > 0;
}

/** Joins parts of a fact a parent may have spread across fields, dropping empties.
 *  Read safety fields through here and nowhere else. */
export function joinFacts(...parts: readonly unknown[]): string {
  return parts.map(text).filter(Boolean).join(' — ');
}

export function allergyText(subject: Pick<CareSubject, 'safety'> | null | undefined): string {
  return text(subject?.safety?.allergies);
}

export function medicalText(subject: Pick<CareSubject, 'safety'> | null | undefined): string {
  return joinFacts(subject?.safety?.medication, subject?.safety?.medicalNotes);
}

export function emergencyText(subject: Pick<CareSubject, 'safety'> | null | undefined): string {
  return text(subject?.safety?.emergencyNotes);
}

export function hasSafetyCritical(subject: Pick<CareSubject, 'safety'> | null | undefined): boolean {
  return Boolean(allergyText(subject) || medicalText(subject) || emergencyText(subject));
}

export function subjectLabel(subject: CareSubject): string {
  const descriptor = text(subject.descriptor);
  return descriptor ? `${subject.name} (${descriptor})` : subject.name;
}

export function entriesByTopic(subject: CareSubject, topic: EntryTopic): readonly Entry[] {
  return subject.entries.filter((entry) => entry.topic === topic);
}

export function allMedia(subject: CareSubject): readonly Media[] {
  return subject.entries.flatMap((entry) => entry.media);
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface Issue {
  readonly path: string;
  readonly message: string;
  /** `blocking` stops a guide being produced; `warning` is surfaced but does not. */
  readonly severity: 'blocking' | 'warning';
}

export function validateSubject(subject: CareSubject, path = 'subject'): readonly Issue[] {
  const issues: Issue[] = [];

  if (!hasText(subject.name)) {
    issues.push({ path: `${path}.name`, message: 'Every subject needs a name.', severity: 'blocking' });
  }

  const seen = new Set<string>();
  subject.entries.forEach((entry, i) => {
    const at = `${path}.entries[${i}]`;
    if (seen.has(entry.id)) {
      issues.push({ path: `${at}.id`, message: 'Duplicate entry id.', severity: 'blocking' });
    }
    seen.add(entry.id);

    // An entry with neither words nor media is a filing action the parent took for
    // no benefit, which is precisely what this product is meant to stop happening.
    if (!hasText(entry.body) && entry.media.length === 0) {
      issues.push({ path: at, message: 'This entry is empty.', severity: 'warning' });
    }

    entry.media.forEach((media, j) => {
      if (!hasText(media.caption)) {
        issues.push({
          path: `${at}.media[${j}].caption`,
          message: 'Media needs a caption, or it is invisible to the assistant and to a screen reader.',
          severity: 'warning',
        });
      }
      if (media.kind === 'video' && (media.durationSeconds ?? 0) > 180) {
        issues.push({
          path: `${at}.media[${j}]`,
          message: 'Videos over three minutes do not get watched. Split it up.',
          severity: 'warning',
        });
      }
    });
  });

  return issues;
}

export function isBlocked(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === 'blocking');
}
