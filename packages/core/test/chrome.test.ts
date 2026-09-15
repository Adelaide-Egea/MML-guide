import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromeFor } from '../src/chrome.ts';

test('chromeFor returns French UI chrome for fr', () => {
  const chrome = chromeFor('fr');
  assert.equal(chrome.askAboutAnything, 'Poser une question');
  assert.equal(chrome.readFirst, 'À lire d’abord');
  assert.equal(chrome.everyone, 'Tout le monde');
  assert.equal(chrome.aTypicalDay, 'Une journée type');
  assert.equal(chrome.iHaveReadThis, 'J’ai lu ceci');
});

test('chromeFor falls back to English for unknown tags', () => {
  const chrome = chromeFor('zz-ZZ');
  assert.equal(chrome.askAboutAnything, 'Ask about anything');
  assert.equal(chrome.everyone, 'Everyone');
});
