// Answering a caregiver's question from the guide.
//
// The product promise is narrow and worth stating exactly: the assistant answers
// only from what the parent wrote, and says so when the guide does not cover
// something. That promise is what makes the other answers worth trusting, so it is
// enforced here rather than requested in a prompt.
//
// Three rules, in order of importance.
//
// 1. A safety-critical question never reaches a language model. Allergies,
//    medication and emergency instructions are answered by returning the parent's
//    own words, verbatim, with no paraphrase and no in-place translation. A
//    mistranslated allergen is the worst thing this product could do, and the way
//    to make that impossible is to keep the model out of the path entirely rather
//    than to ask it nicely.
//
// 2. A model only ever sees the handful of entries that deterministic retrieval
//    selected. It cannot cite what it was not shown, and `verifyAnswer` rejects any
//    citation outside that set. This bounds both hallucination and how much of a
//    household's private detail is sent anywhere.
//
// 3. Anything that fails verification degrades to a refusal. A wrong answer is far
//    more costly than no answer, because the caregiver cannot tell the difference
//    and the parent is not there to correct it.

import {
  type CareSubject,
  type Entry,
  type Media,
  allergyText,
  emergencyText,
  hasText,
  medicalText,
} from './subject.ts';

// ── Text handling ────────────────────────────────────────────────────────────

/** Diacritics are stripped so that a caregiver typing without accents — which is
 *  usual on a borrowed phone with the wrong keyboard — still matches. */
function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Function words carry no signal and actively mislead: "où est la clé" and "quel
 *  est le code du wifi" share only "est", which was enough to make an unrelated
 *  entry look like an answer. Length alone cannot filter these out, because real
 *  three-letter search terms exist — "tog" being the one this product depends on.
 */
const STOPWORDS = new Set([
  // English
  'the', 'and', 'for', 'are', 'you', 'your', 'what', 'where', 'when', 'how', 'can',
  'does', 'did', 'was', 'with', 'this', 'that', 'there', 'here', 'from', 'have',
  'has', 'any', 'should', 'know', 'about', 'need', 'want', 'get', 'got', 'put',
  'his', 'her', 'them', 'they', 'she', 'him', 'who', 'whom', 'been', 'will',
  // French
  'est', 'les', 'des', 'dans', 'pour', 'une', 'que', 'qui', 'quel', 'quelle',
  'quels', 'quelles', 'avec', 'sur', 'sous', 'mon', 'ses', 'son', 'elle', 'plus',
  'tout', 'tous', 'cette', 'mais', 'pas', 'par', 'sont', 'faire', 'fait', 'dois',
  'peux', 'puis', 'aux', 'leur', 'nous', 'vous', 'ils', 'comment', 'quand',
  // Portuguese and Spanish
  'esta', 'estao', 'estan', 'para', 'com', 'dos', 'das', 'uma', 'como', 'posso',
  'devo', 'sao', 'nao', 'onde', 'que', 'los', 'las', 'del', 'por', 'donde', 'esto',
  'puedo', 'debo', 'son', 'hay',
  // German and Polish
  'der', 'die', 'das', 'und', 'ist', 'wie', 'den', 'dem', 'ich', 'sie', 'nie',
  'jest', 'gdzie', 'jak', 'czy', 'sie',
]);

function terms(value: string): readonly string[] {
  return normalise(value)
    .split(/[^\p{Letter}\p{Number}]+/u)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

// ── Detecting a safety-critical question ─────────────────────────────────────

/** Vocabulary that forces the deterministic path, across the languages a caregiver
 *  is most likely to use. Over-matching is the safe direction: the cost of treating
 *  an ordinary question as critical is a slightly blunter answer, and the cost of
 *  the reverse is unbounded.
 */
const CRITICAL_VOCABULARY: readonly string[] = [
  // English
  'allerg', 'allergic', 'epipen', 'medicine', 'medication', 'medical', 'inhaler',
  'asthma', 'insulin', 'seizure', 'emergency', 'ambulance', 'hospital', 'poison',
  'choking', 'dose', 'tablet', 'antihistamine', 'peanut', 'sesame', 'penicillin',
  // French
  'allergie', 'allergique', 'medicament', 'medicaments', 'traitement', 'inhalateur',
  'asthme', 'urgence', 'urgences', 'pompier', 'hopital', 'arachide', 'cachet',
  // Portuguese / Spanish
  'alergia', 'alergico', 'alergica', 'remedio', 'medicamento', 'medicamentos',
  'emergencia', 'hospitalar', 'amendoim', 'cacahuete', 'jeringa',
  // Polish / Romanian, common among caregivers in the UK and France
  'alergia', 'lekarstwo', 'leki', 'pogotowie', 'alergie', 'medicament',
  // German
  'allergien', 'medikament', 'notfall',
];

function mentionsCriticalVocabulary(question: string): boolean {
  const haystack = normalise(question);
  return CRITICAL_VOCABULARY.some((word) => haystack.includes(word));
}

function safetyText(subject: CareSubject): string {
  return [allergyText(subject), medicalText(subject), emergencyText(subject)]
    .filter(hasText)
    .join(' ');
}

/** Subjects whose safety fields actually use a word from the question.
 *
 *  A parent who wrote "no kiwi, it makes her throat itch" has created a critical
 *  term — "kiwi" — that no fixed vocabulary knows about, and "can she have kiwi?"
 *  must not be answered by a model. Returning *which* subjects matched, rather than
 *  a boolean, is also what lets the answer stay narrow: a question about kiwi should
 *  not surface the boiler cut-off.
 */
function subjectsMatchingSafetyText(
  question: string,
  subjects: readonly CareSubject[],
): readonly CareSubject[] {
  const asked = new Set(terms(question));
  if (asked.size === 0) return [];

  return subjects.filter((subject) => {
    const safety = safetyText(subject);
    if (!safety) return false;
    return terms(safety).some((term) => asked.has(term));
  });
}

export function touchesSafetyCritical(question: string, subjects: readonly CareSubject[]): boolean {
  return (
    mentionsCriticalVocabulary(question) || subjectsMatchingSafetyText(question, subjects).length > 0
  );
}

// ── Retrieval ────────────────────────────────────────────────────────────────

export interface Candidate {
  readonly subjectId: string;
  readonly subjectName: string;
  readonly entry: Entry;
  readonly score: number;
}

/** Deterministic, offline, and explainable. Weighted so that a title match beats a
 *  body match, and a media caption counts for more than body prose — a caption is
 *  usually the only text describing the photo that actually answers the question.
 */
export function retrieve(
  subjects: readonly CareSubject[],
  question: string,
  limit = 4,
): readonly Candidate[] {
  const asked = terms(question);
  if (asked.length === 0) return [];

  const scored: Candidate[] = [];

  for (const subject of subjects) {
    const namedSubject = terms(subject.name).some((t) => asked.includes(t));

    for (const entry of subject.entries) {
      const fields: readonly (readonly [string, number])[] = [
        [entry.title, 3],
        [entry.topic.replace(/-/g, ' '), 2],
        [entry.media.map((m) => m.caption).join(' '), 2],
        [entry.body, 1],
      ];

      let score = 0;
      for (const [value, weight] of fields) {
        const bag = new Set(terms(value));
        for (const term of asked) if (bag.has(term)) score += weight;
      }

      // Naming the subject narrows the question to them without being the only
      // reason an entry surfaces.
      if (namedSubject && score > 0) score += 2;

      if (score > 0) {
        scored.push({ subjectId: subject.id, subjectName: subject.name, entry, score });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit);
}

// ── The answer ───────────────────────────────────────────────────────────────

export type AnswerKind = 'grounded' | 'critical-passthrough' | 'refusal';

export interface Citation {
  readonly entryId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly writtenAt: string;
  readonly writtenBy: string;
  readonly media: readonly Media[];
}

export interface Answer {
  readonly kind: AnswerKind;
  /** What the caregiver reads. For `critical-passthrough` this is a label, not the
   *  fact — the fact is in `verbatim` and must be rendered from there. */
  readonly body: string;
  readonly language: string;
  readonly citations: readonly Citation[];
  /** Present only on `critical-passthrough`: the parent's own words, unaltered. */
  readonly verbatim?: string;
  readonly verbatimLanguage?: string;
  readonly subjectName?: string;
}

function citationFor(candidate: Candidate): Citation {
  return {
    entryId: candidate.entry.id,
    subjectId: candidate.subjectId,
    title: candidate.entry.title,
    writtenAt: candidate.entry.writtenAt,
    writtenBy: candidate.entry.writtenBy,
    media: candidate.entry.media,
  };
}

export function refusal(language: string): Answer {
  return { kind: 'refusal', body: 'NOT_IN_GUIDE', language, citations: [] };
}

// ── Preparing a question ─────────────────────────────────────────────────────

export interface PreparedCritical {
  readonly route: 'critical';
  readonly answer: Answer;
}

export interface PreparedModel {
  readonly route: 'model';
  readonly candidates: readonly Candidate[];
}

export interface PreparedRefusal {
  readonly route: 'refusal';
  readonly answer: Answer;
}

export type Prepared = PreparedCritical | PreparedModel | PreparedRefusal;

/** The routing decision, made before any network call.
 *
 *  Returning a finished answer for the critical route is the point: there is no
 *  code path from a safety-critical question to a language model, so no prompt
 *  change and no model swap can introduce one.
 */
export function prepare(
  subjects: readonly CareSubject[],
  question: string,
  readerLanguage: string,
): Prepared {
  if (!hasText(question)) return { route: 'refusal', answer: refusal(readerLanguage) };

  if (touchesSafetyCritical(question, subjects)) {
    const asked = new Set(terms(question));

    // Narrowest defensible pool, in order.
    //
    // A named subject wins outright. Failing that, the subjects whose own safety
    // text the question actually hit: "can she eat kiwi?" is about the child with
    // kiwi in her allergies, and answering it with the boiler cut-off teaches the
    // caregiver to skim the one box that must never be skimmed.
    //
    // Only when neither applies — "is anyone allergic to anything?", which matches
    // generic vocabulary and nobody's specific words — does it fall back to
    // everyone. That question must not be answered about only one child.
    const named = subjects.filter((s) => terms(s.name).some((t) => asked.has(t)));
    const matched = subjectsMatchingSafetyText(question, subjects);
    const pool = named.length ? named : matched.length ? matched : subjects;

    const answered: { subject: CareSubject; facts: string }[] = [];
    let language = readerLanguage;
    for (const subject of pool) {
      // Every safety field of a chosen subject, not just the field that matched.
      // Someone asking about an allergy needs to see the medication as well.
      const facts = [allergyText(subject), medicalText(subject), emergencyText(subject)]
        .filter(hasText)
        .join('\n');
      if (!facts) continue;
      answered.push({ subject, facts });
      const entryLanguage = subject.entries[0]?.language;
      if (entryLanguage) language = entryLanguage;
    }

    const only = answered.length === 1 ? answered[0] : undefined;
    if (!only && answered.length === 0) {
      return { route: 'refusal', answer: refusal(readerLanguage) };
    }

    return {
      route: 'critical',
      answer: {
        kind: 'critical-passthrough',
        body: 'SAFETY_CRITICAL',
        language: readerLanguage,
        citations: [],
        // Whose facts these are has to be unambiguous when there are several. With
        // one, `subjectName` carries it and repeating it inside the verbatim text
        // would put a word in front of the fact that the parent did not write.
        verbatim: only
          ? only.facts
          : answered.map(({ subject, facts }) => `${subject.name}\n${facts}`).join('\n\n'),
        verbatimLanguage: language,
        ...(only ? { subjectName: only.subject.name } : {}),
      },
    };
  }

  const candidates = retrieve(subjects, question);
  if (candidates.length === 0) return { route: 'refusal', answer: refusal(readerLanguage) };
  return { route: 'model', candidates };
}

// ── Verifying what a model returned ──────────────────────────────────────────

export class UnsafeAnswerError extends Error {
  // Subclassing Error does not set `name`, and this is the error that has to be
  // identifiable at a glance in an alert.
  override readonly name = 'UnsafeAnswerError';
}

export interface ModelAnswer {
  readonly body: string;
  readonly citedEntryIds: readonly string[];
}

/** Throws if the model produced something the contract does not allow. Callers
 *  should use `acceptModelAnswer`, which converts a violation into a refusal. */
export function verifyAnswer(answer: Answer, candidates: readonly Candidate[]): void {
  const offered = new Set(candidates.map((c) => c.entry.id));

  if (answer.kind === 'refusal') {
    if (answer.citations.length > 0) {
      throw new UnsafeAnswerError('A refusal must not cite anything.');
    }
    return;
  }

  if (answer.kind === 'critical-passthrough') {
    if (!hasText(answer.verbatim)) {
      throw new UnsafeAnswerError('A safety-critical answer must carry the parent’s exact words.');
    }
    return;
  }

  if (!hasText(answer.body)) {
    throw new UnsafeAnswerError('A grounded answer with no text is a refusal wearing a disguise.');
  }

  if (answer.citations.length === 0) {
    throw new UnsafeAnswerError('A grounded answer must cite at least one entry.');
  }

  for (const citation of answer.citations) {
    if (!offered.has(citation.entryId)) {
      throw new UnsafeAnswerError(
        `Answer cites "${citation.entryId}", which was not among the entries retrieved for this question.`,
      );
    }
  }
}

/** Turns raw model output into a verified answer, or a refusal.
 *
 *  Never throws at the caller. A caregiver standing in someone else's kitchen at
 *  seven in the morning is not the right audience for a stack trace, and "this is
 *  not in the guide" is always a truthful thing to say when we cannot prove the
 *  alternative.
 */
export function acceptModelAnswer(
  prepared: Prepared,
  model: ModelAnswer,
  readerLanguage: string,
): Answer {
  if (prepared.route !== 'model') return prepared.answer;

  const byId = new Map(prepared.candidates.map((c) => [c.entry.id, c]));
  const citations: Citation[] = [];
  for (const id of model.citedEntryIds) {
    const candidate = byId.get(id);
    if (candidate) citations.push(citationFor(candidate));
  }

  const answer: Answer = {
    kind: 'grounded',
    body: model.body.trim(),
    language: readerLanguage,
    citations,
  };

  try {
    verifyAnswer(answer, prepared.candidates);
    return answer;
  } catch {
    return refusal(readerLanguage);
  }
}

/** What a model is allowed to see. Nothing about the household beyond the entries
 *  retrieved for this one question — no other subject, no safety fields, no contact
 *  numbers. */
export function modelContext(candidates: readonly Candidate[]): readonly {
  readonly entryId: string;
  readonly subject: string;
  readonly title: string;
  readonly body: string;
  readonly media: readonly string[];
  readonly writtenAt: string;
  readonly language: string;
}[] {
  return candidates.map((c) => ({
    entryId: c.entry.id,
    subject: c.subjectName,
    title: c.entry.title,
    body: c.entry.body,
    media: c.entry.media.map((m) => m.caption),
    writtenAt: c.entry.writtenAt,
    language: c.entry.language,
  }));
}
