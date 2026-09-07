'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { UnsafeGuideError, buildVerifiedGuide, subjectsFor } from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { MediaThumb } from '../../../components/MediaField.tsx';
import { useAppState } from '../../../lib/store.ts';

export default function GuidePage() {
  const { id } = useParams<{ id: string }>();
  const { household, handovers } = useAppState();

  const handover = handovers.find((h) => h.id === id);

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
  const critical = guide.blocks.filter((b) => b.critical);
  const rest = guide.blocks.filter((b) => !b.critical);
  const subjects = subjectsFor(household, handover);

  return (
    <main className="shell">
      <TopBar title={handover.caregiverName || 'Guide'} back="/" />

      <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="muted">
          For {handover.caregiverName || 'whoever is looking after things'}
          {handover.caregiverRelationship ? ` · ${handover.caregiverRelationship}` : ''} ·{' '}
          {subjects.map((s) => s.name).join(', ')}
        </p>
        <Link href={`/guide/${handover.id}/ask`} className="btn no-print">
          Ask about anything
        </Link>
      </div>

      {critical.length > 0 && (
        <section className="critical stack" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="eyebrow">Read this first</div>
          {critical.map((block) => (
            <div key={block.id} className="stack-tight">
              <strong>{block.heading}</strong>
              <p className="critical-body">{block.body}</p>
            </div>
          ))}
        </section>
      )}

      {guide.routine.length > 0 && (
        <section className="card stack-tight" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="eyebrow">A typical day</div>
          {guide.routine.map((item) => {
            const who = subjects.find((s) => s.id === item.appliesTo);
            return (
              <div key={item.id} className="routine-item">
                <span className="routine-time">{item.time ?? '—'}</span>
                <span>
                  <strong>{item.kind}</strong>
                  {who && <span className="muted"> · {who.name}</span>}
                  {item.notes && (
                    <span className="muted" style={{ display: 'block' }}>
                      {item.notes}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <section className="stack">
        {rest.map((block) => (
          <article key={block.id} className="card stack-tight">
            <strong>{block.heading}</strong>
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
