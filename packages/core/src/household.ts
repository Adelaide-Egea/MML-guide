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
  | 'Sheets'
  | 'Towels'
  | 'TeaTowels'
  | 'ToiletPaper'
  | 'Kitchen'
  | 'Bathroom'
  | 'Floors'
  | 'Surfaces'
  | 'Oven'
  | 'Fridge'
  | 'Shower'
  | 'Dusting'
  | 'Vacuum'
  | 'Restock'
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
  'Sheets',
  'Towels',
  'TeaTowels',
  'ToiletPaper',
  'Kitchen',
  'Bathroom',
  'Floors',
  'Surfaces',
  'Oven',
  'Fridge',
  'Shower',
  'Dusting',
  'Vacuum',
  'Restock',
  'Other',
];

/** Human labels for kinds whose enum id is not already readable English. */
export const ROUTINE_KIND_LABEL: Record<RoutineKind, string> = {
  Breakfast: 'Breakfast',
  Snack: 'Snack',
  Lunch: 'Lunch',
  Dinner: 'Dinner',
  Feed: 'Feed',
  Bottle: 'Bottle',
  Nappy: 'Nappy',
  Nap: 'Nap',
  Bath: 'Bath',
  Bedtime: 'Bedtime',
  School: 'School',
  Walk: 'Walk',
  Litter: 'Litter',
  Activity: 'Activity',
  Medication: 'Medication',
  Bins: 'Bins',
  Plants: 'Plants',
  Post: 'Post',
  Laundry: 'Laundry',
  Sheets: 'Sheets',
  Towels: 'Towels',
  TeaTowels: 'Tea towels',
  ToiletPaper: 'Toilet paper',
  Kitchen: 'Kitchen',
  Bathroom: 'Bathroom',
  Floors: 'Floors',
  Surfaces: 'Surfaces',
  Oven: 'Oven',
  Fridge: 'Fridge',
  Shower: 'Shower',
  Dusting: 'Dusting',
  Vacuum: 'Vacuum',
  Restock: 'Restock',
  Other: 'Other',
};

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
  place: [
    'Sheets',
    'Towels',
    'TeaTowels',
    'ToiletPaper',
    'Kitchen',
    'Bathroom',
    'Floors',
    'Surfaces',
    'Oven',
    'Fridge',
    'Shower',
    'Dusting',
    'Vacuum',
    'Laundry',
    'Bins',
    'Plants',
    'Post',
    'Restock',
    'Other',
  ],
};

export type RoutinePriority = 'must' | 'nice';

/** Place checklist kinds — kept even when an evening handover would otherwise
 *  drop everything that is not dinner-through-bedtime. */
export function isPlaceRoutineKind(kind: RoutineKind): boolean {
  return (ROUTINE_KINDS_FOR.place as readonly RoutineKind[]).includes(kind);
}

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
  /** Custom name when `kind` is Other (or any override the parent prefers). */
  readonly label?: string;
  /** Checklist grouping for place work — e.g. "Change", "Deep clean". */
  readonly section?: string;
  /** Must-do vs nice-to-have for a cleaner visit. */
  readonly priority?: RoutinePriority;
  /** Product or tool to use for this task (steamer, specific detergent, etc.). */
  readonly product?: string;
}

/** What to print on a row: a custom "Other" name when set, otherwise the kind label.
 *
 *  Pass localized `labels` (e.g. `chromeFor(tag).routineKinds`) on caregiver
 *  surfaces. Custom parent names stay as written.
 */
export function routineItemLabel(
  item: Pick<RoutineItem, 'kind' | 'label'>,
  labels: Readonly<Record<RoutineKind, string>> = ROUTINE_KIND_LABEL,
): string {
  if (item.label?.trim()) return item.label.trim();
  return labels[item.kind];
}

/** One caregiver-visible row after collapsing identical slots that only differ by who.
 *
 *  Two 10:00 snacks — one for Elise, one for Charlotte — become one row listing both.
 *  Different notes, labels, or times stay separate. `appliesTo: 'all'` already covers
 *  everyone and does not list names.
 */
export interface MergedRoutineRow {
  readonly item: RoutineItem;
  /** Subject ids this row applies to, or `['all']`. Preserves first-seen order. */
  readonly appliesToIds: readonly string[];
}

function routineMergeKey(item: RoutineItem): string {
  return [
    item.time ?? '',
    item.kind,
    item.label?.trim() ?? '',
    item.notes.trim(),
    item.section?.trim() ?? '',
    item.priority ?? '',
    item.product?.trim() ?? '',
  ].join('\0');
}

export function mergeRoutineRows(items: readonly RoutineItem[]): readonly MergedRoutineRow[] {
  const groups = new Map<string, { item: RoutineItem; appliesToIds: string[] }>();
  const order: string[] = [];
  for (const item of items) {
    const key = routineMergeKey(item);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { item, appliesToIds: [item.appliesTo] });
      order.push(key);
      continue;
    }
    if (item.appliesTo === 'all' || existing.appliesToIds.includes('all')) {
      existing.appliesToIds = ['all'];
      continue;
    }
    if (!existing.appliesToIds.includes(item.appliesTo)) {
      existing.appliesToIds.push(item.appliesTo);
    }
  }
  return order.map((key) => groups.get(key)!);
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

/** Kind of visit — what the caregiver is here for, not only how long. */
export type Scenario =
  | 'evening'
  | 'fullday'
  | 'weekend'
  | 'cleaner'
  | 'petsitter'
  | 'goingtoyours';

export const SCENARIOS: readonly Scenario[] = [
  'evening',
  'fullday',
  'weekend',
  'cleaner',
  'petsitter',
  'goingtoyours',
];

/** Default "what's expected of you" line under the greeting, per scenario. */
export const DEFAULT_EXPECTATION: Record<Scenario, string> = {
  evening:
    "When you arrive the children will already be asleep. You shouldn't need to do anything except be here — here's what to do if they wake.",
  fullday: 'A full day. Meals, nap and pickup are below.',
  weekend: 'A few days. Each day is on its own tab.',
  cleaner: "The house, room by room, in the order I'd walk it.",
  petsitter: "Feeding, walks and the vet's number are below.",
  goingtoyours: 'Everything that came in the bag, and what has to come home.',
};

/** Map a scenario onto the legacy duration used by routine scoping. */
export function durationFromScenario(scenario: Scenario): HandoverDuration {
  switch (scenario) {
    case 'evening':
      return 'evening';
    case 'fullday':
    case 'cleaner':
    case 'petsitter':
      return 'fullday';
    case 'weekend':
    case 'goingtoyours':
      return 'fewdays';
  }
}

/** Lift a pre-scenario handover that only stored duration. */
export function scenarioFromDuration(duration: HandoverDuration): Scenario {
  switch (duration) {
    case 'evening':
      return 'evening';
    case 'fullday':
      return 'fullday';
    case 'fewdays':
      return 'weekend';
  }
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value);
}

function isDuration(value: unknown): value is HandoverDuration {
  return value === 'evening' || value === 'fullday' || value === 'fewdays';
}

/** Ensure scenario + expectation exist; keep duration derived for older readers. */
export function normalizeHandover(
  raw: Partial<Handover> & Pick<Handover, 'id' | 'householdId'>,
): Handover {
  const scenario = isScenario(raw.scenario)
    ? raw.scenario
    : scenarioFromDuration(isDuration(raw.duration) ? raw.duration : 'fewdays');
  const expectation =
    typeof raw.expectation === 'string' && raw.expectation.trim()
      ? raw.expectation.trim()
      : DEFAULT_EXPECTATION[scenario];
  return {
    id: raw.id,
    householdId: raw.householdId,
    caregiverName: raw.caregiverName ?? '',
    caregiverRelationship: raw.caregiverRelationship ?? '',
    scenario,
    /** @deprecated Prefer `scenario`. Kept in sync for routine scoping and old links. */
    duration: durationFromScenario(scenario),
    language: raw.language ?? 'en',
    subjectIds: raw.subjectIds ?? [],
    importantNotes: raw.importantNotes ?? [],
    extra: raw.extra ?? '',
    signOff: raw.signOff ?? '',
    expectation,
    tripId: typeof raw.tripId === 'string' ? raw.tripId : null,
  };
}

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
  readonly scenario: Scenario;
  /**
   * @deprecated Prefer `scenario`. Still written so older clients and `scopeRoutine`
   * keep working; always derived from `scenario` on normalize.
   */
  readonly duration: HandoverDuration;
  /** Editable "what's expected of you" sentence under the greeting. */
  readonly expectation: string;
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
  /** Linked Away trip when scenario is goingtoyours. */
  readonly tripId: string | null;
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
