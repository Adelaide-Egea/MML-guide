import test from 'node:test';
import assert from 'node:assert/strict';

import { guideCoverage } from '../src/guide.ts';
import { child, handover, household, routineItem } from './fixtures.ts';
import { EMPTY_SAFETY } from '../src/subject.ts';

test('guideCoverage reports bedtime and contact gaps', () => {
  const lea = child({
    name: 'Léa',
    safety: { ...EMPTY_SAFETY },
  });
  const home = household({
    subjects: [lea],
    contacts: [],
    country: '',
    routine: [],
  });
  const coverage = guideCoverage(home, handover({ subjectIds: [lea.id] }));

  assert.ok(coverage.total > 0);
  assert.ok(coverage.gaps.includes('No emergency number'));
  assert.ok(coverage.gaps.includes('Country blank'));
  assert.ok(coverage.gaps.includes('Bedtime blank'));
  assert.ok(coverage.gaps.includes('Léa: allergies blank'));
});

test('guideCoverage counts a filled bedtime as covered', () => {
  const lea = child({
    name: 'Léa',
    safety: {
      ...EMPTY_SAFETY,
      allergies: 'Kiwi',
      emergencyNotes: 'Call Claire',
    },
  });
  const home = household({
    subjects: [lea],
    contacts: [{ id: 'c1', name: 'Claire', phone: '01', relationship: 'Mum' }],
    country: 'France',
    routine: [routineItem({ kind: 'Bedtime', appliesTo: lea.id, time: '19:15', notes: '' })],
  });
  const coverage = guideCoverage(
    home,
    handover({ subjectIds: [lea.id], caregiverName: 'Margaret' }),
  );

  assert.equal(coverage.gaps.length, 0);
  assert.equal(coverage.covered, coverage.total);
});
