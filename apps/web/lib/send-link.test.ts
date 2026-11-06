import assert from 'node:assert/strict';
import { test } from 'node:test';
import { caregiverMessage, isShareCancel, mailHref, smsHref, whatsappHref } from './send-link.ts';

const url = 'https://www.domela.app/c/s/AbCdEf2345';

test('caregiverMessage greets by name and carries the link', () => {
  assert.equal(
    caregiverMessage('Marie', url),
    `Hi Marie, here is everything you need while I am out: ${url}`,
  );
  assert.equal(caregiverMessage('  ', url), `Here is everything you need while I am out: ${url}`);
});

test('WhatsApp, text and mail links keep the full URL intact', () => {
  const message = caregiverMessage('Zoë & Tom', url);
  for (const href of [whatsappHref(message), smsHref(message), mailHref('Guide', message)]) {
    assert.ok(href.includes(encodeURIComponent(url)), href);
    assert.ok(!href.includes(' '), 'no raw spaces');
    assert.ok(!href.includes('& Tom'), 'ampersand is encoded');
  }
  assert.ok(whatsappHref(message).startsWith('https://wa.me/?text='));
  assert.ok(smsHref(message).startsWith('sms:?&body='));
});

test('isShareCancel only matches a closed share sheet', () => {
  assert.equal(isShareCancel({ name: 'AbortError' }), true);
  assert.equal(isShareCancel({ name: 'NotAllowedError' }), false);
  assert.equal(isShareCancel(new Error('boom')), false);
  assert.equal(isShareCancel(null), false);
});
