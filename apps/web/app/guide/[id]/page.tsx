'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type GuideBlock,
  UnsafeGuideError,
  buildVerifiedGuide,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { MediaThumb } from '../../../components/MediaField.tsx';
import { useAppState } from '../../../lib/store.ts';
import { track } from '../../../lib/trial.ts';

/** Whose part of the guide is on screen. `all` is the default and the one a guide
 *  is printed in; the rest exist because a caregiver mid-task is doing one thing for
 *  one of them and should not be reading past the other two. */
type Focus = 'all' | string;

export default function GuidePage() {
  const { id } = useParams<{ id: string }>();
  const { households, household: active, handovers } = useAppState();
  const [focus, setFocus] = useState<Focus>('all');
  const [acknowledged, setAcknowledged] = useState(false);

  const handover = handovers.find((h) => h.id === id);
  // A guide names the household it belongs to, so a link to one opens correctly
  // whichever household happens to be selected.
  const household = households.find((h) => h.id === handover?.householdId) ?? active;

  // Acknowledgement is per guide and per device: it means "this caregiver, on this
  // phone, has seen the allergies". It is deliberately not synced or shared, because
  // one person reading it is not the next person reading it.
  const ackKey = `mml.safety-ack.${id}`;
  useEffect(() => {
    setAcknowledged(window.localStorage.getItem(ackKey) === '1');
  }, [ackKey]);

  useEffect(() => {
    if (handover) track('guide');
  }, [handover]);

  // buildVerifiedGuide builds from facts, applies enrichment, then asserts that
  // nothing safety-critical was lost or altered on the way. It throws rather than
  // rendering a guide that quietly dropped an allergy — a guide that refuses to
  // render is recoverable and one that silently omits is not.
  const result = useMemo(() => {
    if (!handover) return null;
    try {
      return { guide: buildVerifiedGuide(household, handover), error: null as string | null };
    } catch (error) {
      return {
        guide: null,
        error:
          error instanceof UnsafeGuideError
            ? error.message
            : 'This guide could not be built safely.',
      };
    }
  }, [household, handover]);

  if (!handover || !result) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
        <p className="muted">This guide has been removed.</p>
      </main>
    );
  }

  if (result.error || !result.guide) {
    return (
      <main className="shell">
        <TopBar title="Guide" back="/" />
        <div className="critical stack-tight">
          <div className="eyebrow">Not safe to show</div>
          <p>{result.error}</p>
          <p className="muted">
            Nothing has been lost — this is the check that stops a guide going out with something
            important missing.
          </p>
        </div>
      </main>
    );
  }

  const guide = result.guide;
  const subjects = subjectsFor(household, handover);

  // Filtering never hides a safety-critical block. Narrowing to the dog must not be
  // a way to stop being told about the child's EpiPen, so `critical` is taken from
  // the whole guide and only the readable content below it responds to the filter.
  const critical = guide.blocks.filter((b) => b.critical);
  const inFocus = (b: GuideBlock) =>
    focus === 'all' || b.subjectId === focus || b.subjectId === undefined;
  const rest = guide.blocks.filter((b) => !b.critical && inFocus(b));
  const routine = guide.routine.filter(
    (r) => focus === 'all' || r.appliesTo === focus || r.appliesTo === 'all',
  );
  const focused = subjects.find((s) => s.id === focus);

  // Every heading is "Pomme (Labrador, 7) — Walks", which is right in a whole guide
  // and pure repetition once the filter above already says Pomme.
  const heading = (block: GuideBlock) =>
    focused && block.subjectId === focused.id
      ? block.heading.split(' — ').slice(1).join(' — ') || block.heading
      : block.heading;

  return (
    <main className="shell">
      <TopBar title={handover.caregiverName || 'Guide'} back="/" />

      <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="muted">
          For {handover.caregiverName || 'whoever is looking after things'}
          {handover.caregiverRelationship ? ` · ${handover.caregiverRelationship}` : ''}
        </p>
        <Link href={`/guide/${handover.id}/ask`} className="btn no-print">
          Ask about anything
        </Link>
      </div>

      <SafetyBlock
        blocks={critical}
        acknowledged={acknowledged}
        onAcknowledge={() => {
          window.localStorage.setItem(ackKey, '1');
          setAcknowledged(true);
        }}
      />

      {subjects.length > 1 && (
        <FocusFilter subjects={subjects} focus={focus} onChange={setFocus} />
      )}

      {routine.length > 0 && (
        <section className="card rows no-break" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="rows-head">
            <span className="eyebrow">
              {focused ? `${focused.name} — a typical day` : 'A typical day'}
            </span>
          </div>
          {routine.map((item) => {
            const who = subjects.find((s) => s.id === item.appliesTo);
            return (
              <div key={item.id} className="routine-item">
                <span className="routine-time">{item.time ?? '—'}</span>
                <span>
                  <strong>{item.kind}</strong>
                  {/* Only worth naming when the filter is not already saying it. */}
                  {who && focus === 'all' && <span className="muted"> · {who.name}</span>}
                  {item.notes && <span className="routine-note">{item.notes}</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <section className="stack">
        {rest.map((block) => (
          <article key={block.id} className="card stack-tight no-break">
            <strong>{heading(block)}</strong>
            {block.body && <p className="block-body">{block.body}</p>}
            {block.media.length > 0 && (
              <div className="media-grid">
                {block.media.map((m) => (
                  <MediaThumb key={m.id} media={m} />
                ))}
              </div>
            )}
          </article>
        ))}
        {rest.length === 0 && routine.length === 0 && (
          <p className="muted">Nothing was written down for this one.</p>
        )}
      </section>

      {handover.signOff && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          {handover.signOff}
        </p>
      )}

      <div className="row no-print" style={{ marginTop: 'var(--space-6)' }}>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
    </main>
  );
}

function FocusFilter({
  subjects,
  focus,
  onChange,
}: {
  subjects: readonly CareSubject[];
  focus: Focus;
  onChange: (focus: Focus) => void;
}) {
  return (
    <div className="chips no-print" style={{ marginBottom: 'var(--space-4)' }}>
      <button
        type="button"
        className="chip"
        aria-pressed={focus === 'all'}
        onClick={() => onChange('all')}
      >
        Everyone
      </button>
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          className="chip"
          aria-pressed={focus === subject.id}
          onClick={() => onChange(subject.id)}
        >
          {/* The same symbol and colour the subject carries everywhere else, so the
              filter is recognised rather than read. Handed to CSS as a variable so
              the selected state can override it without fighting an inline style. */}
          <span
            className="mark"
            aria-hidden="true"
            style={{ '--mark': `var(${subject.identity.colourToken})` } as React.CSSProperties}
          >
            {subject.identity.symbol}
          </span>
          {subject.name}
        </button>
      ))}
    </div>
  );
}

/** Allergies, medication and emergency instructions.
 *
 *  Two things are true at once: this must be read before anything else, and a wall
 *  of red at the top of every screen stops being read at all. So it opens loud,
 *  asks to be acknowledged once, and then holds its place as a single quiet line
 *  that reopens on tap. The content is never removed, only folded — and printing
 *  always gets the full text regardless of what was tapped on screen.
 */
function SafetyBlock({
  blocks,
  acknowledged,
  onAcknowledge,
}: {
  blocks: readonly GuideBlock[];
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  const [reopened, setReopened] = useState(false);
  if (blocks.length === 0) return null;

  const open = !acknowledged || reopened;

  const body = blocks.map((block) => (
    <div key={block.id} className="stack-tight">
      <strong>{block.heading}</strong>
      <p className="critical-body">{block.body}</p>
    </div>
  ));

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="safety safety-collapsed no-print"
          onClick={() => setReopened(true)}
          aria-expanded={false}
        >
          <span className="safety-dot" aria-hidden="true" />
          <span className="grow">Allergies, medication and emergencies</span>
          <span className="muted">Read · show</span>
        </button>
        {/* Folded on screen is not folded on paper. The printed guide is the copy
            that ends up on the fridge, and it carries the whole thing. */}
        <section className="safety stack print-only">{body}</section>
      </>
    );
  }

  return (
    <section className="safety stack" aria-labelledby="safety-heading">
      <div className="row">
        <span className="safety-dot" aria-hidden="true" />
        <span id="safety-heading" className="eyebrow safety-eyebrow grow">
          Read this first
        </span>
      </div>

      {body}

      {acknowledged ? (
        <button type="button" className="btn btn-quiet no-print" onClick={() => setReopened(false)}>
          Hide again
        </button>
      ) : (
        <button type="button" className="btn btn-secondary no-print" onClick={onAcknowledge}>
          I have read this
        </button>
      )}
    </section>
  );
}
