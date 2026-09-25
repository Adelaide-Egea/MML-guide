import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bulletRecap, recapLines, shouldOfferRecap } from '../src/recap.ts';
import { buildVerifiedGuide } from '../src/guide.ts';
import { child, entry, handover, household } from './fixtures.ts';

test('bulletRecap splits sentences into bullets', () => {
  const out = bulletRecap(
    'He eats every 3-4 hours. Usually 4-6oz. Put a wipe down before changing.',
  );
  assert.equal(
    out,
    [
      '• He eats every 3-4 hours.',
      '• Usually 4-6oz.',
      '• Put a wipe down before changing.',
    ].join('\n'),
  );
});

test('bulletRecap keeps existing bullet lines', () => {
  const out = bulletRecap('- First\n- Second');
  assert.equal(out, '• First\n• Second');
});

test('recapLines strips markers', () => {
  assert.deepEqual(recapLines('• One\n- Two'), ['One', 'Two']);
});

test('shouldOfferRecap skips short single lines', () => {
  assert.equal(shouldOfferRecap('8oz'), false);
  assert.equal(shouldOfferRecap('He eats every 3-4 hours. Usually 4-6oz at a feed.'), true);
});

test('approved entryRecaps attach to guide blocks without replacing the body', () => {
  const home = household({
    subjects: [
      child({
        entries: [
          entry({
            id: 'e_milk',
            title: 'Milk & bottles',
            body: 'He eats every 3-4 hours. Usually 4-6oz. Sometimes 8oz when very hungry.',
          }),
        ],
      }),
    ],
  });
  const doc = buildVerifiedGuide(
    home,
    handover({
      entryRecaps: {
        e_milk: '• Every 3–4 hours\n• Usually 4–6oz',
      },
    }),
  );
  const block = doc.blocks.find((b) => b.id === 'entry:e_milk');
  assert.ok(block);
  assert.match(block!.body, /Sometimes 8oz/);
  assert.equal(block!.recap, '• Every 3–4 hours\n• Usually 4–6oz');
});
