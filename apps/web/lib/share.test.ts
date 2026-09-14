import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMPTY_SAFETY, type Handover, type Household } from '@mml/core';
import {
  encodeSnapshot,
  decodeSnapshot,
  snapshotForShare,
  MAX_SHARE_CHARS,
  type GuideSnapshot,
} from './share.ts';
import { migrate } from './store.ts';

const household: Household = {
  id: 'hh1',
  name: 'Test',
  country: 'FR',
  subjects: [
    {
      id: 'c1',
      kind: 'child',
      name: 'Léa',
      descriptor: '3 years',
      identity: { colourToken: '--id-petrol', symbol: '●' },
      safety: { ...EMPTY_SAFETY, allergies: 'Kiwi' },
      entries: [
        {
          id: 'e1',
          topic: 'meals',
          title: 'Lunch',
          body: 'Orange bowl.',
          media: [
            {
              id: 'm1',
              kind: 'photo',
              key: 'media/photo1',
              caption: 'The orange bowl',
              durationSeconds: null,
            },
          ],
          writtenAt: '2026-01-01T00:00:00.000Z',
          writtenBy: 'Claire',
          language: 'en',
        },
      ],
    },
  ],
  contacts: [],
  routine: [],
};

const handover: Handover = {
  id: 'ho1',
  householdId: 'hh1',
  caregiverName: 'Margaret',
  caregiverRelationship: 'Grandparent',
  duration: 'fewdays',
  language: 'en',
  subjectIds: [],
  importantNotes: [],
  extra: '',
  signOff: '',
};

describe('snapshotForShare', () => {
  it('strips media when photos are not included', () => {
    const snap = snapshotForShare(household, handover, { includePhotos: false });
    assert.equal(snap.v, 1);
    assert.equal(snap.household.subjects[0]!.entries[0]!.media.length, 0);
  });

  it('keeps media metadata when photos are included', () => {
    const snap = snapshotForShare(household, handover, { includePhotos: true });
    assert.equal(snap.v, 2);
    assert.equal(snap.household.subjects[0]!.entries[0]!.media.length, 1);
  });
});

describe('encode/decode snapshot', () => {
  it('round-trips a text-only snapshot (v1)', async () => {
    const snap = snapshotForShare(household, handover, { includePhotos: false });
    const encoded = await encodeSnapshot(snap);
    const decoded = await decodeSnapshot(encoded);
    assert.ok(decoded);
    assert.equal(decoded!.v, 1);
    assert.equal(decoded!.handover.id, 'ho1');
    assert.equal(decoded!.household.subjects[0]!.name, 'Léa');
  });

  it('round-trips a snapshot with embedded photo blobs (v2)', async () => {
    const snap: GuideSnapshot = {
      ...snapshotForShare(household, handover, { includePhotos: true }),
      mediaBlobs: {
        'media/photo1': { mime: 'image/png', data: Buffer.from('fake-png').toString('base64') },
      },
    };
    const encoded = await encodeSnapshot(snap);
    assert.ok(encoded.length < MAX_SHARE_CHARS);
    const decoded = await decodeSnapshot(encoded);
    assert.ok(decoded);
    assert.equal(decoded!.v, 2);
    assert.ok(decoded!.mediaBlobs?.['media/photo1']);
    assert.equal(decoded!.mediaBlobs!['media/photo1']!.mime, 'image/png');
  });

  it('still accepts legacy v1 payloads', async () => {
    const legacy: GuideSnapshot = {
      v: 1,
      household,
      handover,
    };
    const encoded = await encodeSnapshot(legacy);
    const decoded = await decodeSnapshot(encoded);
    assert.ok(decoded);
    assert.equal(decoded!.v, 1);
    assert.equal(decoded!.mediaBlobs, undefined);
  });
});

describe('migrate', () => {
  it('keeps existing plural households and fills missing trips', () => {
    const next = migrate({
      households: [household],
      activeId: 'hh1',
      handovers: [handover],
      presets: [],
      sampleId: null,
    });
    assert.equal(next.households.length, 1);
    assert.equal(next.households[0]!.id, 'hh1');
    assert.equal(next.handovers.length, 1);
    assert.deepEqual(next.trips, []);
  });

  it('lifts a singular household without wiping handovers', () => {
    const next = migrate({
      household,
      handovers: [handover],
      sample: true,
    });
    assert.equal(next.households[0]!.name, 'Test');
    assert.equal(next.handovers[0]!.id, 'ho1');
    assert.equal(next.sampleId, 'hh1');
    assert.deepEqual(next.trips, []);
  });

  it('never invents a blank wipe when households already exist', () => {
    const next = migrate({
      households: [household],
      activeId: 'missing',
      handovers: [handover],
      trips: [],
      presets: [],
      sampleId: 'hh1',
    });
    assert.equal(next.activeId, 'hh1');
    assert.equal(next.households[0]!.subjects[0]!.name, 'Léa');
  });
});
