// The guide document.
//
// The document is built entirely from facts first. A language model may afterwards
// improve the prose of blocks that are marked as enrichable, but it can never be
// the origin of a fact and it can never touch a critical block. That rule is
// enforced by `assertSafeToRender`, not by convention — the previous
// implementation lost a child's allergies to a field-name typo precisely because
// the safety path depended on everything downstream being written correctly.
//
// Practically this means the product still works with the AI switched off, which
// is also what makes the free tier cost pennies and the whole thing survivable if
// a model provider has an outage.

import {
  type Child,
  type Handover,
  type Household,
  type RoutineItem,
  allergyText,
  childrenIn,
  describeAge,
  hasSafetyCritical,
  hasText,
  medicalText,
} from './household.ts';

/** Where the text in a block came from.
 *
 *  `facts` — copied verbatim from what the parent entered. Never rewritten.
 *  `model` — prose a model produced from those facts. Always replaceable.
 */
export type BlockSource = 'facts' | 'model';

/** Critical blocks are the ones a caregiver must not miss and must not receive in
 *  paraphrase: allergies, medication, emergency contacts, and whatever the parent
 *  flagged as important.
 */
export interface GuideBlock {
  readonly id: string;
  readonly heading: string;
  readonly body: string;
  readonly source: BlockSource;
  readonly critical: boolean;
  /** Whether a model is permitted to rewrite `body`. Always false when critical. */
  readonly enrichable: boolean;
  readonly childId?: string;
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
  options: { critical?: boolean; childId?: string } = {},
): GuideBlock {
  const critical = options.critical ?? false;
  return {
    id,
    heading,
    body,
    source: 'facts',
    critical,
    // A critical block is never enrichable. This is the single most important
    // line in the package.
    enrichable: !critical,
    ...(options.childId ? { childId: options.childId } : {}),
  };
}

const DURATION_SCOPE: Record<Handover['duration'], readonly string[]> = {
  evening: ['Dinner', 'Bath', 'Bedtime', 'Medication', 'Snack'],
  fullday: [],
  fewdays: [],
};

/** Routine items relevant to the occasion. An evening sitter does not need the
 *  school run, and showing it makes the things they *do* need harder to find.
 */
export function scopeRoutine(
  routine: readonly RoutineItem[],
  duration: Handover['duration'],
): readonly RoutineItem[] {
  const kinds = DURATION_SCOPE[duration];
  const scoped = kinds.length ? routine.filter((item) => kinds.includes(item.kind)) : routine;

  return [...scoped].sort((a, b) => {
    if (a.time === b.time) return 0;
    if (a.time === null) return 1; // untimed items sink to the bottom
    if (b.time === null) return -1;
    return a.time.localeCompare(b.time);
  });
}

function childLabel(child: Child): string {
  const age = describeAge(child.age);
  return age ? `${child.name} (${age})` : child.name;
}

/** Builds the complete guide from facts alone. No network, no model, no clock
 *  beyond the timestamp — which makes it trivially testable and means an AI
 *  outage degrades the product rather than breaking it.
 */
export function buildGuide(
  household: Household,
  handover: Handover,
  now: Date = new Date(),
): GuideDocument {
  const blocks: GuideBlock[] = [];

  // Critical content leads. A caregiver skimming for ten seconds must hit the
  // things that could hurt someone before anything else.
  for (const note of handover.importantNotes.filter(hasText)) {
    blocks.push(
      factBlock(`important:${blocks.length}`, 'Important', note.trim(), { critical: true }),
    );
  }

  for (const child of household.children) {
    const allergies = allergyText(child);
    if (allergies) {
      blocks.push(
        factBlock(`allergy:${child.id}`, `${child.name} — allergies`, allergies, {
          critical: true,
          childId: child.id,
        }),
      );
    }

    const medical = medicalText(child);
    if (medical) {
      blocks.push(
        factBlock(`medical:${child.id}`, `${child.name} — medication`, medical, {
          critical: true,
          childId: child.id,
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
        contacts.map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ''} — ${c.phone}`).join('\n'),
        { critical: true },
      ),
    );
  }

  // Everything below here is helpful rather than safety-critical, so a model may
  // improve the wording.
  for (const child of household.children) {
    if (hasText(child.likes)) {
      blocks.push(
        factBlock(`comfort:${child.id}`, `${childLabel(child)} — comfort`, child.likes.trim(), {
          childId: child.id,
        }),
      );
    }
    if (hasText(child.whenUpset)) {
      blocks.push(
        factBlock(`upset:${child.id}`, `${child.name} — if they get upset`, child.whenUpset.trim(), {
          childId: child.id,
        }),
      );
    }
    if (hasText(child.food) || hasText(child.milk)) {
      blocks.push(
        factBlock(
          `food:${child.id}`,
          `${child.name} — food`,
          [child.food, child.milk].filter(hasText).map((s) => s.trim()).join('\n'),
          { childId: child.id },
        ),
      );
    }
    if (hasText(child.screenTime)) {
      blocks.push(
        factBlock(`screen:${child.id}`, `${child.name} — screens`, child.screenTime.trim(), {
          childId: child.id,
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
    routine: scopeRoutine(household.routine, handover.duration),
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
 *  Enrichments that name a critical block, an unknown block or a non-enrichable
 *  block are discarded rather than throwing: a model returning something odd must
 *  degrade the prose, never lose a fact or fail the guide.
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
 *  Failing loudly here is deliberate. The allergy bug was silent for the life of
 *  the product because the guide still looked right; a guide that refuses to
 *  render is recoverable, and one that quietly omits an allergy is not.
 */
export function assertSafeToRender(document: GuideDocument, household: Household): void {
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

  for (const child of household.children) {
    if (!hasSafetyCritical(child)) continue;

    const allergies = allergyText(child);
    if (allergies) {
      const rendered = document.blocks.find((b) => b.id === `allergy:${child.id}`);
      if (!rendered) {
        throw new UnsafeGuideError(`${child.name} has recorded allergies but the guide omits them.`);
      }
      if (!rendered.body.includes(allergies)) {
        throw new UnsafeGuideError(
          `${child.name}'s allergies were altered between the household and the guide.`,
        );
      }
    }
  }
}

/** Convenience wrapper: build, enrich, verify. The only entry point a surface
 *  should need, so no caller can forget the assertion.
 */
export function buildVerifiedGuide(
  household: Household,
  handover: Handover,
  enrichments: readonly Enrichment[] = [],
  now?: Date,
): GuideDocument {
  const base = buildGuide(household, handover, now);
  const { document } = applyEnrichments(base, enrichments);
  assertSafeToRender(document, household);
  return document;
}

export function criticalBlocks(document: GuideDocument): readonly GuideBlock[] {
  return document.blocks.filter((b) => b.critical);
}

export { childrenIn };
