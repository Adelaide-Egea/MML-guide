import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UnsafeGuideError,
  applyEnrichments,
  assertSafeToRender,
  buildGuide,
  buildVerifiedGuide,
  criticalBlocks,
  scopeRoutine,
} from '../src/guide.ts';
import { allergyText, isBlocked, validateHousehold } from '../src/household.ts';
import { child, handover, household, routineItem } from './fixtures.ts';

const withPeanuts = child({ safety: { allergies: 'Peanuts', medication: '', medicalNotes: '' } });

// ── The fault that motivated this package ────────────────────────────────────
//
// In the prototype, a parent typed "Peanuts", the guide displayed "Peanuts", and
// the model was told "Allergies: None noted". These tests make the equivalent
// failure impossible to ship rather than merely unlikely.

test('a recorded allergy always reaches the guide verbatim', () => {
  const doc = buildVerifiedGuide(household({ children: [withPeanuts] }), handover());
  const block = doc.blocks.find((b) => b.id === 'allergy:c1');

  assert.ok(block, 'the allergy block is missing');
  assert.equal(block.body, 'Peanuts');
  assert.equal(block.source, 'facts');
  assert.equal(block.critical, true);
});

test('a model cannot rewrite a safety-critical block', () => {
  const doc = buildGuide(household({ children: [withPeanuts] }), handover());
  const { document, rejected } = applyEnrichments(doc, [
    { blockId: 'allergy:c1', body: 'Mia has some food sensitivities.' },
  ]);

  assert.deepEqual(rejected, ['allergy:c1']);
  assert.equal(document.blocks.find((b) => b.id === 'allergy:c1')?.body, 'Peanuts');
});

test('a model may improve non-critical prose', () => {
  const base = buildGuide(
    household({ children: [child({ likes: 'rabbit, drawing' })] }),
    handover(),
  );
  const { document, rejected } = applyEnrichments(base, [
    { blockId: 'comfort:c1', body: 'Mia loves drawing, and her rabbit should stay within reach.' },
  ]);

  assert.deepEqual(rejected, []);
  const block = document.blocks.find((b) => b.id === 'comfort:c1');
  assert.equal(block?.source, 'model');
  assert.match(block?.body ?? '', /rabbit should stay within reach/);
});

test('rendering refuses a guide whose critical text came from a model', () => {
  const home = household({ children: [withPeanuts] });
  const doc = buildGuide(home, handover());

  // Simulates a future caller bypassing applyEnrichments and mutating a block.
  const tampered = {
    ...doc,
    blocks: doc.blocks.map((b) =>
      b.id === 'allergy:c1' ? { ...b, body: 'Some sensitivities', source: 'model' as const } : b,
    ),
  };

  assert.throws(() => assertSafeToRender(tampered, home), UnsafeGuideError);
});

test('rendering refuses a guide that dropped a recorded allergy', () => {
  const home = household({ children: [withPeanuts] });
  const doc = buildGuide(home, handover());
  const stripped = { ...doc, blocks: doc.blocks.filter((b) => b.id !== 'allergy:c1') };

  assert.throws(() => assertSafeToRender(stripped, home), {
    name: 'UnsafeGuideError',
    message: /omits them/,
  });
});

test('every child with an allergy gets their own block', () => {
  const home = household({
    children: [
      withPeanuts,
      child({ id: 'c2', name: 'Theo', safety: { allergies: 'Dairy', medication: '', medicalNotes: '' } }),
    ],
  });
  const doc = buildVerifiedGuide(home, handover());

  assert.equal(allergyText(home.children[1]), 'Dairy');
  assert.ok(doc.blocks.some((b) => b.id === 'allergy:c1' && b.body === 'Peanuts'));
  assert.ok(doc.blocks.some((b) => b.id === 'allergy:c2' && b.body === 'Dairy'));
});

// ── Ordering and scoping ─────────────────────────────────────────────────────

test('critical blocks come first, so a ten-second skim hits them', () => {
  const home = household({ children: [child({ ...withPeanuts, likes: 'rabbit' })] });
  const doc = buildVerifiedGuide(home, handover({ importantNotes: ['Stairgate always closed.'] }));

  const firstNonCritical = doc.blocks.findIndex((b) => !b.critical);
  const lastCritical = doc.blocks.map((b) => b.critical).lastIndexOf(true);
  assert.ok(lastCritical < firstNonCritical, 'a non-critical block appears before a critical one');
  assert.equal(criticalBlocks(doc).length, 3); // important note, allergy, contacts
});

test('an evening handover hides the parts of the day it does not cover', () => {
  const routine = [
    routineItem({ id: 'r1', time: '08:00', kind: 'School' }),
    routineItem({ id: 'r2', time: '17:30', kind: 'Dinner' }),
    routineItem({ id: 'r3', time: '19:00', kind: 'Bedtime' }),
  ];

  const evening = scopeRoutine(routine, 'evening').map((r) => r.id);
  assert.deepEqual(evening, ['r2', 'r3']);

  const fullDay = scopeRoutine(routine, 'fullday').map((r) => r.id);
  assert.deepEqual(fullDay, ['r1', 'r2', 'r3']);
});

test('untimed routine items sort to the bottom rather than the top', () => {
  const routine = [
    routineItem({ id: 'r1', time: null, kind: 'Other' }),
    routineItem({ id: 'r2', time: '08:00', kind: 'Breakfast' }),
  ];
  assert.deepEqual(scopeRoutine(routine, 'fullday').map((r) => r.id), ['r2', 'r1']);
});

test('contacts without a phone number are left out of the call list', () => {
  const home = household({
    contacts: [
      { id: 'p1', name: 'Mum', phone: '07700 900000', relationship: 'Mother' },
      { id: 'p2', name: 'Dad', phone: '', relationship: 'Father' },
    ],
  });
  const block = buildVerifiedGuide(home, handover()).blocks.find((b) => b.id === 'contacts');

  assert.match(block?.body ?? '', /Mum/);
  assert.doesNotMatch(block?.body ?? '', /Dad/);
});

// ── Determinism ──────────────────────────────────────────────────────────────

test('the guide is complete with no model involved at all', () => {
  const home = household({
    children: [child({ ...withPeanuts, likes: 'rabbit', whenUpset: 'Offer the rabbit.' })],
    routine: [routineItem()],
  });
  const doc = buildVerifiedGuide(home, handover({ importantNotes: ['Stairgate closed.'] }));

  assert.ok(doc.blocks.length >= 5);
  assert.ok(doc.blocks.every((b) => b.source === 'facts'));
  assert.equal(doc.routine.length, 1);
});

test('the same inputs always produce the same document', () => {
  const home = household({ children: [withPeanuts] });
  const at = new Date('2026-09-07T18:00:00Z');

  assert.deepEqual(
    buildGuide(home, handover(), at),
    buildGuide(home, handover(), at),
  );
});

// ── Validation ───────────────────────────────────────────────────────────────

test('a household with no children cannot produce a guide', () => {
  const issues = validateHousehold(household({ children: [] }));
  assert.equal(isBlocked(issues), true);
});

test('a missing phone number warns but does not block', () => {
  const issues = validateHousehold(
    household({ contacts: [{ id: 'p1', name: 'Mum', phone: '', relationship: 'Mother' }] }),
  );
  assert.equal(isBlocked(issues), false);
  assert.equal(issues.length, 1);
});

test('a routine item pointing at a child who left the household blocks', () => {
  const issues = validateHousehold(
    household({ routine: [routineItem({ appliesTo: 'c-does-not-exist' })] }),
  );
  assert.equal(isBlocked(issues), true);
});

test('a malformed time blocks', () => {
  assert.equal(isBlocked(validateHousehold(household({ routine: [routineItem({ time: '25:00' })] }))), true);
  assert.equal(isBlocked(validateHousehold(household({ routine: [routineItem({ time: '07:30' })] }))), false);
});
