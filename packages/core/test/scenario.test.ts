import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_EXPECTATION,
  durationFromScenario,
  normalizeHandover,
  scenarioFromDuration,
} from '../src/household.ts';

test('scenario derives the legacy duration', () => {
  assert.equal(durationFromScenario('evening'), 'evening');
  assert.equal(durationFromScenario('fullday'), 'fullday');
  assert.equal(durationFromScenario('weekend'), 'fewdays');
  assert.equal(durationFromScenario('cleaner'), 'fullday');
  assert.equal(durationFromScenario('petsitter'), 'fullday');
  assert.equal(durationFromScenario('goingtoyours'), 'fewdays');
});

test('old duration-only handovers lift to a scenario', () => {
  assert.equal(scenarioFromDuration('evening'), 'evening');
  assert.equal(scenarioFromDuration('fullday'), 'fullday');
  assert.equal(scenarioFromDuration('fewdays'), 'weekend');

  const lifted = normalizeHandover({
    id: 'ho1',
    householdId: 'h1',
    caregiverName: 'Margaret',
    caregiverRelationship: 'Grandparent',
    duration: 'fewdays',
    language: 'en',
    subjectIds: [],
    importantNotes: [],
    extra: '',
    signOff: '',
  });

  assert.equal(lifted.scenario, 'weekend');
  assert.equal(lifted.duration, 'fewdays');
  assert.equal(lifted.expectation, DEFAULT_EXPECTATION.weekend);
});

test('an explicit scenario wins over a conflicting duration', () => {
  const next = normalizeHandover({
    id: 'ho1',
    householdId: 'h1',
    scenario: 'cleaner',
    duration: 'evening',
    caregiverName: '',
    caregiverRelationship: '',
    language: 'en',
    subjectIds: [],
    importantNotes: [],
    extra: '',
    signOff: '',
  });

  assert.equal(next.scenario, 'cleaner');
  assert.equal(next.duration, 'fullday');
  assert.equal(next.expectation, DEFAULT_EXPECTATION.cleaner);
});
