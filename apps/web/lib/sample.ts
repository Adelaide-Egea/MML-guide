'use client';

// A sample household, used only by the "look around first" link.
//
// It deliberately contains a child, a dog and a flat, because the thing worth
// showing is that one guide covers all three. A demo with three children would hide
// the only structural decision that matters.

import { type Entry, type Handover, EMPTY_SAFETY } from '@mml/core';
import type { AppState } from './store.ts';
import { putBlob } from './media.ts';

const NOW = '2026-09-01T09:00:00.000Z';

function entry(
  id: string,
  topic: Entry['topic'],
  title: string,
  body: string,
  media: Entry['media'] = [],
): Entry {
  return { id, topic, title, body, media, writtenAt: NOW, writtenBy: 'Claire', language: 'en' };
}

/** Draws a labelled placeholder so the media path is exercised end to end without
 *  shipping photographs of a real house in the repository. */
function placeholder(label: string, colour: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '600 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 320, 240);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function loadSample(): AppState {
  // Fire and forget: the guide renders immediately and the images appear when they
  // are ready, which is the same behaviour as a real upload finishing.
  void placeholder('Sleeping bags — top shelf', '#4d6c82').then(
    (b) => b && putBlob('sample/togs', b),
  );
  void placeholder('Bin day: Tuesday', '#a2522d').then((b) => b && putBlob('sample/bins', b));

  const handover: Handover = {
    id: 'ho_sample',
    householdId: 'hh_sample',
    caregiverName: 'Margaret',
    caregiverRelationship: 'Grandparent',
    duration: 'fewdays',
    language: 'en',
    subjectIds: [],
    importantNotes: ['We land back on Sunday at 18:40. Call any time before that.'],
    extra: '',
    signOff: 'Thank you — Claire',
  };

  return {
    household: {
      id: 'hh_sample',
      name: 'Chez Martin',
      country: 'FR',
      subjects: [
        {
          id: 'sub_lea',
          kind: 'child',
          name: 'Léa',
          descriptor: '3 years',
          identity: { colourToken: '--id-petrol', symbol: '●' },
          safety: {
            allergies: 'Kiwi — her throat itches and her lips swell. No kiwi in anything.',
            medication: 'Nothing daily.',
            medicalNotes: '',
            emergencyNotes: 'Dr Rousseau, 01 44 32 88 10. Ours is the green card in the hall drawer.',
          },
          entries: [
            entry(
              'e_lea_sleep',
              'sleep',
              'Bedtime',
              'Bath at 18:30, story, lights out by 19:15. She will ask for a second story. There is no second story.',
            ),
            entry(
              'e_lea_togs',
              'clothing',
              'Which sleeping bag',
              'If the room is under 18°C use the 2.5 tog. Above that, the 1 tog. They are labelled on the inside collar.',
              [
                {
                  id: 'm_togs',
                  kind: 'photo',
                  key: 'sample/togs',
                  caption: 'The sleeping bags, top shelf of the white cupboard.',
                  durationSeconds: null,
                },
              ],
            ),
            entry(
              'e_lea_food',
              'meals',
              'Eating',
              'She will only eat out of the orange bowl. This is not negotiable and it is not worth the argument.',
            ),
            entry(
              'e_lea_comfort',
              'comfort',
              'If she is upset',
              'Rabbit is in the bed. If Rabbit is lost, look under the sofa first. Do not offer a substitute rabbit.',
            ),
          ],
        },
        {
          id: 'sub_pom',
          kind: 'pet',
          name: 'Pomme',
          descriptor: 'Labrador, 7',
          identity: { colourToken: '--id-clay', symbol: '▲' },
          safety: {
            allergies: 'Chicken makes her scratch. Her food is the blue bag only.',
            medication: 'Half a joint tablet with breakfast.',
            medicalNotes: '',
            emergencyNotes: 'Vet: Clinique des Batignolles, 01 42 26 55 00.',
          },
          entries: [
            entry(
              'e_pom_walk',
              'routine',
              'Walks',
              'Twice: before breakfast and around 18:00. She is fine off the lead in the park, not on the street.',
            ),
            entry(
              'e_pom_meals',
              'meals',
              'Feeding',
              'One scoop morning and evening from the blue bag. She will convincingly pretend she has not been fed.',
            ),
          ],
        },
        {
          id: 'sub_flat',
          kind: 'place',
          name: 'The flat',
          descriptor: 'Third floor, no lift',
          identity: { colourToken: '--id-indigo', symbol: '■' },
          safety: {
            allergies: '',
            medication: '',
            medicalNotes: '',
            emergencyNotes:
              'Water stopcock is under the kitchen sink, behind the bin. Turn clockwise.',
          },
          entries: [
            entry(
              'e_flat_bins',
              'cleaning',
              'Bins',
              'Out on Tuesday night. Recycling is the yellow lid, in the courtyard by the bikes.',
              [
                {
                  id: 'm_bins',
                  kind: 'photo',
                  key: 'sample/bins',
                  caption: 'The courtyard bins. Yellow lid is recycling.',
                  durationSeconds: null,
                },
              ],
            ),
            entry(
              'e_flat_plants',
              'other',
              'Plants',
              'The big one by the window on Saturday only. Everything else once while you are here.',
            ),
            entry('e_flat_wifi', 'access', 'Wifi', 'Network: Martin. Password: bonjour1789'),
          ],
        },
      ],
      contacts: [
        { id: 'c_claire', name: 'Claire', phone: '+33 6 12 34 56 78', relationship: 'Mum' },
        { id: 'c_ben', name: 'Ben', phone: '+33 6 98 76 54 32', relationship: 'Dad' },
        {
          id: 'c_neighbour',
          name: 'Sylvie (4th floor)',
          phone: '+33 6 11 22 33 44',
          relationship: 'Neighbour with a spare key',
        },
      ],
      routine: [
        { id: 'r1', time: '07:30', kind: 'Walk', appliesTo: 'sub_pom', notes: 'Short one.' },
        { id: 'r2', time: '08:00', kind: 'Breakfast', appliesTo: 'all', notes: '' },
        { id: 'r3', time: '12:30', kind: 'Lunch', appliesTo: 'sub_lea', notes: 'Orange bowl.' },
        { id: 'r4', time: '13:15', kind: 'Nap', appliesTo: 'sub_lea', notes: 'About an hour.' },
        { id: 'r5', time: '18:00', kind: 'Walk', appliesTo: 'sub_pom', notes: 'The long one.' },
        { id: 'r6', time: '18:30', kind: 'Bath', appliesTo: 'sub_lea', notes: '' },
        { id: 'r7', time: '19:15', kind: 'Bedtime', appliesTo: 'sub_lea', notes: '' },
        { id: 'r8', time: null, kind: 'Bins', appliesTo: 'sub_flat', notes: 'Tuesday night.' },
      ],
    },
    handovers: [handover],
    // One saved preset, so the sample shows that a routine you have already built
    // can be reused rather than retyped for the next child.
    presets: [
      {
        id: 'preset_sample',
        label: 'Our evenings',
        hint: 'Saved from your household',
        appliesToKind: 'child',
        custom: true,
        items: [
          { time: '18:00', kind: 'Dinner', notes: 'Orange bowl.' },
          { time: '18:30', kind: 'Bath', notes: '' },
          { time: '19:15', kind: 'Bedtime', notes: 'One story. Only one.' },
        ],
      },
    ],
    sample: true,
  };
}
