import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPackingList,
  createTrip,
  drySpellNights,
  nightsBetween,
  packingProgress,
  validateTrip,
} from '../src/away.ts';
import { EMPTY_SAFETY } from '../src/subject.ts';
import type { Household } from '../src/household.ts';

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
      safety: {
        ...EMPTY_SAFETY,
        allergies: 'Kiwi',
        medication: '',
      },
      entries: [],
    },
    {
      id: 'p1',
      kind: 'pet',
      name: 'Pomme',
      descriptor: 'Dog',
      identity: { colourToken: '--id-clay', symbol: '▲' },
      safety: { ...EMPTY_SAFETY, medication: 'Joint tablet' },
      entries: [],
    },
    {
      id: 'place1',
      kind: 'place',
      name: 'The flat',
      descriptor: '',
      identity: { colourToken: '--id-indigo', symbol: '■' },
      safety: EMPTY_SAFETY,
      entries: [],
    },
  ],
  contacts: [],
  routine: [],
};

describe('nightsBetween', () => {
  it('counts whole nights', () => {
    assert.equal(nightsBetween('2026-07-10', '2026-07-13'), 3);
    assert.equal(nightsBetween('2026-07-10', '2026-07-10'), 0);
  });
});

describe('drySpellNights', () => {
  it('is the full trip when there is no laundry', () => {
    assert.equal(drySpellNights(5, false), 5);
  });

  it('halves when laundry exists but timing is unknown', () => {
    assert.equal(drySpellNights(6, true, null), 3);
  });

  it('uses the longer stretch around a known laundry day', () => {
    // Laundry after 2 of 7 nights → before=2, after=5 → dry=5
    assert.equal(drySpellNights(7, true, 2), 5);
    // Laundry after 4 of 6 → before=4, after=2 → dry=4
    assert.equal(drySpellNights(6, true, 4), 4);
  });
});

describe('buildPackingList', () => {
  it('builds per-person clothes from dry spell and skips places', () => {
    let n = 0;
    const items = buildPackingList({
      household,
      travellerIds: ['c1', 'p1'],
      startDate: '2026-07-10',
      endDate: '2026-07-14',
      mode: 'car',
      destinationKind: 'family',
      destinationLabel: 'Grandparents',
      laundryAccess: false,
      id: () => `i${++n}`,
    });

    const leaUnderwear = items.find(
      (i) => i.label.includes('Underwear') && i.forSubjectIds.includes('c1'),
    );
    assert.ok(leaUnderwear);
    // 4 nights, no laundry → dry=4 → underwear = 5
    assert.equal(leaUnderwear!.qty, 5);

    assert.ok(!items.some((i) => i.label.includes('Nappies')));
    assert.ok(items.some((i) => i.forSubjectIds.includes('p1') && i.category === 'meds'));
    assert.ok(items.some((i) => i.leg === 'return'));
    assert.ok(!items.some((i) => i.forSubjectIds.includes('place1')));
  });

  it('adds transit bag items for flights', () => {
    let n = 0;
    const items = buildPackingList({
      household,
      travellerIds: ['c1'],
      startDate: '2026-08-01',
      endDate: '2026-08-08',
      mode: 'flight',
      destinationKind: 'hotel',
      destinationLabel: 'Lisbon',
      laundryAccess: true,
      laundryAfterNights: 3,
      id: () => `i${++n}`,
    });

    assert.ok(items.some((i) => i.category === 'transit'));
    assert.ok(items.some((i) => i.label.includes('passports') || i.label.includes('IDs')));
    // dry spell max(3, 4) = 4 with laundry after 3 of 7 nights
    const tops = items.find((i) => i.label.startsWith('Tops'));
    assert.ok(tops);
    assert.equal(tops!.qty, 4);
  });

  it('createTrip wires a single leg and progress starts at zero', () => {
    const trip = createTrip({
      household,
      householdId: household.id,
      travellerIds: ['c1'],
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      mode: 'train',
      destinationKind: 'hotel',
      destinationLabel: 'Brittany',
      laundryAccess: false,
      tripId: 'trip_test',
      now: '2026-06-01T10:00:00.000Z',
      id: (() => {
        let n = 0;
        return () => `p${++n}`;
      })(),
    });

    assert.equal(trip.legs.length, 1);
    assert.equal(trip.legs[0]!.transit, true);
    const progress = packingProgress(trip.items, 'outbound');
    assert.equal(progress.packed, 0);
    assert.ok(progress.total > 0);
    assert.equal(validateTrip(trip, household).filter((i) => i.severity === 'blocking').length, 0);
  });
});
