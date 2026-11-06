import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Handover, Household } from '@mml/core';
import { sharePreview } from './share-preview.ts';

const household = {
  id: 'h1',
  name: 'Home',
  country: 'GB',
  contacts: [],
  routine: [],
  subjects: [
    { id: 'c1', kind: 'child', name: 'Elise', entries: [] },
    { id: 'p1', kind: 'pet', name: 'Pomme', entries: [] },
  ],
} as unknown as Household;

const base = {
  id: 'g1',
  householdId: 'h1',
  caregiverName: 'Marie',
  caregiverRelationship: '',
  scenario: 'evening',
  duration: 'evening',
  expectation: '',
  language: 'en',
  subjectIds: ['c1'],
  importantNotes: [],
  extra: '',
  signOff: '',
  tripId: null,
  entryRecaps: {},
} as unknown as Handover;

test('preview names the caregiver, the visit and who it covers', () => {
  assert.deepEqual(sharePreview(household, base), {
    title: 'For Marie · Evening sitter',
    description: 'Elise · Domela',
  });
});

test('different guides give different previews', () => {
  const pet = { ...base, caregiverName: 'Tom', scenario: 'petsitter', subjectIds: ['p1'] } as Handover;
  assert.deepEqual(sharePreview(household, pet), {
    title: 'For Tom · Pet sitter',
    description: 'Pomme · Domela',
  });
});

test('no caregiver name falls back to the visit type', () => {
  const blank = { ...base, caregiverName: '  ', subjectIds: [] } as Handover;
  assert.deepEqual(sharePreview(household, blank), {
    title: 'Evening sitter',
    description: 'Elise · Pomme · Domela',
  });
});

test('preview follows the caregiver language', () => {
  const fr = { ...base, language: 'fr' } as Handover;
  assert.ok(sharePreview(household, fr).title.startsWith('Pour Marie'));
});
