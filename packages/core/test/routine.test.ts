import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILT_IN_PRESETS,
  instantiatePreset,
  presetFromRoutine,
  presetsFor,
  routineFor,
} from '../src/routine.ts';
import { ROUTINE_KINDS, ROUTINE_KINDS_FOR, type RoutineItem } from '../src/household.ts';

test('a subject is only offered presets meant for its kind', () => {
  assert.deepEqual(
    presetsFor('pet').map((p) => p.label),
    ['Dog', 'Cat', 'Small animal'],
  );
  assert.ok(presetsFor('place').every((p) => p.appliesToKind === 'place'));
  assert.ok(!presetsFor('child').some((p) => p.label === 'Dog'));
});

test('every preset only uses kinds offered for its own subject kind', () => {
  // A "Bins" item on a baby preset would put an option in front of the parent that
  // the picker for that subject does not even contain.
  for (const preset of BUILT_IN_PRESETS) {
    const allowed = ROUTINE_KINDS_FOR[preset.appliesToKind];
    for (const item of preset.items) {
      assert.ok(
        allowed.includes(item.kind),
        `${preset.label} uses "${item.kind}", which is not offered for a ${preset.appliesToKind}`,
      );
    }
  }
});

test('every routine kind a preset uses actually exists', () => {
  for (const preset of BUILT_IN_PRESETS) {
    for (const item of preset.items) {
      assert.ok(ROUTINE_KINDS.includes(item.kind), `unknown kind: ${item.kind}`);
    }
  }
});

test('applying a preset binds it to one subject and nothing else', () => {
  const dog = BUILT_IN_PRESETS.find((p) => p.label === 'Dog')!;
  let n = 0;
  const items = instantiatePreset(dog, 'sub_rio', () => `r${(n += 1)}`);

  assert.equal(items.length, dog.items.length);
  assert.ok(items.every((i) => i.appliesTo === 'sub_rio'));
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  assert.equal(items[0]?.notes, 'Short one.');
});

test('a preset saved from one subject carries to another without dragging them along', () => {
  const routine: RoutineItem[] = [
    { id: 'a', time: '07:30', kind: 'Walk', appliesTo: 'sub_rio', notes: 'Short one.' },
    { id: 'b', time: '08:00', kind: 'Feed', appliesTo: 'sub_rio', notes: '' },
    { id: 'c', time: '12:30', kind: 'Lunch', appliesTo: 'sub_lea', notes: 'Not this one.' },
  ];

  const preset = presetFromRoutine('Our dogs', 'pet', routine, 'sub_rio', 'preset:mine');

  assert.equal(preset.items.length, 2);
  assert.ok(preset.custom);
  // The other subject's item is not swept in.
  assert.ok(!preset.items.some((i) => i.notes === 'Not this one.'));
  // Nothing in a preset points at the subject it came from.
  assert.ok(!JSON.stringify(preset).includes('sub_rio'));

  const applied = instantiatePreset(preset, 'sub_pepper', () => 'x');
  assert.ok(applied.every((i) => i.appliesTo === 'sub_pepper'));
  assert.equal(applied[0]?.notes, 'Short one.');
});

test('a custom preset is offered alongside the built-in ones for its kind', () => {
  const mine = presetFromRoutine('Our dogs', 'pet', [], 'sub_rio', 'preset:mine');
  const offered = presetsFor('pet', [mine]);
  assert.ok(offered.some((p) => p.id === 'preset:mine'));
  assert.ok(!presetsFor('child', [mine]).some((p) => p.id === 'preset:mine'));
});

test('routineFor selects one subject’s items', () => {
  const routine: RoutineItem[] = [
    { id: 'a', time: '08:00', kind: 'Feed', appliesTo: 'sub_rio', notes: '' },
    { id: 'b', time: '08:00', kind: 'Breakfast', appliesTo: 'all', notes: '' },
  ];
  assert.deepEqual(
    routineFor(routine, 'sub_rio').map((i) => i.id),
    ['a'],
  );
});
