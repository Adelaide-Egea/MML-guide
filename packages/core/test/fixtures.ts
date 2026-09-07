import type { Child, Handover, Household, RoutineItem } from '../src/household.ts';

export function child(overrides: Partial<Child> = {}): Child {
  return {
    id: 'c1',
    name: 'Mia',
    age: { value: 4, unit: 'years' },
    identity: { colourToken: 'child-1', symbol: 'rabbit' },
    safety: { allergies: '', medication: '', medicalNotes: '' },
    food: '',
    milk: '',
    nappies: '',
    school: '',
    screenTime: '',
    likes: '',
    whenUpset: '',
    ...overrides,
  };
}

export function routineItem(overrides: Partial<RoutineItem> = {}): RoutineItem {
  return { id: 'r1', time: '17:30', kind: 'Dinner', appliesTo: 'all', notes: '', ...overrides };
}

export function household(overrides: Partial<Household> = {}): Household {
  return {
    id: 'h1',
    name: 'The Family',
    country: 'United Kingdom',
    children: [child()],
    contacts: [{ id: 'p1', name: 'Mum', phone: '07700 900000', relationship: 'Mother' }],
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
    importantNotes: [],
    extra: '',
    signOff: 'The Family',
    ...overrides,
  };
}
