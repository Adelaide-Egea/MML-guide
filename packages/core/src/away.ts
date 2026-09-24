// Away — packing for a household trip.
//
// Readied's packing engine was the asset worth keeping: dry-spell maths (how many
// outfits you need given the longest run without laundry), transit bags when luggage
// is inaccessible, per-person lists, and a reverse "packing home" pass. The
// standalone product name does not appear here; the surface id is `away`.
//
// Deterministic first. AI can enrich later. Every item the parent ticks off is
// still an ordinary editable row — the builder is a starting list, not a cage.

import { childAgeBand, type ChildAgeBand } from './childPrompts.ts';
import type { Household } from './household.ts';
import type { CareSubject, Issue } from './subject.ts';
import { hasText } from './subject.ts';

export type TripId = string;
export type PackItemId = string;

export type DestinationKind = 'hotel' | 'family' | 'camping' | 'other';
export type TripMode = 'car' | 'flight' | 'train' | 'mixed';
export type PackLeg = 'outbound' | 'return';
export type PackCategory =
  | 'clothes'
  | 'toiletries'
  | 'documents'
  | 'meds'
  | 'kids'
  | 'tech'
  | 'transit'
  | 'home-return'
  | 'other';

export const DESTINATION_KINDS: readonly DestinationKind[] = [
  'hotel',
  'family',
  'camping',
  'other',
];

export const DESTINATION_LABEL: Record<DestinationKind, string> = {
  hotel: 'Hotel / rental',
  family: 'Family or friends',
  camping: 'Camping',
  other: 'Somewhere else',
};

export const TRIP_MODES: readonly TripMode[] = ['car', 'flight', 'train', 'mixed'];

export const TRIP_MODE_LABEL: Record<TripMode, string> = {
  car: 'Car',
  flight: 'Flight',
  train: 'Train',
  mixed: 'Mixed',
};

export const PACK_CATEGORIES: readonly PackCategory[] = [
  'clothes',
  'toiletries',
  'documents',
  'meds',
  'kids',
  'tech',
  'transit',
  'home-return',
  'other',
];

export const PACK_CATEGORY_LABEL: Record<PackCategory, string> = {
  clothes: 'Clothes',
  toiletries: 'Toiletries',
  documents: 'Documents',
  meds: 'Medication',
  kids: 'Kids',
  tech: 'Tech',
  transit: 'Transit bag',
  'home-return': 'Coming home',
  other: 'Other',
};

/** One row on a packing list. */
export interface PackItem {
  readonly id: PackItemId;
  readonly label: string;
  readonly category: PackCategory;
  /** Empty means shared / household bag. */
  readonly forSubjectIds: readonly string[];
  readonly qty: number;
  readonly packed: boolean;
  readonly notes: string;
  readonly leg: PackLeg;
  /** Must come back with the children — shown on the return list. */
  readonly comesHome: boolean;
  /** Free-text bag group, e.g. "Léa's bag", "Shared". */
  readonly bag: string;
}

/** A stretch of the journey. v0 usually has one leg; the shape is ready for multi-leg. */
export interface TripLeg {
  readonly id: string;
  readonly placeLabel: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly mode: TripMode;
  /** Travellers on this leg. Empty means everyone listed on the trip. */
  readonly travellerIds: readonly string[];
  readonly laundryAccess: boolean;
  /** When laundry is available after this many nights from the leg start. Null = end. */
  readonly laundryAfterNights: number | null;
  readonly overnight: boolean;
  /** Luggage inaccessible for part of the journey (flight hold, ferry). */
  readonly transit: boolean;
}

export interface Trip {
  readonly id: TripId;
  readonly householdId: string;
  readonly title: string;
  readonly destinationKind: DestinationKind;
  readonly destinationLabel: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly mode: TripMode;
  /** People travelling. Places usually stay home. */
  readonly travellerIds: readonly string[];
  readonly legs: readonly TripLeg[];
  readonly items: readonly PackItem[];
  readonly notes: string;
  /** ISO date when the return list becomes the default view. */
  readonly returnsOn: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Lift older pack rows that predate bag / comesHome. */
export function normalizePackItem(raw: Partial<PackItem> & Pick<PackItem, 'id' | 'label'>): PackItem {
  const leg: PackLeg = raw.leg === 'return' ? 'return' : 'outbound';
  const category = (PACK_CATEGORIES as readonly string[]).includes(raw.category as string)
    ? (raw.category as PackCategory)
    : 'other';
  return {
    id: raw.id,
    label: raw.label,
    category,
    forSubjectIds: raw.forSubjectIds ?? [],
    qty: typeof raw.qty === 'number' && raw.qty > 0 ? raw.qty : 1,
    packed: Boolean(raw.packed),
    notes: raw.notes ?? '',
    leg,
    comesHome:
      typeof raw.comesHome === 'boolean'
        ? raw.comesHome
        : leg === 'return' || category === 'home-return',
    bag: typeof raw.bag === 'string' && raw.bag.trim() ? raw.bag.trim() : 'Shared',
  };
}

/** Lift older trips that predate returnsOn / pack bag fields. */
export function normalizeTrip(raw: Trip): Trip {
  return {
    ...raw,
    returnsOn: raw.returnsOn ?? raw.endDate ?? null,
    items: (raw.items ?? []).map((item) => normalizePackItem(item)),
  };
}

export interface PackingBuildInput {
  readonly household: Household;
  readonly travellerIds: readonly string[];
  readonly startDate: string;
  readonly endDate: string;
  readonly mode: TripMode;
  readonly destinationKind: DestinationKind;
  readonly destinationLabel: string;
  readonly laundryAccess: boolean;
  readonly laundryAfterNights?: number | null;
  readonly transit?: boolean;
  /** Inject ids in tests. */
  readonly id?: () => string;
}

// ── Dates & dry spell ────────────────────────────────────────────────────────

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Whole nights between two ISO dates (local calendar, not UTC wall-clock). */
export function nightsBetween(startDate: string, endDate: string): number {
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) return 0;
  const [ys, ms, ds] = startDate.split('-').map(Number) as [number, number, number];
  const [ye, me, de] = endDate.split('-').map(Number) as [number, number, number];
  const start = Date.UTC(ys, ms - 1, ds);
  const end = Date.UTC(ye, me - 1, de);
  const nights = Math.round((end - start) / 86_400_000);
  return Math.max(0, nights);
}

/** Longest continuous stretch without laundry — drives outfit counts. */
export function drySpellNights(
  nights: number,
  laundryAccess: boolean,
  laundryAfterNights: number | null = null,
): number {
  if (nights <= 0) return 1;
  if (!laundryAccess) return nights;
  if (laundryAfterNights === null || laundryAfterNights <= 0) {
    // Laundry sometime mid-trip, timing unknown: assume roughly half.
    return Math.max(1, Math.ceil(nights / 2));
  }
  const before = Math.min(laundryAfterNights, nights);
  const after = Math.max(0, nights - laundryAfterNights);
  return Math.max(1, before, after);
}

export function travellersOn(
  household: Household,
  travellerIds: readonly string[],
): readonly CareSubject[] {
  if (travellerIds.length === 0) {
    return household.subjects.filter((s) => s.kind !== 'place');
  }
  const wanted = new Set(travellerIds);
  return household.subjects.filter((s) => wanted.has(s.id));
}

// ── Builder ──────────────────────────────────────────────────────────────────

interface Draft {
  label: string;
  category: PackCategory;
  forSubjectIds: readonly string[];
  qty: number;
  notes: string;
  leg: PackLeg;
}

function qtyLabel(label: string, qty: number): string {
  return qty > 1 ? `${label} (×${qty})` : label;
}

function clothesFor(
  subject: CareSubject,
  dry: number,
  destinationKind: DestinationKind,
): Draft[] {
  const who = [subject.id];
  const band: ChildAgeBand = subject.kind === 'child' ? childAgeBand(subject.descriptor) : 'unknown';
  const items: Draft[] = [];

  const underwear = dry + 1;
  const socks = dry + 1;
  const tops = dry;
  const bottoms = Math.max(2, Math.ceil(dry / 2));
  const sleep = Math.max(1, Math.ceil(dry / 3));

  if (subject.kind === 'pet') {
    items.push({
      label: qtyLabel('Lead / harness', 1),
      category: 'other',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Food portions', dry + 1),
      category: 'other',
      forSubjectIds: who,
      qty: dry + 1,
      notes: subject.safety.allergies ? `Note: ${subject.safety.allergies}` : '',
      leg: 'outbound',
    });
    items.push({
      label: 'Bowl',
      category: 'other',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    if (hasText(subject.safety.medication)) {
      items.push({
        label: 'Medication',
        category: 'meds',
        forSubjectIds: who,
        qty: 1,
        notes: subject.safety.medication,
        leg: 'outbound',
      });
    }
    return items;
  }

  if (band === 'baby') {
    items.push({
      label: qtyLabel('Nappies (estimate)', dry * 6),
      category: 'kids',
      forSubjectIds: who,
      qty: dry * 6,
      notes: 'Rough day count — adjust to your brand and size.',
      leg: 'outbound',
    });
    items.push({
      label: 'Wipes',
      category: 'kids',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Bodysuits / onesies', dry + 2),
      category: 'clothes',
      forSubjectIds: who,
      qty: dry + 2,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Sleepsuits', sleep + 1),
      category: 'clothes',
      forSubjectIds: who,
      qty: sleep + 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'Bottles / feeding kit',
      category: 'kids',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'Comfort item',
      category: 'kids',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  } else {
    items.push({
      label: qtyLabel('Underwear', underwear),
      category: 'clothes',
      forSubjectIds: who,
      qty: underwear,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Socks', socks),
      category: 'clothes',
      forSubjectIds: who,
      qty: socks,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Tops', tops),
      category: 'clothes',
      forSubjectIds: who,
      qty: tops,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Bottoms', bottoms),
      category: 'clothes',
      forSubjectIds: who,
      qty: bottoms,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: qtyLabel('Sleepwear', sleep),
      category: 'clothes',
      forSubjectIds: who,
      qty: sleep,
      notes: '',
      leg: 'outbound',
    });
    if (band === 'preschool' || band === 'school') {
      items.push({
        label: 'Spare outfit',
        category: 'kids',
        forSubjectIds: who,
        qty: 1,
        notes: 'For spills and muddy parks.',
        leg: 'outbound',
      });
      items.push({
        label: 'Comfort item',
        category: 'kids',
        forSubjectIds: who,
        qty: 1,
        notes: '',
        leg: 'outbound',
      });
    }
  }

  if (destinationKind === 'camping') {
    items.push({
      label: 'Warm layer',
      category: 'clothes',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'Rain shell',
      category: 'clothes',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  } else {
    items.push({
      label: 'Outer layer',
      category: 'clothes',
      forSubjectIds: who,
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  }

  items.push({
    label: 'Toothbrush & toiletries',
    category: 'toiletries',
    forSubjectIds: who,
    qty: 1,
    notes: '',
    leg: 'outbound',
  });

  if (hasText(subject.safety.medication)) {
    items.push({
      label: 'Medication',
      category: 'meds',
      forSubjectIds: who,
      qty: 1,
      notes: subject.safety.medication,
      leg: 'outbound',
    });
  }
  if (hasText(subject.safety.allergies) && subject.kind === 'child') {
    items.push({
      label: 'Allergy notes / card',
      category: 'meds',
      forSubjectIds: who,
      qty: 1,
      notes: subject.safety.allergies,
      leg: 'outbound',
    });
  }

  return items;
}

function sharedOutbound(
  mode: TripMode,
  destinationKind: DestinationKind,
  nights: number,
): Draft[] {
  const items: Draft[] = [
    {
      label: 'Phone chargers',
      category: 'tech',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    },
    {
      label: 'First-aid basics',
      category: 'meds',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    },
  ];

  if (mode === 'flight' || mode === 'train' || mode === 'mixed') {
    items.push({
      label: 'Tickets / boarding passes',
      category: 'documents',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'IDs / passports',
      category: 'documents',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  }

  if (mode === 'car' || mode === 'mixed') {
    items.push({
      label: 'Car snacks & water',
      category: 'other',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  }

  if (destinationKind === 'camping') {
    items.push({
      label: 'Tent / shelter',
      category: 'other',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'Sleeping bags',
      category: 'other',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    items.push({
      label: 'Cooking kit',
      category: 'other',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
  }

  if (destinationKind === 'hotel' || destinationKind === 'family') {
    items.push({
      label: 'House keys / destination access',
      category: 'documents',
      forSubjectIds: [],
      qty: 1,
      notes: nights > 0 ? '' : 'Same-day — still take keys if needed.',
      leg: 'outbound',
    });
  }

  return items;
}

function transitBag(travellers: readonly CareSubject[], mode: TripMode): Draft[] {
  if (mode !== 'flight' && mode !== 'train' && mode !== 'mixed') return [];
  const items: Draft[] = [
    {
      label: 'Transit bag: chargers & cables',
      category: 'transit',
      forSubjectIds: [],
      qty: 1,
      notes: 'Keep with you when the big bags are checked.',
      leg: 'outbound',
    },
    {
      label: 'Transit bag: snacks & water',
      category: 'transit',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    },
    {
      label: 'Transit bag: documents',
      category: 'transit',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'outbound',
    },
  ];

  for (const subject of travellers) {
    if (subject.kind !== 'child') continue;
    const band = childAgeBand(subject.descriptor);
    items.push({
      label: `Transit: change of clothes — ${subject.name}`,
      category: 'transit',
      forSubjectIds: [subject.id],
      qty: 1,
      notes: '',
      leg: 'outbound',
    });
    if (band === 'baby') {
      items.push({
        label: `Transit: nappies & wipes — ${subject.name}`,
        category: 'transit',
        forSubjectIds: [subject.id],
        qty: 1,
        notes: '',
        leg: 'outbound',
      });
    }
    if (hasText(subject.safety.medication)) {
      items.push({
        label: `Transit: medication — ${subject.name}`,
        category: 'transit',
        forSubjectIds: [subject.id],
        qty: 1,
        notes: subject.safety.medication,
        leg: 'outbound',
      });
    }
  }

  return items;
}

function returnLeg(travellers: readonly CareSubject[]): Draft[] {
  const items: Draft[] = [
    {
      label: 'Dirty laundry bag',
      category: 'home-return',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'return',
    },
    {
      label: 'Chargers & cables (check sockets)',
      category: 'home-return',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'return',
    },
    {
      label: 'Leftover food / fridge clear-out',
      category: 'home-return',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'return',
    },
    {
      label: 'Keys & documents back in the bag',
      category: 'home-return',
      forSubjectIds: [],
      qty: 1,
      notes: '',
      leg: 'return',
    },
  ];

  for (const subject of travellers) {
    if (subject.kind === 'child') {
      items.push({
        label: `Comfort item — ${subject.name}`,
        category: 'home-return',
        forSubjectIds: [subject.id],
        qty: 1,
        notes: 'Easy to leave under a pillow.',
        leg: 'return',
      });
    }
    if (subject.kind === 'pet') {
      items.push({
        label: `Lead & bowl — ${subject.name}`,
        category: 'home-return',
        forSubjectIds: [subject.id],
        qty: 1,
        notes: '',
        leg: 'return',
      });
    }
  }

  return items;
}

/** Build a deterministic packing list from household people and trip constraints. */
export function buildPackingList(input: PackingBuildInput): readonly PackItem[] {
  const id =
    input.id ??
    (() => {
      let n = 0;
      return () => `pack_${++n}`;
    })();
  const nights = nightsBetween(input.startDate, input.endDate);
  const dry = drySpellNights(nights, input.laundryAccess, input.laundryAfterNights ?? null);
  const travellers = travellersOn(input.household, input.travellerIds);
  const transit =
    input.transit ?? (input.mode === 'flight' || input.mode === 'train' || input.mode === 'mixed');

  const drafts: Draft[] = [
    ...travellers.flatMap((s) => clothesFor(s, dry, input.destinationKind)),
    ...sharedOutbound(input.mode, input.destinationKind, nights),
    ...(transit ? transitBag(travellers, input.mode) : []),
    ...returnLeg(travellers),
  ];

  return drafts.map((d) => {
    const who =
      d.forSubjectIds.length === 0
        ? null
        : travellers.find((s) => s.id === d.forSubjectIds[0]) ?? null;
    return {
      id: id(),
      label: d.label,
      category: d.category,
      forSubjectIds: d.forSubjectIds,
      qty: d.qty,
      packed: false,
      notes: d.notes,
      leg: d.leg,
      comesHome: d.leg === 'return' || d.category === 'home-return',
      bag: who ? `${who.name}'s bag` : 'Shared',
    };
  });
}

export function createTrip(
  input: PackingBuildInput & {
    readonly householdId: string;
    readonly title?: string;
    readonly notes?: string;
    readonly now?: string;
    readonly tripId?: string;
    readonly legId?: string;
  },
): Trip {
  const now = input.now ?? new Date().toISOString();
  const nights = nightsBetween(input.startDate, input.endDate);
  const place = input.destinationLabel.trim() || DESTINATION_LABEL[input.destinationKind];
  const title =
    input.title?.trim() ||
    (nights === 0 ? place : `${place} · ${nights} night${nights === 1 ? '' : 's'}`);
  const transit =
    input.transit ?? (input.mode === 'flight' || input.mode === 'train' || input.mode === 'mixed');

  const leg: TripLeg = {
    id: input.legId ?? 'leg_1',
    placeLabel: place,
    startDate: input.startDate,
    endDate: input.endDate,
    mode: input.mode,
    travellerIds: input.travellerIds,
    laundryAccess: input.laundryAccess,
    laundryAfterNights: input.laundryAfterNights ?? null,
    overnight: nights > 0,
    transit,
  };

  return {
    id: input.tripId ?? `trip_${now}`,
    householdId: input.householdId,
    title,
    destinationKind: input.destinationKind,
    destinationLabel: place,
    startDate: input.startDate,
    endDate: input.endDate,
    mode: input.mode,
    travellerIds: input.travellerIds,
    legs: [leg],
    items: buildPackingList(input),
    notes: input.notes ?? '',
    returnsOn: input.endDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function packingProgress(
  items: readonly PackItem[],
  leg?: PackLeg,
): { readonly total: number; readonly packed: number } {
  const scoped = leg ? items.filter((i) => i.leg === leg) : items;
  return {
    total: scoped.length,
    packed: scoped.filter((i) => i.packed).length,
  };
}

export function validateTrip(trip: Trip, household: Household): readonly Issue[] {
  const issues: Issue[] = [];
  if (!hasText(trip.title)) {
    issues.push({ path: 'title', message: 'The trip needs a title.', severity: 'warning' });
  }
  if (!DATE_PATTERN.test(trip.startDate) || !DATE_PATTERN.test(trip.endDate)) {
    issues.push({
      path: 'dates',
      message: 'Start and end dates must be YYYY-MM-DD.',
      severity: 'blocking',
    });
  } else if (nightsBetween(trip.startDate, trip.endDate) < 0) {
    issues.push({
      path: 'dates',
      message: 'The end date is before the start.',
      severity: 'blocking',
    });
  }
  const ids = new Set(household.subjects.map((s) => s.id));
  for (const tid of trip.travellerIds) {
    if (!ids.has(tid)) {
      issues.push({
        path: 'travellerIds',
        message: 'A traveller is not in this household.',
        severity: 'blocking',
      });
    }
  }
  if (travellersOn(household, trip.travellerIds).length === 0) {
    issues.push({
      path: 'travellerIds',
      message: 'Pick at least one person or pet who is going.',
      severity: 'blocking',
    });
  }
  return issues;
}
