import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromeFor, localizeGuideHeading } from '../src/chrome.ts';

test('chromeFor returns French UI chrome for fr', () => {
  const chrome = chromeFor('fr');
  assert.equal(chrome.askAboutAnything, 'Poser une question');
  assert.equal(chrome.readFirst, 'À lire d’abord');
  assert.equal(chrome.everyone, 'Tout le monde');
  assert.equal(chrome.aTypicalDay, 'Une journée type');
  assert.equal(chrome.iHaveReadThis, 'J’ai lu ceci');
  assert.equal(chrome.whoToCall, 'Qui appeler');
  assert.equal(chrome.routineKinds.Snack, 'Goûter');
  assert.equal(chrome.routineKinds.Other, 'Autre');
  assert.equal(chrome.routineKinds.Dinner, 'Dîner');
  assert.equal(chrome.routineKinds.Bath, 'Bain');
  assert.equal(chrome.routineKinds.Bedtime, 'Coucher');
  assert.equal(chrome.medication, 'médicaments');
  assert.equal(chrome.inAnEmergency, 'en cas d’urgence');
  assert.equal(chrome.printOrSavePdf, 'Imprimer ou enregistrer en PDF');
  assert.equal(chrome.entryTitles.Screens, 'Écrans');
  assert.equal(chrome.entryTitles.Potty, 'Pot');
});

test('localizeGuideHeading remaps known English titles for French', () => {
  const chrome = chromeFor('fr');
  assert.equal(localizeGuideHeading('Screens', chrome), 'Écrans');
  assert.equal(localizeGuideHeading('Potty', chrome), 'Pot');
  assert.equal(localizeGuideHeading('Elise — Screens', chrome), 'Elise — Écrans');
  assert.equal(localizeGuideHeading('Quiet time', chrome), 'Quiet time');
  assert.equal(localizeGuideHeading('Who to call', chrome), 'Qui appeler');
});

test('chromeFor falls back to English for unknown tags', () => {
  const chrome = chromeFor('zz-ZZ');
  assert.equal(chrome.askAboutAnything, 'Ask about anything');
  assert.equal(chrome.everyone, 'Everyone');
  assert.equal(chrome.whoToCall, 'Who to call');
  assert.equal(chrome.routineKinds.Snack, 'Snack');
  assert.equal(chrome.printOrSavePdf, 'Print or save as PDF');
});
