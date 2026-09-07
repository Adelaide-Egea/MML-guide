import type { Contact, Handover, Household, RoutineItem } from '../src/household.ts';
import { type CareSubject, EMPTY_SAFETY, type Entry, type Media } from '../src/subject.ts';

export function media(overrides: Partial<Media> & Pick<Media, 'id'>): Media {
  return {
    kind: 'photo',
    key: `k/${overrides.id}`,
    caption: 'A photo',
    durationSeconds: null,
    ...overrides,
  };
}

export function entry(overrides: Partial<Entry> & Pick<Entry, 'id'>): Entry {
  return {
    topic: 'other',
    title: 'Something to know',
    body: 'A note.',
    media: [],
    writtenAt: '2026-10-12T09:00:00.000Z',
    writtenBy: 'Claire',
    language: 'en-GB',
    ...overrides,
  };
}

export function child(overrides: Partial<CareSubject> = {}): CareSubject {
  return {
    id: 'c1',
    kind: 'child',
    name: 'Mia',
    descriptor: '4 years',
    identity: { colourToken: 'id-teal', symbol: 'rabbit' },
    safety: EMPTY_SAFETY,
    entries: [],
    ...overrides,
  };
}

export function pet(overrides: Partial<CareSubject> = {}): CareSubject {
  return child({
    id: 'p1',
    kind: 'pet',
    name: 'Rio',
    descriptor: 'Labrador, 7',
    identity: { colourToken: 'id-clay', symbol: 'paw' },
    ...overrides,
  });
}

export function place(overrides: Partial<CareSubject> = {}): CareSubject {
  return child({
    id: 'h-flat',
    kind: 'place',
    name: 'The flat',
    descriptor: 'Third floor',
    identity: { colourToken: 'id-moss', symbol: 'door' },
    ...overrides,
  });
}

export function routineItem(overrides: Partial<RoutineItem> = {}): RoutineItem {
  return { id: 'r1', time: '17:30', kind: 'Dinner', appliesTo: 'all', notes: '', ...overrides };
}

const MUM: Contact = { id: 'p1', name: 'Mum', phone: '07700 900000', relationship: 'Mother' };

export function household(overrides: Partial<Household> = {}): Household {
  return {
    id: 'h1',
    name: 'The Family',
    country: 'United Kingdom',
    subjects: [child()],
    contacts: [MUM],
    routine: [],
    ...overrides,
  };
}

export function handover(overrides: Partial<Handover> = {}): Handover {
  return {
    id: 'ho1',
    householdId: 'h1',
    caregiverName: 'Claire',
    caregiverRelationship: 'Nanny',
    duration: 'fullday',
    language: 'en-GB',
    subjectIds: [],
    importantNotes: [],
    extra: '',
    signOff: 'The Family',
    ...overrides,
  };
}
