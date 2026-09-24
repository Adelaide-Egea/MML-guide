import assert from 'node:assert/strict';
import { test } from 'node:test';
import { telHref } from './tel.ts';

test('telHref strips spaces and keeps a leading plus', () => {
  assert.equal(telHref('+33 6 12 34 56 78'), 'tel:+33612345678');
  assert.equal(telHref('07950 729533'), 'tel:07950729533');
  assert.equal(telHref('15'), 'tel:15');
  assert.equal(telHref('112'), 'tel:112');
});
