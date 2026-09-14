// Routine presets.
//
// A routine is the part of a handover that is most tedious to type and most
// repetitive between subjects: every baby has bottles and naps, every dog has two
// walks, every empty flat has bins and post. Typing that out is exactly the kind of
// filing work this product is supposed to remove, so the common shapes ship with it.
//
// Presets are a starting point, never a constraint. Applying one creates ordinary
// routine items that are then edited like any other, and the parent can save their
// own arrangement back as a preset to reuse on the next child.
//
// Note what a preset does *not* contain: no subject, no ids, no notes that assume a
// particular household. It is a shape, and `instantiatePreset` binds it to someone.

import type { RoutineItem, RoutineKind, RoutinePriority } from './household.ts';
import type { SubjectKind } from './subject.ts';

export interface TemplateItem {
  /** 24-hour `HH:MM`, or null for something with no fixed time. */
  readonly time: string | null;
  readonly kind: RoutineKind;
  readonly notes: string;
  readonly label?: string;
  readonly section?: string;
  readonly priority?: RoutinePriority;
  readonly product?: string;
}

export interface RoutinePreset {
  readonly id: string;
  readonly label: string;
  /** What this is for, in the parent's terms rather than the model's. */
  readonly hint: string;
  /** Which sort of subject this is offered for. */
  readonly appliesToKind: SubjectKind;
  readonly items: readonly TemplateItem[];
  /** Presets the parent saved themselves. Only these can be deleted. */
  readonly custom?: boolean;
}

/** Times are the middle of the usual range rather than a recommendation. They exist
 *  so the parent edits a number instead of producing one, which is a much smaller
 *  task, and so the items sort into a sensible order the moment they appear. */
export const BUILT_IN_PRESETS: readonly RoutinePreset[] = [
  {
    id: 'preset:baby',
    label: 'Baby',
    hint: 'Bottles, naps and nappies',
    appliesToKind: 'child',
    items: [
      { time: '07:00', kind: 'Bottle', notes: '' },
      { time: '08:00', kind: 'Nappy', notes: '' },
      { time: '09:30', kind: 'Nap', notes: '' },
      { time: '11:30', kind: 'Bottle', notes: '' },
      { time: '13:00', kind: 'Nap', notes: 'The long one.' },
      { time: '15:30', kind: 'Bottle', notes: '' },
      { time: '17:30', kind: 'Bath', notes: '' },
      { time: '18:00', kind: 'Bottle', notes: '' },
      { time: '18:30', kind: 'Bedtime', notes: '' },
    ],
  },
  {
    id: 'preset:toddler',
    label: 'Toddler',
    hint: 'Meals, one nap, bath and bed',
    appliesToKind: 'child',
    items: [
      { time: '07:30', kind: 'Breakfast', notes: '' },
      { time: '10:00', kind: 'Snack', notes: '' },
      { time: '12:30', kind: 'Lunch', notes: '' },
      { time: '13:15', kind: 'Nap', notes: '' },
      { time: '16:00', kind: 'Snack', notes: '' },
      { time: '18:00', kind: 'Dinner', notes: '' },
      { time: '18:30', kind: 'Bath', notes: '' },
      { time: '19:15', kind: 'Bedtime', notes: '' },
    ],
  },
  {
    id: 'preset:school-age',
    label: 'School age',
    hint: 'The school run, activities, bedtime',
    appliesToKind: 'child',
    items: [
      { time: '07:00', kind: 'Breakfast', notes: '' },
      { time: '08:20', kind: 'School', notes: 'Drop-off.' },
      { time: '16:00', kind: 'School', notes: 'Pick-up.' },
      { time: '16:30', kind: 'Snack', notes: '' },
      { time: '18:00', kind: 'Dinner', notes: '' },
      { time: '19:00', kind: 'Bath', notes: '' },
      { time: '20:00', kind: 'Bedtime', notes: '' },
    ],
  },
  {
    id: 'preset:dog',
    label: 'Dog',
    hint: 'Two walks and two meals',
    appliesToKind: 'pet',
    items: [
      { time: '07:30', kind: 'Walk', notes: 'Short one.' },
      { time: '08:00', kind: 'Feed', notes: '' },
      { time: '13:00', kind: 'Walk', notes: 'Quick garden trip.' },
      { time: '18:00', kind: 'Walk', notes: 'The long one.' },
      { time: '18:30', kind: 'Feed', notes: '' },
    ],
  },
  {
    id: 'preset:cat',
    label: 'Cat',
    hint: 'Food and the litter tray',
    appliesToKind: 'pet',
    items: [
      { time: '08:00', kind: 'Feed', notes: '' },
      { time: '08:15', kind: 'Litter', notes: '' },
      { time: '18:00', kind: 'Feed', notes: '' },
      { time: null, kind: 'Litter', notes: 'Whenever it needs it.' },
    ],
  },
  {
    id: 'preset:small-pet',
    label: 'Small animal',
    hint: 'Rabbit, hamster, guinea pig',
    appliesToKind: 'pet',
    items: [
      { time: '08:00', kind: 'Feed', notes: 'Fresh water too.' },
      { time: '18:00', kind: 'Feed', notes: '' },
      { time: null, kind: 'Litter', notes: 'Clean out while you are here.' },
    ],
  },
  {
    id: 'preset:empty-home',
    label: 'Empty home',
    hint: 'Bins, post and plants while nobody is in',
    appliesToKind: 'place',
    items: [
      {
        time: null,
        kind: 'Bins',
        notes: 'Out on the night before collection.',
        section: 'While away',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Post',
        notes: 'Bring it in off the mat.',
        section: 'While away',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Plants',
        notes: 'Once while you are here.',
        section: 'While away',
        priority: 'nice',
      },
    ],
  },
  {
    id: 'preset:cleaner-visit',
    label: 'Cleaner visit',
    hint: 'Must-dos for the day they come — not a timed schedule',
    appliesToKind: 'place',
    items: [
      {
        time: null,
        kind: 'Kitchen',
        notes: 'Counters, sink, hob.',
        section: 'Must do',
        priority: 'must',
        product: '',
      },
      {
        time: null,
        kind: 'Bathroom',
        notes: 'Basin, toilet, shower screen.',
        section: 'Must do',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Floors',
        notes: 'Vacuum then mop.',
        section: 'Must do',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Surfaces',
        notes: 'Wipe and dust the main rooms.',
        section: 'Must do',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Bins',
        notes: 'Empty kitchen and bathroom bins.',
        section: 'Must do',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Laundry',
        notes: 'On before you start, hung out before you go.',
        section: 'Nice to have',
        priority: 'nice',
      },
      {
        time: null,
        kind: 'Plants',
        notes: '',
        section: 'Nice to have',
        priority: 'nice',
      },
    ],
  },
  {
    id: 'preset:change-restock',
    label: 'Change & restock',
    hint: 'Sheets, towels, tea towels, toilet paper',
    appliesToKind: 'place',
    items: [
      {
        time: null,
        kind: 'Sheets',
        notes: 'Strip beds; fresh set is in the airing cupboard.',
        section: 'Change',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Towels',
        notes: 'Bathroom towels — replace with the clean stack.',
        section: 'Change',
        priority: 'must',
      },
      {
        time: null,
        kind: 'TeaTowels',
        notes: 'Kitchen tea towels and cloths.',
        section: 'Change',
        priority: 'must',
      },
      {
        time: null,
        kind: 'ToiletPaper',
        notes: 'Spare rolls under the sink.',
        section: 'Restock',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Restock',
        notes: 'Soap, washing-up liquid, bin bags if low.',
        section: 'Restock',
        priority: 'nice',
      },
    ],
  },
  {
    id: 'preset:deep-clean',
    label: 'Deep clean',
    hint: 'Oven, fridge, shower and the jobs that are not every visit',
    appliesToKind: 'place',
    items: [
      {
        time: null,
        kind: 'Oven',
        notes: 'Inside and the door glass.',
        section: 'Deep clean',
        priority: 'must',
        product: '',
      },
      {
        time: null,
        kind: 'Fridge',
        notes: 'Wipe shelves; bin anything past it.',
        section: 'Deep clean',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Shower',
        notes: 'Descaling / mould on the seal.',
        section: 'Deep clean',
        priority: 'must',
      },
      {
        time: null,
        kind: 'Dusting',
        notes: 'High shelves, lamp shades, skirting.',
        section: 'Deep clean',
        priority: 'nice',
      },
      {
        time: null,
        kind: 'Vacuum',
        notes: 'Under sofas and beds if you can move them.',
        section: 'Deep clean',
        priority: 'nice',
      },
    ],
  },
];

export function presetsFor(
  kind: SubjectKind,
  custom: readonly RoutinePreset[] = [],
): readonly RoutinePreset[] {
  return [...BUILT_IN_PRESETS, ...custom].filter((p) => p.appliesToKind === kind);
}

/** Binds a preset to a subject. `makeId` is passed in rather than generated here so
 *  the function stays pure and its output is assertable. */
export function instantiatePreset(
  preset: RoutinePreset,
  subjectId: string,
  makeId: () => string,
): readonly RoutineItem[] {
  return preset.items.map((item) => ({
    id: makeId(),
    time: item.time,
    kind: item.kind,
    appliesTo: subjectId,
    notes: item.notes,
    ...(item.label ? { label: item.label } : {}),
    ...(item.section ? { section: item.section } : {}),
    ...(item.priority ? { priority: item.priority } : {}),
    ...(item.product ? { product: item.product } : {}),
  }));
}

/** Turns what a parent actually built for one subject into a preset they can apply
 *  to the next one. Ids and the subject are dropped; times, kinds and notes are
 *  what carries over, because "the long one" is the useful part of "18:00 Walk". */
export function presetFromRoutine(
  label: string,
  appliesToKind: SubjectKind,
  routine: readonly RoutineItem[],
  subjectId: string,
  id: string,
): RoutinePreset {
  return {
    id,
    label,
    hint: 'Saved from your household',
    appliesToKind,
    custom: true,
    items: routine
      .filter((item) => item.appliesTo === subjectId)
      .map(({ time, kind, notes, label: itemLabel, section, priority, product }) => ({
        time,
        kind,
        notes,
        ...(itemLabel ? { label: itemLabel } : {}),
        ...(section ? { section } : {}),
        ...(priority ? { priority } : {}),
        ...(product ? { product } : {}),
      })),
  };
}

export function routineFor(
  routine: readonly RoutineItem[],
  subjectId: string,
): readonly RoutineItem[] {
  return routine.filter((item) => item.appliesTo === subjectId);
}
