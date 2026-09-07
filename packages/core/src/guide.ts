// The guide document.
//
// Built entirely from facts first. A language model may afterwards improve the prose
// of blocks marked enrichable, but it can never be the origin of a fact and it can
// never touch a critical block. That rule is enforced by `assertSafeToRender`, not
// by convention — the prototype lost a child's allergies to a field-name typo
// precisely because the safety path depended on everything downstream being written
// correctly.
//
// Practically this means the product still works with the AI switched off, which is
// also what makes the free tier cost pennies and the whole thing survivable when a
// model provider has an outage.

import {
  type CareSubject,
  type Media,
  allergyText,
  emergencyText,
  hasSafetyCritical,
  hasText,
  medicalText,
  subjectLabel,
} from './subject.ts';
import {
  type Handover,
  type Household,
  type RoutineItem,
  subjectsFor,
} from './household.ts';

/** Where a block's text came from.
 *
 *  `facts` — copied verbatim from what the parent entered. Never rewritten.
 *  `model` — prose a model produced from those facts. Always replaceable.
 */
export type BlockSource = 'facts' | 'model';

/** Critical blocks are the ones a caregiver must not miss and must not receive in
 *  paraphrase: allergies, medication, emergency instructions, household contacts,
 *  and whatever the parent flagged as important.
 */
export interface GuideBlock {
  readonly id: string;
  readonly heading: string;
  readonly body: string;
  readonly source: BlockSource;
  readonly critical: boolean;
  /** Whether a model may rewrite `body`. Always false when critical. */
  readonly enrichable: boolean;
  /** Photos and video travel with the block. A picture of the cupboard is often the
   *  entire answer, and separating media from the text it belongs to is how it ends
   *  up unseen at the bottom of a screen. */
  readonly media: readonly Media[];
  readonly subjectId?: string;
}

export interface GuideDocument {
  readonly handoverId: string;
  readonly householdId: string;
  readonly caregiverName: string;
  readonly language: string;
  readonly blocks: readonly GuideBlock[];
  readonly routine: readonly RoutineItem[];
  readonly generatedAt: string;
}

function factBlock(
  id: string,
  heading: string,
  body: string,
  options: { critical?: boolean; subjectId?: string; media?: readonly Media[] } = {},
): GuideBlock {
  const critical = options.critical ?? false;
  return {
    id,
    heading,
    body,
    source: 'facts',
    critical,
    // A critical block is never enrichable. This is the single most important line
    // in the package.
    enrichable: !critical,
    media: options.media ?? [],
    ...(options.subjectId ? { subjectId: options.subjectId } : {}),
  };
}

const DURATION_SCOPE: Record<Handover['duration'], readonly RoutineItem['kind'][]> = {
  evening: ['Dinner', 'Bath', 'Bedtime', 'Medication', 'Snack', 'Feed', 'Walk'],
  fullday: [],
  fewdays: [],
};

/** Routine items relevant to the occasion. An evening sitter does not need the
 *  school run, and showing it makes the things they *do* need harder to find.
 */
export function scopeRoutine(
  routine: readonly RoutineItem[],
  duration: Handover['duration'],
  subjects?: readonly CareSubject[],
): readonly RoutineItem[] {
  const kinds = DURATION_SCOPE[duration];
  let scoped = kinds.length ? routine.filter((item) => kinds.includes(item.kind)) : routine;

  if (subjects) {
    const ids = new Set(subjects.map((s) => s.id));
    scoped = scoped.filter((item) => item.appliesTo === 'all' || ids.has(item.appliesTo));
  }

  return [...scoped].sort((a, b) => {
    if (a.time === b.time) return 0;
    if (a.time === null) return 1; // untimed items sink to the bottom
    if (b.time === null) return -1;
    return a.time.localeCompare(b.time);
  });
}

/** Builds the complete guide from facts alone. No network, no model, no clock beyond
 *  the timestamp — which makes it trivially testable and means an AI outage degrades
 *  the product rather than breaking it.
 */
export function buildGuide(
  household: Household,
  handover: Handover,
  now: Date = new Date(),
): GuideDocument {
  const subjects = subjectsFor(household, handover);
  const blocks: GuideBlock[] = [];

  // Critical content leads. A caregiver skimming for ten seconds must reach the
  // things that could hurt someone before anything else.
  for (const note of handover.importantNotes.filter(hasText)) {
    blocks.push(
      factBlock(`important:${blocks.length}`, 'Important', note.trim(), { critical: true }),
    );
  }

  for (const subject of subjects) {
    const allergies = allergyText(subject);
    if (allergies) {
      blocks.push(
        factBlock(`allergy:${subject.id}`, `${subject.name} — allergies`, allergies, {
          critical: true,
          subjectId: subject.id,
        }),
      );
    }

    const medical = medicalText(subject);
    if (medical) {
      blocks.push(
        factBlock(`medical:${subject.id}`, `${subject.name} — medication`, medical, {
          critical: true,
          subjectId: subject.id,
        }),
      );
    }

    const emergency = emergencyText(subject);
    if (emergency) {
      blocks.push(
        factBlock(`emergency:${subject.id}`, `${subject.name} — in an emergency`, emergency, {
          critical: true,
          subjectId: subject.id,
        }),
      );
    }
  }

  const contacts = household.contacts.filter((c) => hasText(c.phone));
  if (contacts.length) {
    blocks.push(
      factBlock(
        'contacts',
        'Who to call',
        contacts
          .map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ''} — ${c.phone}`)
          .join('\n'),
        { critical: true },
      ),
    );
  }

  // Everything below is helpful rather than safety-critical, so a model may improve
  // the wording. One block per entry, in the order the parent arranged them.
  for (const subject of subjects) {
    for (const entry of subject.entries) {
      if (!hasText(entry.body) && entry.media.length === 0) continue;
      blocks.push(
        factBlock(`entry:${entry.id}`, `${subjectLabel(subject)} — ${entry.title}`, entry.body.trim(), {
          subjectId: subject.id,
          media: entry.media,
        }),
      );
    }
  }

  if (hasText(handover.extra)) {
    blocks.push(factBlock('extra', 'Anything else', handover.extra.trim()));
  }

  return {
    handoverId: handover.id,
    householdId: household.id,
    caregiverName: handover.caregiverName,
    language: handover.language,
    blocks,
    routine: scopeRoutine(household.routine, handover.duration, subjects),
    generatedAt: now.toISOString(),
  };
}

// ── The enrichment boundary ──────────────────────────────────────────────────

export interface Enrichment {
  readonly blockId: string;
  readonly body: string;
}

/** Applies model output to the document.
 *
 *  Enrichments naming a critical block, an unknown block or a non-enrichable block
 *  are discarded rather than throwing: a model returning something odd must degrade
 *  the prose, never lose a fact or fail the guide.
 */
export function applyEnrichments(
  document: GuideDocument,
  enrichments: readonly Enrichment[],
): { readonly document: GuideDocument; readonly rejected: readonly string[] } {
  const byId = new Map(enrichments.map((e) => [e.blockId, e]));
  const rejected: string[] = [];

  for (const [id] of byId) {
    const block = document.blocks.find((b) => b.id === id);
    if (!block || !block.enrichable || block.critical) rejected.push(id);
  }

  const blocks = document.blocks.map((block) => {
    const enrichment = byId.get(block.id);
    if (!enrichment) return block;
    if (block.critical || !block.enrichable) return block;
    if (!hasText(enrichment.body)) return block;
    return { ...block, body: enrichment.body.trim(), source: 'model' as const };
  });

  return { document: { ...document, blocks }, rejected };
}

// ── The invariant ────────────────────────────────────────────────────────────

export class UnsafeGuideError extends Error {
  // Subclassing Error does not set `name`, and this is exactly the error that must
  // be identifiable at a glance in an alert.
  override readonly name = 'UnsafeGuideError';
}

/** Call before rendering or sending. Throws rather than shipping a guide that has
 *  lost or paraphrased something safety-critical.
 *
 *  Failing loudly is deliberate. The allergy bug was silent for the life of the
 *  prototype because the guide still looked right; a guide that refuses to render is
 *  recoverable, and one that quietly omits an allergy is not.
 */
export function assertSafeToRender(
  document: GuideDocument,
  household: Household,
  handover?: Handover,
): void {
  for (const block of document.blocks) {
    if (block.critical && block.source !== 'facts') {
      throw new UnsafeGuideError(
        `Block "${block.id}" is safety-critical but its text came from a model.`,
      );
    }
    if (block.critical && block.enrichable) {
      throw new UnsafeGuideError(`Block "${block.id}" is safety-critical but marked enrichable.`);
    }
  }

  // Only subjects this caregiver is responsible for are checked. Requiring the
  // cleaner's guide to carry a child's allergies would defeat the scoping.
  const subjects = handover ? subjectsFor(household, handover) : household.subjects;

  for (const subject of subjects) {
    if (!hasSafetyCritical(subject)) continue;

    for (const [prefix, value] of [
      ['allergy', allergyText(subject)],
      ['medical', medicalText(subject)],
      ['emergency', emergencyText(subject)],
    ] as const) {
      if (!value) continue;
      const rendered = document.blocks.find((b) => b.id === `${prefix}:${subject.id}`);
      if (!rendered) {
        throw new UnsafeGuideError(
          `${subject.name} has recorded ${prefix} information but the guide omits it.`,
        );
      }
      if (!rendered.body.includes(value)) {
        throw new UnsafeGuideError(
          `${subject.name}'s ${prefix} information was altered between the household and the guide.`,
        );
      }
    }
  }
}

/** Convenience wrapper: build, enrich, verify. The only entry point a surface should
 *  need, so no caller can forget the assertion.
 */
export function buildVerifiedGuide(
  household: Household,
  handover: Handover,
  enrichments: readonly Enrichment[] = [],
  now?: Date,
): GuideDocument {
  const base = buildGuide(household, handover, now);
  const { document } = applyEnrichments(base, enrichments);
  assertSafeToRender(document, household, handover);
  return document;
}

export function criticalBlocks(document: GuideDocument): readonly GuideBlock[] {
  return document.blocks.filter((b) => b.critical);
}

export function guideMedia(document: GuideDocument): readonly Media[] {
  return document.blocks.flatMap((b) => b.media);
}
