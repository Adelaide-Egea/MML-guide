import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UnsafeGuideError,
  applyEnrichments,
  assertSafeToRender,
  buildGuide,
  buildVerifiedGuide,
  criticalBlocks,
  guideMedia,
  scopeRoutine,
} from '../src/guide.ts';
import { validateHousehold } from '../src/household.ts';
import { EMPTY_SAFETY, allergyText, isBlocked } from '../src/subject.ts';
import { child, entry, handover, household, media, pet, place, routineItem } from './fixtures.ts';

const withPeanuts = child({ safety: { ...EMPTY_SAFETY, allergies: 'Peanuts' } });

// ── The fault that motivated this package ────────────────────────────────────
//
// In the prototype, a parent typed "Peanuts", the guide displayed "Peanuts", and
// the model was told "Allergies: None noted". These tests make the equivalent
// failure impossible to ship rather than merely unlikely.

test('a recorded allergy always reaches the guide verbatim', () => {
  const doc = buildVerifiedGuide(household({ subjects: [withPeanuts] }), handover());
  const block = doc.blocks.find((b) => b.id === 'allergy:c1');

  assert.ok(block, 'the allergy block is missing');
  assert.equal(block.body, 'Peanuts');
  assert.equal(block.source, 'facts');
  assert.equal(block.critical, true);
});

test('a model cannot rewrite a safety-critical block', () => {
  const doc = buildGuide(household({ subjects: [withPeanuts] }), handover());
  const { document, rejected } = applyEnrichments(doc, [
    { blockId: 'allergy:c1', body: 'Mia has some food sensitivities.' },
  ]);

  assert.deepEqual(rejected, ['allergy:c1']);
  assert.equal(document.blocks.find((b) => b.id === 'allergy:c1')?.body, 'Peanuts');
});

test('a model may improve non-critical prose', () => {
  const base = buildGuide(
    household({
      subjects: [child({ entries: [entry({ id: 'e1', title: 'Comfort', body: 'rabbit, drawing' })] })],
    }),
    handover(),
  );
  const { document, rejected } = applyEnrichments(base, [
    { blockId: 'entry:e1', body: 'Mia loves drawing, and her rabbit should stay within reach.' },
  ]);

  assert.deepEqual(rejected, []);
  const block = document.blocks.find((b) => b.id === 'entry:e1');
  assert.equal(block?.source, 'model');
  assert.match(block?.body ?? '', /rabbit should stay within reach/);
});

test('rendering refuses a guide whose critical text came from a model', () => {
  const home = household({ subjects: [withPeanuts] });
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
  const home = household({ subjects: [withPeanuts] });
  const doc = buildGuide(home, handover());
  const stripped = { ...doc, blocks: doc.blocks.filter((b) => b.id !== 'allergy:c1') };

  assert.throws(() => assertSafeToRender(stripped, home), {
    name: 'UnsafeGuideError',
    message: /omits it/,
  });
});

test('every subject with an allergy gets their own block', () => {
  const home = household({
    subjects: [
      withPeanuts,
      child({ id: 'c2', name: 'Theo', safety: { ...EMPTY_SAFETY, allergies: 'Dairy' } }),
    ],
  });
  const doc = buildVerifiedGuide(home, handover());

  assert.equal(allergyText(home.subjects[1]), 'Dairy');
  assert.ok(doc.blocks.some((b) => b.id === 'allergy:c1' && b.body === 'Peanuts'));
  assert.ok(doc.blocks.some((b) => b.id === 'allergy:c2' && b.body === 'Dairy'));
});

// ── Any handover, not only a child ───────────────────────────────────────────

test('a pet and a place produce a guide the same way a child does', () => {
  const home = household({
    subjects: [
      pet({
        safety: { ...EMPTY_SAFETY, emergencyNotes: 'Vet: Dr Meunier, 01 44 55 66 77.' },
        entries: [entry({ id: 'e-food', topic: 'meals', title: 'Meals', body: '08:00 and 18:00.' })],
      }),
      place({
        entries: [entry({ id: 'e-bins', topic: 'house-rules', title: 'Bins', body: 'Out on Tuesday.' })],
      }),
    ],
  });
  const doc = buildVerifiedGuide(home, handover());

  assert.ok(doc.blocks.some((b) => b.id === 'emergency:p1'), 'the vet is safety-critical');
  assert.ok(doc.blocks.some((b) => b.id === 'entry:e-food'));
  assert.ok(doc.blocks.some((b) => b.id === 'entry:e-bins'));
});

test('a caregiver only sees the subjects they are responsible for', () => {
  const home = household({ subjects: [withPeanuts, place()] });
  const cleaner = handover({ caregiverName: 'Maria', subjectIds: ['h-flat'] });
  const doc = buildVerifiedGuide(home, cleaner);

  // Scoping is a privacy boundary: someone coming to clean has no business reading
  // a child's allergies, and the verifier must not demand that they do.
  assert.equal(doc.blocks.some((b) => b.id === 'allergy:c1'), false);
  assert.equal(doc.blocks.some((b) => b.subjectId === 'c1'), false);
});

test('photos and video travel with the block they belong to', () => {
  const home = household({
    subjects: [
      child({
        entries: [
          entry({
            id: 'e-beds',
            title: 'How I make the beds',
            media: [media({ id: 'm1', kind: 'video', caption: 'Making the bed', durationSeconds: 47 })],
          }),
        ],
      }),
    ],
  });
  const doc = buildVerifiedGuide(home, handover());

  assert.equal(doc.blocks.find((b) => b.id === 'entry:e-beds')?.media[0]?.id, 'm1');
  assert.equal(guideMedia(doc).length, 1);
});

// ── Ordering and scoping ─────────────────────────────────────────────────────

test('critical blocks come first, so a ten-second skim hits them', () => {
  const home = household({
    subjects: [child({ ...withPeanuts, entries: [entry({ id: 'e1', body: 'rabbit' })] })],
  });
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

  assert.deepEqual(scopeRoutine(routine, 'evening').map((r) => r.id), ['r2', 'r3']);
  assert.deepEqual(scopeRoutine(routine, 'fullday').map((r) => r.id), ['r1', 'r2', 'r3']);
});

test('the routine is filtered to the subjects in scope', () => {
  const routine = [
    routineItem({ id: 'r1', appliesTo: 'c1' }),
    routineItem({ id: 'r2', appliesTo: 'h-flat' }),
    routineItem({ id: 'r3', appliesTo: 'all' }),
  ];
  const scoped = scopeRoutine(routine, 'fullday', [place()]).map((r) => r.id);
  assert.deepEqual(scoped.sort(), ['r2', 'r3']);
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
    subjects: [
      child({
        ...withPeanuts,
        entries: [
          entry({ id: 'e1', title: 'Comfort', body: 'rabbit' }),
          entry({ id: 'e2', title: 'If upset', body: 'Offer the rabbit.' }),
        ],
      }),
    ],
    routine: [routineItem()],
  });
  const doc = buildVerifiedGuide(home, handover({ importantNotes: ['Stairgate closed.'] }));

  assert.ok(doc.blocks.length >= 5);
  assert.ok(doc.blocks.every((b) => b.source === 'facts'));
  assert.equal(doc.routine.length, 1);
});

test('the same inputs always produce the same document', () => {
  const home = household({ subjects: [withPeanuts] });
  const at = new Date('2026-09-07T18:00:00Z');

  assert.deepEqual(buildGuide(home, handover(), at), buildGuide(home, handover(), at));
});

// ── Validation ───────────────────────────────────────────────────────────────

test('a household with nobody to look after cannot produce a guide', () => {
  assert.equal(isBlocked(validateHousehold(household({ subjects: [] }))), true);
});

test('a missing phone number warns but does not block', () => {
  const issues = validateHousehold(
    household({ contacts: [{ id: 'p1', name: 'Mum', phone: '', relationship: 'Mother' }] }),
  );
  assert.equal(isBlocked(issues), false);
  assert.equal(issues.length, 1);
});

test('a routine item pointing at someone who left the household blocks', () => {
  assert.equal(
    isBlocked(validateHousehold(household({ routine: [routineItem({ appliesTo: 'gone' })] }))),
    true,
  );
});

test('a malformed time blocks', () => {
  assert.equal(isBlocked(validateHousehold(household({ routine: [routineItem({ time: '25:00' })] }))), true);
  assert.equal(isBlocked(validateHousehold(household({ routine: [routineItem({ time: '07:30' })] }))), false);
});

test('media without a caption warns, because it is invisible to the assistant', () => {
  const issues = validateHousehold(
    household({
      subjects: [child({ entries: [entry({ id: 'e1', media: [media({ id: 'm1', caption: '' })] })] })],
    }),
  );
  assert.equal(isBlocked(issues), false);
  assert.ok(issues.some((i) => /caption/.test(i.message)));
});
