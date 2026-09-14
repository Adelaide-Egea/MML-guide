// Guided prompts for children — carried forward from Held.
//
// Held asked age-adaptive questions (milk, nappies, nursery, school, likes vs what
// to do if upset) rather than presenting a blank page. When the model generalised
// to any subject, that prompting was dropped in favour of open entries. Entries stay
// — they are what makes pets and places possible — but a child still needs the
// questions a parent would actually answer at the door.
//
// These prompts create ordinary entries. They are a starting point, never a schema.

import type { EntryTopic } from './subject.ts';

export type ChildAgeBand = 'baby' | 'preschool' | 'school' | 'unknown';

/** Best-effort read of free-text descriptors like "3 years", "18 months", "3 ans". */
export function childAgeBand(descriptor: string): ChildAgeBand {
  const raw = descriptor.trim().toLowerCase();
  if (!raw) return 'unknown';

  const months = raw.match(/(\d+)\s*(months?|mois)/);
  if (months) {
    const n = Number(months[1]);
    if (n < 36) return 'baby';
    if (n < 60) return 'preschool';
    return 'school';
  }

  const years = raw.match(/(\d+)\s*(years?|yrs?|ans?)?/);
  if (years) {
    const n = Number(years[1]);
    // Bare numbers under 12 are treated as years; "14" on a school form is still school.
    if (n < 3) return 'baby';
    if (n < 5) return 'preschool';
    return 'school';
  }

  return 'unknown';
}

export interface ChildPrompt {
  readonly id: string;
  readonly topic: EntryTopic;
  readonly title: string;
  /** Shown on the chip. */
  readonly label: string;
  /** Placeholder body so the parent edits rather than invents. */
  readonly placeholder: string;
}

const BABY: readonly ChildPrompt[] = [
  {
    id: 'milk',
    topic: 'meals',
    title: 'Milk & bottles',
    label: 'Milk & bottles',
    placeholder: 'Formula / breast milk, how much, how often, how warm.',
  },
  {
    id: 'nappies',
    topic: 'routine',
    title: 'Nappies',
    label: 'Nappies',
    placeholder: 'Size, cream, where the clean ones are, anything about rash.',
  },
  {
    id: 'food',
    topic: 'meals',
    title: 'Food',
    label: 'Food',
    placeholder: 'Stage (purée, finger food…), likes, absolute nos, how they eat.',
  },
  {
    id: 'sleep',
    topic: 'sleep',
    title: 'Sleep',
    label: 'Sleep',
    placeholder: 'Naps, bedtime, sleeping bag / tog, what settles them.',
  },
  {
    id: 'comfort',
    topic: 'comfort',
    title: 'Likes & comfort',
    label: 'Likes & comfort',
    placeholder: 'Doudou, songs, games — the things that make them themselves.',
  },
  {
    id: 'upset',
    topic: 'comfort',
    title: 'If they are upset',
    label: 'If upset',
    placeholder: 'What actually works — space first, then the rabbit, singing not talking…',
  },
];

const PRESCHOOL: readonly ChildPrompt[] = [
  {
    id: 'food',
    topic: 'meals',
    title: 'Food',
    label: 'Food',
    placeholder: 'What they will eat, what they will not, any bowl / spoon rules.',
  },
  {
    id: 'nappies',
    topic: 'routine',
    title: 'Nappies & toilet',
    label: 'Nappies / toilet',
    placeholder: 'Full-time, nights only, potty training, where the spare clothes are.',
  },
  {
    id: 'nursery',
    topic: 'out-of-the-house',
    title: 'Nursery / preschool',
    label: 'Nursery',
    placeholder: 'Drop-off, pick-up, who may collect them, bag contents.',
  },
  {
    id: 'sleep',
    topic: 'sleep',
    title: 'Sleep',
    label: 'Sleep',
    placeholder: 'Nap, bedtime ritual, night waking, which tog.',
  },
  {
    id: 'screens',
    topic: 'house-rules',
    title: 'Screens',
    label: 'Screens',
    placeholder: 'Allowed or not, which apps, cut-off time.',
  },
  {
    id: 'comfort',
    topic: 'comfort',
    title: 'Likes & comfort',
    label: 'Likes & comfort',
    placeholder: 'Favourite toys, games, people — what makes a good day.',
  },
  {
    id: 'upset',
    topic: 'comfort',
    title: 'If they are upset',
    label: 'If upset',
    placeholder: 'Practical steps when it goes wrong — not the same as what they like.',
  },
  {
    id: 'out',
    topic: 'out-of-the-house',
    title: 'Out of the house',
    label: 'Out & about',
    placeholder: 'Park rules, scooter, who they may go with, roads to avoid.',
  },
];

const SCHOOL: readonly ChildPrompt[] = [
  {
    id: 'school',
    topic: 'out-of-the-house',
    title: 'School',
    label: 'School',
    placeholder: 'Drop-off, pick-up, after-school, who may collect them, bag / kit.',
  },
  {
    id: 'food',
    topic: 'meals',
    title: 'Food',
    label: 'Food',
    placeholder: 'Packed lunch rules, snacks, anything they will refuse.',
  },
  {
    id: 'activities',
    topic: 'routine',
    title: 'Activities',
    label: 'Activities',
    placeholder: 'Clubs, homework expectations, friends they may play with.',
  },
  {
    id: 'screens',
    topic: 'house-rules',
    title: 'Screens',
    label: 'Screens',
    placeholder: 'Allowed devices, time limits, cut-off before bed.',
  },
  {
    id: 'sleep',
    topic: 'sleep',
    title: 'Bedtime',
    label: 'Bedtime',
    placeholder: 'Lights out, reading, what helps if they are still awake.',
  },
  {
    id: 'comfort',
    topic: 'comfort',
    title: 'Likes & comfort',
    label: 'Likes & comfort',
    placeholder: 'What they care about this week — sport, friends, a particular book.',
  },
  {
    id: 'upset',
    topic: 'comfort',
    title: 'If they are upset',
    label: 'If upset',
    placeholder: 'How they like to talk it through — or not. What not to do.',
  },
  {
    id: 'out',
    topic: 'out-of-the-house',
    title: 'Independence',
    label: 'Out & about',
    placeholder: 'How far they may go alone, roads, park, phone rules.',
  },
];

const UNKNOWN: readonly ChildPrompt[] = [
  ...PRESCHOOL.slice(0, 4),
  PRESCHOOL.find((p) => p.id === 'comfort')!,
  PRESCHOOL.find((p) => p.id === 'upset')!,
];

export function promptsForChild(descriptor: string): readonly ChildPrompt[] {
  switch (childAgeBand(descriptor)) {
    case 'baby':
      return BABY;
    case 'preschool':
      return PRESCHOOL;
    case 'school':
      return SCHOOL;
    default:
      return UNKNOWN;
  }
}

/** Topics offered first when editing a child — Held's order of mind, not a cleaner's. */
export const CHILD_TOPIC_ORDER: readonly EntryTopic[] = [
  'meals',
  'sleep',
  'routine',
  'comfort',
  'clothing',
  'out-of-the-house',
  'health',
  'house-rules',
  'other',
  'access',
  'cleaning',
];

export function topicsForKind(kind: 'child' | 'pet' | 'place'): readonly EntryTopic[] {
  if (kind === 'child') return CHILD_TOPIC_ORDER;
  if (kind === 'pet') {
    return ['routine', 'meals', 'health', 'out-of-the-house', 'comfort', 'other', 'access', 'house-rules'];
  }
  return ['cleaning', 'access', 'house-rules', 'other', 'routine', 'meals'];
}
