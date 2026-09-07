import test from 'node:test';
import assert from 'node:assert/strict';

import {
  type Answer,
  type Candidate,
  UnsafeAnswerError,
  acceptModelAnswer,
  modelContext,
  prepare,
  retrieve,
  touchesSafetyCritical,
  verifyAnswer,
} from '../src/answering.ts';
import { type CareSubject, EMPTY_SAFETY, type Entry, type Media } from '../src/subject.ts';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function media(id: string, caption: string, kind: Media['kind'] = 'photo'): Media {
  return { id, kind, key: `k/${id}`, caption, durationSeconds: kind === 'video' ? 47 : null };
}

function entry(partial: Partial<Entry> & Pick<Entry, 'id' | 'title'>): Entry {
  return {
    topic: 'other',
    body: '',
    media: [],
    writtenAt: '2026-10-12T09:00:00.000Z',
    writtenBy: 'Claire',
    language: 'fr',
    ...partial,
  };
}

const lea: CareSubject = {
  id: 'lea',
  kind: 'child',
  name: 'Léa',
  descriptor: '4 ans',
  identity: { colourToken: 'id-teal', symbol: '●' },
  safety: {
    ...EMPTY_SAFETY,
    allergies: 'Arachide et sésame. EpiPen dans la pochette verte, tiroir de la cuisine.',
  },
  entries: [
    entry({
      id: 'lea-dress',
      topic: 'clothing',
      title: 'Pour s’habiller',
      body: 'Tout est dans cette armoire. Étagère du haut pour Léa.',
      media: [media('m1', 'L’armoire de la chambre du fond')],
    }),
    entry({
      id: 'lea-sleep',
      topic: 'sleep',
      title: 'Gigoteuse',
      body: 'En dessous de 18 degrés, la grise.',
      media: [media('m2', 'Étiquette 2.5 tog sur la gigoteuse grise')],
    }),
  ],
};

const rio: CareSubject = {
  id: 'rio',
  kind: 'pet',
  name: 'Rio',
  descriptor: 'Labrador, 7 ans',
  identity: { colourToken: 'id-clay', symbol: '▲' },
  safety: { ...EMPTY_SAFETY, emergencyNotes: 'Vétérinaire Dr Meunier, 01 44 55 66 77.' },
  entries: [
    entry({
      id: 'rio-food',
      topic: 'meals',
      title: 'Repas',
      body: 'Deux fois par jour, 08:00 et 18:00. Une tasse pleine dans la gamelle bleue.',
    }),
  ],
};

const house: CareSubject = {
  id: 'house',
  kind: 'place',
  name: 'La maison',
  descriptor: 'Appartement, 3e étage',
  identity: { colourToken: 'id-moss', symbol: '■' },
  safety: EMPTY_SAFETY,
  entries: [
    entry({
      id: 'house-storage',
      topic: 'cleaning',
      title: 'Rangement',
      body: 'Les produits sont à la cave, sur l’étagère à droite des escaliers.',
      media: [media('m3', 'Le placard sous l’évier où est la clé de la cave')],
    }),
  ],
};

const subjects = [lea, rio, house];

// ── Retrieval ────────────────────────────────────────────────────────────────

test('retrieval finds the entry a caregiver is actually asking about', () => {
  const hits = retrieve(subjects, 'où sont les produits de nettoyage ?');
  assert.ok(hits.length > 0);
  assert.equal(hits[0]?.entry.id, 'house-storage');
});

test('retrieval matches on media captions, not only body text', () => {
  // "gigoteuse" appears in the title and "tog" only in the caption; a caregiver
  // reading a label is far more likely to type the latter.
  const hits = retrieve(subjects, 'quelle gigoteuse tog ?');
  assert.equal(hits[0]?.entry.id, 'lea-sleep');
});

test('retrieval ignores accents, because borrowed phones have the wrong keyboard', () => {
  const withAccents = retrieve(subjects, 'où est l’étagère ?');
  const without = retrieve(subjects, 'ou est l etagere ?');
  assert.deepEqual(
    without.map((c) => c.entry.id),
    withAccents.map((c) => c.entry.id),
  );
  assert.ok(without.length > 0);
});

test('retrieval returns nothing when the guide does not cover the question', () => {
  assert.deepEqual(retrieve(subjects, 'quel est le code du wifi ?'), []);
});

const walks = [
  { id: 'r1', time: '07:30', kind: 'Walk' as const, appliesTo: 'rio', notes: 'Short one.' },
  { id: 'r2', time: '18:00', kind: 'Walk' as const, appliesTo: 'rio', notes: 'The long one.' },
  { id: 'r3', time: '08:00', kind: 'Breakfast' as const, appliesTo: 'all', notes: '' },
];

test('a plural in the guide still answers a singular in the question', () => {
  // Reported from the preview: an entry titled "Walks" refused "when should I walk
  // Pomme", because matching was exact and the s made them different words.
  const titled = [{ ...rio, entries: [entry({ id: 'rio-walks', title: 'Walks' })] }];
  assert.equal(retrieve(titled, 'when should I walk Rio')[0]?.entry.id, 'rio-walks');
});

test('the daily routine is answerable, not just the written entries', () => {
  const hits = retrieve(subjects, 'what time do I walk Rio?', 4, walks);
  assert.equal(hits[0]?.entry.id, 'routine:rio');
  assert.match(hits[0]?.entry.body ?? '', /07:30 — Walk/);
});

test('the routine answer holds only what belongs to that subject', () => {
  const hits = retrieve(subjects, 'what time do I walk Rio?', 4, walks);
  const body = hits[0]?.entry.body ?? '';
  assert.match(body, /18:00/);
  // 'all' applies to everyone, so it belongs here; another subject's items do not.
  assert.match(body, /Breakfast/);
  assert.doesNotMatch(body, /Nap/);
});

test('asking about "the dog" finds the dog without naming it', () => {
  // Nobody uses the name the first time. They ask about the dog, and the guide has
  // to know that Rio is one.
  const hits = retrieve(subjects, 'when do I feed the dog?', 4, walks);
  assert.equal(hits[0]?.subjectId, 'rio');
});

test('naming a subject beats refusing, even when no word matches', () => {
  const hits = retrieve(subjects, 'anything about Rio?', 4, []);
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => h.subjectId === 'rio'));
});

test('prepare passes the routine through to retrieval', () => {
  const prepared = prepare(subjects, 'what time is the walk?', 'en', walks);
  assert.equal(prepared.route, 'model');
  assert.ok(
    prepared.route === 'model' && prepared.candidates.some((c) => c.entry.id === 'routine:rio'),
  );
});

// ── The critical route ───────────────────────────────────────────────────────

test('safety-critical questions are recognised across languages', () => {
  for (const question of [
    'is she allergic to anything?',
    'elle a des allergies ?',
    'ela tem alguma alergia?',
    'wo ist das Medikament?',
    'gdzie są leki?',
  ]) {
    assert.ok(touchesSafetyCritical(question, subjects), `missed: ${question}`);
  }
});

test('a term the parent invented counts as safety-critical', () => {
  // No fixed vocabulary contains "sésame"; it is critical because Claire typed it
  // into an allergy field.
  assert.ok(touchesSafetyCritical('je peux lui donner du sésame ?', subjects));
});

test('an ordinary question is not treated as safety-critical', () => {
  assert.equal(touchesSafetyCritical('à quelle heure le dîner ?', subjects), false);
});

test('a safety-critical question never routes to a model', () => {
  const prepared = prepare(subjects, 'is Léa allergic to anything?', 'en');
  assert.equal(prepared.route, 'critical');
  assert.notEqual(prepared.route, 'model');
});

test('the critical answer carries the parent’s words unaltered', () => {
  const prepared = prepare(subjects, 'Léa allergies?', 'pt');
  assert.equal(prepared.route, 'critical');
  if (prepared.route !== 'critical') return;

  assert.equal(prepared.answer.kind, 'critical-passthrough');
  assert.ok(prepared.answer.verbatim?.includes(lea.safety.allergies));
  // The reader's language is recorded, but the fact itself stays in the language it
  // was written in. Translating an allergen in place is the failure this prevents.
  assert.equal(prepared.answer.language, 'pt');
  assert.equal(prepared.answer.verbatimLanguage, 'fr');
});

test('an unnamed critical question answers for every subject that has such facts', () => {
  const prepared = prepare(subjects, 'any allergies or medication I should know about?', 'en');
  assert.equal(prepared.route, 'critical');
  if (prepared.route !== 'critical') return;

  assert.ok(prepared.answer.verbatim?.includes('Arachide'));
  assert.ok(prepared.answer.verbatim?.includes('Dr Meunier'));
  // With several subjects the text has to say whose facts are whose.
  assert.ok(prepared.answer.verbatim?.includes('Léa'));
  assert.ok(prepared.answer.verbatim?.includes('Rio'));
  assert.equal(prepared.answer.subjectName, undefined);
});

test('a single-subject answer does not repeat the name inside the fact', () => {
  const prepared = prepare(subjects, 'Léa allergies?', 'en');
  assert.equal(prepared.route, 'critical');
  if (prepared.route !== 'critical') return;

  assert.equal(prepared.answer.subjectName, 'Léa');
  assert.equal(prepared.answer.verbatim, lea.safety.allergies);
});

test('a question hitting one subject’s own safety words answers about only them', () => {
  // "sésame" appears in Léa's allergies and nowhere else. Returning the dog's vet
  // alongside it is not safer, it is noise in the one box that must never be
  // skimmed.
  const prepared = prepare(subjects, 'je peux lui donner du sésame ?', 'en');
  assert.equal(prepared.route, 'critical');
  if (prepared.route !== 'critical') return;

  assert.ok(prepared.answer.verbatim?.includes('sésame'));
  assert.ok(!prepared.answer.verbatim?.includes('Dr Meunier'));
  assert.equal(prepared.answer.subjectName, 'Léa');
});

test('narrowing never drops a subject the question actually names', () => {
  const prepared = prepare(subjects, 'Rio — urgence ?', 'en');
  assert.equal(prepared.route, 'critical');
  if (prepared.route !== 'critical') return;

  assert.ok(prepared.answer.verbatim?.includes('Dr Meunier'));
  assert.ok(!prepared.answer.verbatim?.includes('Arachide'));
});

// ── Refusal ──────────────────────────────────────────────────────────────────

test('an uncovered question refuses instead of reaching a model', () => {
  const prepared = prepare(subjects, 'quel est le code du wifi ?', 'fr');
  assert.equal(prepared.route, 'refusal');
});

test('an empty question refuses', () => {
  assert.equal(prepare(subjects, '   ', 'fr').route, 'refusal');
});

// ── Verification ─────────────────────────────────────────────────────────────

function groundedCandidates(): readonly Candidate[] {
  const prepared = prepare(subjects, 'où sont les produits de nettoyage ?', 'pt');
  assert.equal(prepared.route, 'model');
  return prepared.route === 'model' ? prepared.candidates : [];
}

test('a model may only cite entries it was shown', () => {
  const candidates = groundedCandidates();
  const answer: Answer = {
    kind: 'grounded',
    body: 'Na cave, à direita das escadas.',
    language: 'pt',
    citations: [
      {
        entryId: 'lea-sleep', // real entry, but not retrieved for this question
        subjectId: 'lea',
        title: 'Gigoteuse',
        writtenAt: '2026-10-12T09:00:00.000Z',
        writtenBy: 'Claire',
        media: [],
      },
    ],
  };
  assert.throws(() => verifyAnswer(answer, candidates), UnsafeAnswerError);
});

test('a grounded answer with no citation is rejected', () => {
  const candidates = groundedCandidates();
  assert.throws(
    () =>
      verifyAnswer(
        { kind: 'grounded', body: 'Na cave.', language: 'pt', citations: [] },
        candidates,
      ),
    UnsafeAnswerError,
  );
});

test('an invented citation degrades to a refusal rather than throwing at the caregiver', () => {
  const prepared = prepare(subjects, 'où sont les produits de nettoyage ?', 'pt');
  const answer = acceptModelAnswer(
    prepared,
    { body: 'Estão na garagem.', citedEntryIds: ['entry-that-does-not-exist'] },
    'pt',
  );
  assert.equal(answer.kind, 'refusal');
});

test('the refusal sentinel never reaches the caregiver as prose', () => {
  // A model that says NOT_IN_GUIDE *and* cites something would otherwise pass
  // verification and put the sentinel itself on the screen.
  const prepared = prepare(subjects, 'où sont les produits de nettoyage ?', 'pt');
  const answer = acceptModelAnswer(
    prepared,
    { body: 'NOT_IN_GUIDE', citedEntryIds: ['house-storage'] },
    'pt',
  );
  assert.equal(answer.kind, 'refusal');
  assert.equal(answer.citations.length, 0);
});

test('a well-formed model answer is accepted and keeps its provenance', () => {
  const prepared = prepare(subjects, 'où sont les produits de nettoyage ?', 'pt');
  const answer = acceptModelAnswer(
    prepared,
    { body: 'Na cave, à direita das escadas.', citedEntryIds: ['house-storage'] },
    'pt',
  );

  assert.equal(answer.kind, 'grounded');
  assert.equal(answer.language, 'pt');
  assert.equal(answer.citations[0]?.entryId, 'house-storage');
  assert.equal(answer.citations[0]?.writtenBy, 'Claire');
  // The photo travels with the citation: "the cupboard under the sink" is more use
  // than the sentence.
  assert.equal(answer.citations[0]?.media[0]?.id, 'm3');
});

// ── What leaves the building ─────────────────────────────────────────────────

test('a model is sent only the retrieved entries, never safety fields', () => {
  const prepared = prepare(subjects, 'où sont les produits de nettoyage ?', 'pt');
  assert.equal(prepared.route, 'model');
  if (prepared.route !== 'model') return;

  const serialised = JSON.stringify(modelContext(prepared.candidates));
  assert.ok(serialised.includes('house-storage'));
  assert.ok(!serialised.includes('Arachide'), 'allergy text must never be sent');
  assert.ok(!serialised.includes('EpiPen'), 'allergy text must never be sent');
  assert.ok(!serialised.includes('Meunier'), 'emergency contact must never be sent');
  assert.ok(!serialised.includes('gamelle'), 'unrelated entries must not be sent');
});
