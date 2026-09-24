import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emergencyNumbersFor, matchEmergencyCountry } from '../src/emergencyNumbers.ts';
import { buildVerifiedGuide } from '../src/guide.ts';
import { child, handover, household } from './fixtures.ts';
import { EMPTY_SAFETY } from '../src/subject.ts';

test('matchEmergencyCountry accepts names and ISO aliases', () => {
  assert.equal(matchEmergencyCountry('France'), 'France');
  assert.equal(matchEmergencyCountry('FR'), 'France');
  assert.equal(matchEmergencyCountry('uk'), 'United Kingdom');
  assert.equal(matchEmergencyCountry('United Kingdom'), 'United Kingdom');
  assert.equal(matchEmergencyCountry(''), null);
  assert.equal(matchEmergencyCountry('Atlantis'), null);
});

test('French household gets SAMU / Police / Fire numbers', () => {
  const found = emergencyNumbersFor('FR', 'en');
  assert.ok(found);
  assert.equal(found.country, 'France');
  assert.match(found.numbers, /15 \(SAMU\)/);
  assert.match(found.numbers, /17 \(Police\)/);
  assert.match(found.numbers, /112/);
});

test('French language localises service words on UK numbers', () => {
  const found = emergencyNumbersFor('United Kingdom', 'fr');
  assert.ok(found);
  assert.match(found.numbers, /urgences/i);
  assert.match(found.numbers, /999/);
});

test('guide includes local emergency numbers as a critical block', () => {
  const home = household({
    country: 'France',
    subjects: [child({ safety: { ...EMPTY_SAFETY, allergies: 'Peanuts' } })],
  });
  const doc = buildVerifiedGuide(home, handover({ language: 'en' }));
  const block = doc.blocks.find((b) => b.id === 'local-emergency');
  assert.ok(block, 'local-emergency block missing');
  assert.equal(block.critical, true);
  assert.equal(block.source, 'facts');
  assert.equal(block.heading, 'Emergency (France)');
  assert.match(block.body, /15 \(SAMU\)/);
});

test('French guide localises the emergency heading', () => {
  const home = household({ country: 'FR' });
  const doc = buildVerifiedGuide(home, handover({ language: 'fr' }));
  const block = doc.blocks.find((b) => b.id === 'local-emergency');
  assert.equal(block?.heading, 'Urgences (France)');
});
