import test from 'node:test';
import assert from 'node:assert/strict';

import { speechLangFor } from './speech.ts';

test('speechLangFor maps care tags to recognizer locales', () => {
  assert.equal(speechLangFor('en'), 'en-GB');
  assert.equal(speechLangFor('fr-FR'), 'fr-FR');
  assert.equal(speechLangFor('pt-BR'), 'pt-BR');
  assert.equal(speechLangFor('es'), 'es-ES');
  assert.equal(speechLangFor('tl'), 'fil-PH');
});
