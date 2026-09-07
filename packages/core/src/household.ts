// The household model.
//
// The household — not the user, and not the app — is the unit that owns everything.
// A child's allergies are the same fact whether they appear in a care guide or a
// packing list, so they are stored once here and read by every surface.
//
// Surfaces are referred to by internal identifier (`handover`, `away`) throughout.
// No product name appears in this package, so naming decisions cannot force a
// rename of routes, tables or types.

export type SurfaceId = 'handover' | 'away';

export type AgeUnit = 'years' | 'months';

export interface Age {
  readonly value: number;
  readonly unit: AgeUnit;
}

/** Identity is a colour *token* plus a symbol, never a raw hex value.
 *
 *  Two constraints drove this. Several of the per-child colours in the current
 *  palette fail WCAG contrast, so the values have to be swappable centrally. And
 *  those colours are confusable under the common forms of colour blindness, so a
 *  child must always carry a non-colour marker alongside the hue — colour alone
 *  must never be the only thing distinguishing one child's information from
 *  another's.
 */
export interface ChildIdentity {
  readonly colourToken: string;
  readonly symbol: string;
}

/** Facts that must survive verbatim from the parent's keyboard to the caregiver's
 *  screen. Nothing in this shape may be paraphrased, summarised or omitted, and
 *  nothing in it may be sourced from a language model. See `guide.ts`.
 */
export interface SafetyCritical {
  readonly allergies: string;
  readonly medication: string;
  readonly medicalNotes: string;
}

export interface Child {
  readonly id: string;
  readonly name: string;
  readonly age: Age | null;
  readonly identity: ChildIdentity;
  readonly safety: SafetyCritical;
  readonly food: string;
  readonly milk: string;
  readonly nappies: string;
  readonly school: string;
  readonly screenTime: string;
  readonly likes: string;
  readonly whenUpset: string;
}

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
  | 'Milk/Feed'
  | 'Nap'
  | 'Bath'
  | 'Bedtime'
  | 'School'
  | 'Activity'
  | 'Medication'
  | 'Other';

export interface RoutineItem {
  readonly id: string;
  /** 24-hour `HH:MM`, or null when the item has no fixed time. */
  readonly time: string | null;
  readonly kind: RoutineKind;
  /** A child id, or `all`. */
  readonly appliesTo: string;
  readonly notes: string;
}

export interface Household {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly children: readonly Child[];
  readonly contacts: readonly Contact[];
  readonly routine: readonly RoutineItem[];
}

export type HandoverDuration = 'evening' | 'fullday' | 'fewdays';

/** One occasion: this caregiver, this stretch of time. The household is the durable
 *  part; a handover is the disposable part, which is what makes the second guide
 *  take twenty seconds instead of fourteen screens.
 */
export interface Handover {
  readonly id: string;
  readonly householdId: string;
  readonly caregiverName: string;
  readonly caregiverRelationship: string;
  readonly duration: HandoverDuration;
  /** BCP-47 tag. The caregiver's language, which is not necessarily the parent's. */
  readonly language: string;
  readonly importantNotes: readonly string[];
  readonly extra: string;
  readonly signOff: string;
}

// ── Normalisation ────────────────────────────────────────────────────────────
//
// Every string field is trimmed on the way in, so `'   '` and `''` and `undefined`
// are one case rather than three. The allergy bug survived as long as it did partly
// because "is there an allergy?" was answered differently in four places.

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function hasText(value: unknown): boolean {
  return text(value).length > 0;
}

/** Joins the parts of a fact that a parent may have entered across several fields,
 *  dropping the empties. Reading a safety field anywhere else in the codebase is a
 *  lint failure waiting to happen; read it through here.
 */
export function joinFacts(...parts: readonly unknown[]): string {
  return parts.map(text).filter(Boolean).join(' — ');
}

export function allergyText(child: Pick<Child, 'safety'> | null | undefined): string {
  if (!child) return '';
  return text(child.safety?.allergies);
}

export function medicalText(child: Pick<Child, 'safety'> | null | undefined): string {
  if (!child) return '';
  return joinFacts(child.safety?.medication, child.safety?.medicalNotes);
}

export function hasSafetyCritical(child: Pick<Child, 'safety'> | null | undefined): boolean {
  return Boolean(allergyText(child) || medicalText(child));
}

export function childrenIn(household: Household, appliesTo: string): readonly Child[] {
  if (appliesTo === 'all') return household.children;
  return household.children.filter((c) => c.id === appliesTo);
}

export function describeAge(age: Age | null): string {
  if (!age || !Number.isFinite(age.value)) return '';
  const rounded = Math.round(age.value * 10) / 10;
  const unit = age.unit === 'months' ? 'month' : 'year';
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'}`;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface Issue {
  readonly path: string;
  readonly message: string;
  /** `blocking` stops a guide being produced. `warning` is surfaced but does not. */
  readonly severity: 'blocking' | 'warning';
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateHousehold(household: Household): readonly Issue[] {
  const issues: Issue[] = [];

  if (!hasText(household.name)) {
    issues.push({ path: 'name', message: 'The household needs a name.', severity: 'warning' });
  }

  if (household.children.length === 0) {
    issues.push({ path: 'children', message: 'Add at least one child.', severity: 'blocking' });
  }

  const seenChildIds = new Set<string>();
  household.children.forEach((child, i) => {
    if (!hasText(child.name)) {
      issues.push({ path: `children[${i}].name`, message: 'Every child needs a name.', severity: 'blocking' });
    }
    if (seenChildIds.has(child.id)) {
      issues.push({ path: `children[${i}].id`, message: 'Duplicate child id.', severity: 'blocking' });
    }
    seenChildIds.add(child.id);
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
    if (item.appliesTo !== 'all' && !seenChildIds.has(item.appliesTo)) {
      issues.push({
        path: `routine[${i}].appliesTo`,
        message: 'This routine item points at a child who is not in the household.',
        severity: 'blocking',
      });
    }
  });

  return issues;
}

export function isBlocked(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === 'blocking');
}
