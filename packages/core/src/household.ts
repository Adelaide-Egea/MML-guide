// The household.
//
// The household — not the user, and not the app — is the unit that owns everything.
// A child's allergies are the same fact whether they appear in a care guide or a
// packing list, so they are stored once and read by every surface.
//
// A household holds *subjects*: the children, the dog, the flat. See `subject.ts`
// for why that generalisation is the load-bearing one. Contacts and the routine stay
// here because they cut across subjects — the same neighbour is called about the
// child and about the boiler, and the same evening contains a feed and a walk.
//
// Surfaces are referred to by internal identifier (`handover`, `away`) throughout.
// No product name appears in this package, so a naming decision cannot force a
// rename of routes, tables or types.

import {
  type CareSubject,
  type Issue,
  type SubjectKind,
  hasText,
  validateSubject,
} from './subject.ts';

export type SurfaceId = 'handover' | 'away';

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly relationship: string;
}

export type RoutineKind =
  | 'Breakfast'
  | 'Snack'
  | 'Lunch'
  | 'Dinner'
  | 'Feed'
  | 'Bottle'
  | 'Nappy'
  | 'Nap'
  | 'Bath'
  | 'Bedtime'
  | 'School'
  | 'Walk'
  | 'Litter'
  | 'Activity'
  | 'Medication'
  | 'Bins'
  | 'Plants'
  | 'Post'
  | 'Laundry'
  | 'Other';

/** Exported as a value so a surface can render the list without redeclaring it and
 *  drifting from the type, the way `ENTRY_TOPICS` does for entries. */
export const ROUTINE_KINDS: readonly RoutineKind[] = [
  'Breakfast',
  'Snack',
  'Lunch',
  'Dinner',
  'Feed',
  'Bottle',
  'Nappy',
  'Nap',
  'Bath',
  'Bedtime',
  'School',
  'Walk',
  'Litter',
  'Activity',
  'Medication',
  'Bins',
  'Plants',
  'Post',
  'Laundry',
  'Other',
];

/** Which kinds are worth offering for each sort of subject.
 *
 *  Not a restriction — 'Other' and the full list stay reachable — but a picker that
 *  offers "Nappy" for a flat and "Bins" for a baby is a picker the parent has to
 *  read rather than scan, and the whole point of a routine is that it is faster
 *  than writing prose.
 */
export const ROUTINE_KINDS_FOR: Record<SubjectKind, readonly RoutineKind[]> = {
  child: [
    'Breakfast',
    'Snack',
    'Lunch',
    'Dinner',
    'Bottle',
    'Nappy',
    'Nap',
    'Bath',
    'Bedtime',
    'School',
    'Activity',
    'Medication',
    'Other',
  ],
  pet: ['Feed', 'Walk', 'Litter', 'Medication', 'Activity', 'Other'],
  place: ['Bins', 'Plants', 'Post', 'Laundry', 'Other'],
};

/** The kinds worth offering for a routine row, given who it applies to.
 *
 *  A row pointed at the flat offering "Nappy" was the reported bug. `all` is
 *  deliberately wide rather than empty: a household with a baby and a dog genuinely
 *  can have an everyone-item of almost any kind, and narrowing that would trade one
 *  wrong list for another. `current` is always kept in the list so that changing who
 *  a row applies to can never blank the control or silently drop what was written.
 */
export function routineKindsFor(
  household: Household,
  appliesTo: string,
  current?: RoutineKind,
): readonly RoutineKind[] {
  const subject = household.subjects.find((s) => s.id === appliesTo);
  const allowed = new Set<RoutineKind>(
    subject
      ? ROUTINE_KINDS_FOR[subject.kind]
      : household.subjects.flatMap((s) => ROUTINE_KINDS_FOR[s.kind]),
  );
  if (allowed.size === 0) return ROUTINE_KINDS;
  if (current) allowed.add(current);
  return ROUTINE_KINDS.filter((k) => allowed.has(k));
}

export interface RoutineItem {
  readonly id: string;
  /** 24-hour `HH:MM`, or null when the item has no fixed time. */
  readonly time: string | null;
  readonly kind: RoutineKind;
  /** A subject id, or `all`. */
  readonly appliesTo: string;
  readonly notes: string;
}

export interface Household {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly subjects: readonly CareSubject[];
  readonly contacts: readonly Contact[];
  readonly routine: readonly RoutineItem[];
}

export type HandoverDuration = 'evening' | 'fullday' | 'fewdays';

/** One occasion: this caregiver, this stretch of time, these subjects.
 *
 *  The household is the durable part and a handover is the disposable part, which
 *  is what makes the second guide take twenty seconds rather than fourteen screens.
 */
export interface Handover {
  readonly id: string;
  readonly householdId: string;
  readonly caregiverName: string;
  readonly caregiverRelationship: string;
  readonly duration: HandoverDuration;
  /** BCP-47 tag. The caregiver's language, which is frequently not the parent's. */
  readonly language: string;
  /** Which subjects this caregiver is responsible for. Empty means all of them.
   *
   *  This is a privacy boundary rather than a convenience. Someone coming to clean
   *  the flat has no business reading a child's medical notes, and the default of
   *  "share the whole household" is how products in this category leak. */
  readonly subjectIds: readonly string[];
  readonly importantNotes: readonly string[];
  readonly extra: string;
  readonly signOff: string;
}

export function subjectsFor(household: Household, handover: Handover): readonly CareSubject[] {
  if (handover.subjectIds.length === 0) return household.subjects;
  const wanted = new Set(handover.subjectIds);
  return household.subjects.filter((s) => wanted.has(s.id));
}

export function subjectsIn(household: Household, appliesTo: string): readonly CareSubject[] {
  if (appliesTo === 'all') return household.subjects;
  return household.subjects.filter((s) => s.id === appliesTo);
}

// ── Validation ───────────────────────────────────────────────────────────────

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateHousehold(household: Household): readonly Issue[] {
  const issues: Issue[] = [];

  if (!hasText(household.name)) {
    issues.push({ path: 'name', message: 'The household needs a name.', severity: 'warning' });
  }

  if (household.subjects.length === 0) {
    issues.push({
      path: 'subjects',
      message: 'Add at least one person, animal or place to look after.',
      severity: 'blocking',
    });
  }

  const seen = new Set<string>();
  household.subjects.forEach((subject, i) => {
    issues.push(...validateSubject(subject, `subjects[${i}]`));
    if (seen.has(subject.id)) {
      issues.push({ path: `subjects[${i}].id`, message: 'Duplicate subject id.', severity: 'blocking' });
    }
    seen.add(subject.id);
  });

  household.contacts.forEach((contact, i) => {
    if (!hasText(contact.phone)) {
      issues.push({
        path: `contacts[${i}].phone`,
        message: `${contact.name || 'This contact'} has no phone number.`,
        severity: 'warning',
      });
    }
  });

  household.routine.forEach((item, i) => {
    if (item.time !== null && !TIME_PATTERN.test(item.time)) {
      issues.push({ path: `routine[${i}].time`, message: 'Time must be HH:MM.', severity: 'blocking' });
    }
    if (item.appliesTo !== 'all' && !seen.has(item.appliesTo)) {
      issues.push({
        path: `routine[${i}].appliesTo`,
        message: 'This routine item points at someone who is not in the household.',
        severity: 'blocking',
      });
    }
  });

  return issues;
}
