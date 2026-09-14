import test from 'node:test';
import assert from 'node:assert/strict';

import { childAgeBand, promptsForChild, topicsForKind } from '../src/childPrompts.ts';

test('age bands follow Held’s under-3 / 3–5 / 5+ split', () => {
  assert.equal(childAgeBand('18 months'), 'baby');
  assert.equal(childAgeBand('2 years'), 'baby');
  assert.equal(childAgeBand('3 years'), 'preschool');
  assert.equal(childAgeBand('3 ans'), 'preschool');
  assert.equal(childAgeBand('5 years'), 'school');
  assert.equal(childAgeBand(''), 'unknown');
});

test('baby prompts include milk and nappies; school prompts include school', () => {
  const baby = promptsForChild('1 year').map((p) => p.id);
  assert.ok(baby.includes('milk'));
  assert.ok(baby.includes('nappies'));
  assert.ok(!baby.includes('school'));

  const school = promptsForChild('8 years').map((p) => p.id);
  assert.ok(school.includes('school'));
  assert.ok(school.includes('screens'));
  assert.ok(!school.includes('milk'));
});

test('likes and if-upset stay separate prompts — Held’s split', () => {
  for (const age of ['1 year', '3 years', '7 years']) {
    const ids = promptsForChild(age).map((p) => p.id);
    assert.ok(ids.includes('comfort'), age);
    assert.ok(ids.includes('upset'), age);
  }
});

test('child topics lead with care, not cleaning', () => {
  const topics = topicsForKind('child');
  assert.ok(topics.indexOf('meals') < topics.indexOf('cleaning'));
  assert.ok(topics.indexOf('comfort') < topics.indexOf('access'));
});
