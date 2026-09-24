import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeRoutineRows, type RoutineItem } from '../src/household.ts';

function item(partial: Partial<RoutineItem> & Pick<RoutineItem, 'id' | 'kind' | 'appliesTo'>): RoutineItem {
  const base: RoutineItem = {
    id: partial.id,
    time: partial.time ?? null,
    kind: partial.kind,
    appliesTo: partial.appliesTo,
    notes: partial.notes ?? '',
  };
  return {
    ...base,
    ...(partial.label !== undefined ? { label: partial.label } : {}),
    ...(partial.section !== undefined ? { section: partial.section } : {}),
    ...(partial.priority !== undefined ? { priority: partial.priority } : {}),
    ...(partial.product !== undefined ? { product: partial.product } : {}),
  };
}

test('identical snacks for two children merge into one row with both ids', () => {
  const rows = mergeRoutineRows([
    item({ id: 'a', time: '10:00', kind: 'Snack', appliesTo: 'elise' }),
    item({ id: 'b', time: '10:00', kind: 'Snack', appliesTo: 'charlotte' }),
  ]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0]!.appliesToIds, ['elise', 'charlotte']);
  assert.equal(rows[0]!.item.time, '10:00');
  assert.equal(rows[0]!.item.kind, 'Snack');
});

test('different notes keep separate rows even at the same time', () => {
  const rows = mergeRoutineRows([
    item({ id: 'a', time: '10:00', kind: 'Snack', appliesTo: 'elise', notes: 'Fruit' }),
    item({ id: 'b', time: '10:00', kind: 'Snack', appliesTo: 'charlotte', notes: 'Yoghurt' }),
  ]);
  assert.equal(rows.length, 2);
});

test('different bedtimes stay separate', () => {
  const rows = mergeRoutineRows([
    item({ id: 'a', time: '19:00', kind: 'Bedtime', appliesTo: 'elise' }),
    item({ id: 'b', time: '19:30', kind: 'Bedtime', appliesTo: 'charlotte' }),
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0]!.appliesToIds, ['elise']);
  assert.deepEqual(rows[1]!.appliesToIds, ['charlotte']);
});

test('appliesTo all collapses sibling-specific duplicates', () => {
  const rows = mergeRoutineRows([
    item({ id: 'a', time: '08:00', kind: 'Breakfast', appliesTo: 'elise' }),
    item({ id: 'b', time: '08:00', kind: 'Breakfast', appliesTo: 'all' }),
  ]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0]!.appliesToIds, ['all']);
});

test('custom Other labels only merge when the label matches', () => {
  const rows = mergeRoutineRows([
    item({ id: 'a', time: '13:15', kind: 'Other', appliesTo: 'elise', label: 'Quiet time' }),
    item({
      id: 'b',
      time: '13:15',
      kind: 'Other',
      appliesTo: 'charlotte',
      label: 'Quiet time',
    }),
    item({ id: 'c', time: '13:15', kind: 'Other', appliesTo: 'elise', label: 'Story' }),
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0]!.appliesToIds, ['elise', 'charlotte']);
  assert.equal(rows[0]!.item.label, 'Quiet time');
  assert.deepEqual(rows[1]!.appliesToIds, ['elise']);
});
