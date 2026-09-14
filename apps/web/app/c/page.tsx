'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type GuideBlock,
  UnsafeGuideError,
  buildVerifiedGuide,
  routineItemLabel,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../components/Chrome.tsx';
import { LanguageToggle } from '../../components/LanguageToggle.tsx';
import { MediaThumb } from '../../components/MediaField.tsx';
import { decodeSnapshot, installSnapshotMedia, type GuideSnapshot } from '../../lib/share.ts';

/** Caregiver / cleaner view opened from a shared link.
 *
 *  The snapshot lives in the URL fragment, so another phone can open the guide
 *  without an account and without uploading the household. Ask uses the same
 *  snapshot held in sessionStorage for this tab.
 */
export default function CaregiverPage() {
  const [snapshot, setSnapshot] = useState<GuideSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [focus, setFocus] = useState<'all' | string>('all');
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      setError('This link has no guide in it.');
      return;
    }
    void decodeSnapshot(hash).then(async (decoded) => {
      if (!decoded) {
        setError('This link could not be read. Ask them to send it again.');
        return;
      }
      // When the parent opted in, photo bytes are in the snapshot — install them
      // into this phone's media store so the existing thumbs can resolve.
      try {
        await installSnapshotMedia(decoded);
      } catch {
        // Text still shows; missing photos are better than failing the whole guide.
      }
      setSnapshot(decoded);
      setLanguage(decoded.handover.language || 'en');
      window.sessionStorage.setItem(
        'mml.caregiver-snapshot',
        JSON.stringify({
          ...decoded,
          // Blobs are already in IndexedDB; drop them from sessionStorage to save space.
          mediaBlobs: undefined,
          handover: { ...decoded.handover, language: decoded.handover.language },
        }),
      );
    });
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    // Keep blobs out of sessionStorage — they live in IndexedDB after install.
    const next = {
      ...snapshot,
      mediaBlobs: undefined,
      handover: { ...snapshot.handover, language },
    };
    window.sessionStorage.setItem('mml.caregiver-snapshot', JSON.stringify(next));
  }, [language, snapshot]);

  const result = useMemo(() => {
    if (!snapshot) return null;
    try {
      const handover = { ...snapshot.handover, language };
      return {
        guide: buildVerifiedGuide(snapshot.household, handover),
        handover,
        household: snapshot.household,
        error: null as string | null,
      };
    } catch (err) {
      return {
        guide: null,
        handover: { ...snapshot.handover, language },
        household: snapshot.household,
        error:
          err instanceof UnsafeGuideError ? err.message : 'This guide could not be built safely.',
      };
    }
  }, [snapshot, language]);

  if (error) {
    return (
      <main className="shell">
        <TopBar title="Guide" />
        <p className="muted">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="shell">
        <TopBar title="Guide" />
        <p className="muted">Opening the guide…</p>
      </main>
    );
  }

  if (result.error || !result.guide) {
    return (
      <main className="shell">
        <TopBar title="Guide" />
        <div className="critical stack-tight">
          <div className="eyebrow">Not safe to show</div>
          <p>{result.error}</p>
        </div>
      </main>
    );
  }

  const { guide, handover, household } = result;
  const subjects = subjectsFor(household, handover);
  const critical = guide.blocks.filter((b) => b.critical);
  const inFocus = (b: GuideBlock) =>
    focus === 'all' || b.subjectId === focus || b.subjectId === undefined;
  const rest = guide.blocks.filter((b) => !b.critical && inFocus(b));
  const routine = guide.routine.filter(
    (r) => focus === 'all' || r.appliesTo === focus || r.appliesTo === 'all',
  );
  const focused = subjects.find((s) => s.id === focus);
  const placeOnly = subjects.length > 0 && subjects.every((s) => s.kind === 'place');

  return (
    <main className="shell">
      <TopBar title={handover.caregiverName || 'Your guide'} />

      <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="muted">
          For {handover.caregiverName || 'you'}
          {handover.caregiverRelationship ? ` · ${handover.caregiverRelationship}` : ''}
        </p>
        <LanguageToggle value={language} onChange={setLanguage} />
        <Link href="/c/ask" className="btn">
          Ask about anything
        </Link>
      </div>

      {critical.length > 0 && (
        <section className="safety stack" style={{ marginBottom: 'var(--space-5)' }}>
          {!acknowledged ? (
            <>
              <div className="eyebrow">Read first</div>
              {critical.map((block) => (
                <article key={block.id} className="stack-tight">
                  <strong>{block.heading}</strong>
                  <p className="block-body">{block.body}</p>
                </article>
              ))}
              <button type="button" className="btn" onClick={() => setAcknowledged(true)}>
                I have read this
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => setAcknowledged(false)}>
              Safety notes — tap to reopen
            </button>
          )}
        </section>
      )}

      {subjects.length > 1 && (
        <div className="chips" style={{ marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            className="chip"
            aria-pressed={focus === 'all'}
            onClick={() => setFocus('all')}
          >
            Everyone
          </button>
          {subjects.map((subject: CareSubject) => (
            <button
              key={subject.id}
              type="button"
              className="chip"
              aria-pressed={focus === subject.id}
              onClick={() => setFocus(subject.id)}
            >
              <span aria-hidden="true">{subject.identity.symbol}</span> {subject.name}
            </button>
          ))}
        </div>
      )}

      {routine.length > 0 && (
        <section className="card rows" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="rows-head">
            <span className="eyebrow">
              {focused
                ? focused.kind === 'place'
                  ? `${focused.name} — while you are here`
                  : `${focused.name} — a typical day`
                : placeOnly
                  ? 'While you are here'
                  : 'A typical day'}
            </span>
          </div>
          {routine.map((item) => {
            const who = subjects.find((s) => s.id === item.appliesTo);
            return (
              <div key={item.id} className="routine-item">
                <span className="routine-time">
                  {item.time ??
                    (item.priority === 'nice' ? 'Nice' : item.priority === 'must' ? 'Must' : '—')}
                </span>
                <span>
                  <strong>{routineItemLabel(item)}</strong>
                  {item.section && <span className="muted"> · {item.section}</span>}
                  {who && focus === 'all' && <span className="muted"> · {who.name}</span>}
                  {item.product && <span className="routine-note">Use {item.product}</span>}
                  {item.notes && <span className="routine-note">{item.notes}</span>}
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
        {rest.length === 0 && routine.length === 0 && (
          <p className="muted">Nothing was written down for this visit.</p>
        )}
      </section>

      {handover.signOff && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          {handover.signOff}
        </p>
      )}
    </main>
  );
}
