'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type ChromeCopy,
  type GuideBlock,
  type Handover,
  type RoutineItem,
  UnsafeGuideError,
  buildVerifiedGuide,
  chromeFor,
  normalizeHandover,
  routineItemLabel,
  subjectsFor,
} from '@mml/core';
import { LanguageToggle } from '../../components/LanguageToggle.tsx';
import { MediaThumb } from '../../components/MediaField.tsx';
import { identityPair } from '../../lib/identity.ts';
import { decodeSnapshot, installSnapshotMedia, type GuideSnapshot } from '../../lib/share.ts';

/** Caregiver view — a hotel desk card, not a form.
 *
 *  Greeting, one safety line, a live timeline, photo notes, ask bar.
 *  Spec: DOMELA-VISUAL-SPEC §2.
 */
export default function CaregiverPage() {
  const [snapshot, setSnapshot] = useState<GuideSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [focus, setFocus] = useState<'all' | string>('all');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(() => minutesNow());

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');

    const open = async (decoded: GuideSnapshot, installMedia: boolean) => {
      if (installMedia) {
        try {
          await installSnapshotMedia(decoded);
        } catch {
          // Text still shows.
        }
      }
      setSnapshot(decoded);
      setLanguage(decoded.handover.language || 'en');
      window.sessionStorage.setItem(
        'mml.caregiver-snapshot',
        JSON.stringify({
          ...decoded,
          mediaBlobs: undefined,
          handover: { ...decoded.handover, language: decoded.handover.language },
        }),
      );
    };

    if (hash) {
      void decodeSnapshot(hash).then(async (decoded) => {
        if (!decoded) {
          setError('This link could not be read. Ask them to send it again.');
          return;
        }
        await open(decoded, true);
      });
      return;
    }

    try {
      const raw = window.sessionStorage.getItem('mml.caregiver-snapshot');
      if (raw) {
        const parsed = JSON.parse(raw) as GuideSnapshot;
        if (parsed?.household && parsed?.handover) {
          void open(parsed, false);
          return;
        }
      }
    } catch {
      // Fall through.
    }
    setError('This link has no guide in it.');
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    const next = {
      ...snapshot,
      mediaBlobs: undefined,
      handover: { ...snapshot.handover, language },
    };
    window.sessionStorage.setItem('mml.caregiver-snapshot', JSON.stringify(next));
  }, [language, snapshot]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMinutes(minutesNow()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const result = useMemo(() => {
    if (!snapshot) return null;
    try {
      const handover = normalizeHandover({ ...snapshot.handover, language });
      return {
        guide: buildVerifiedGuide(snapshot.household, handover),
        handover,
        household: snapshot.household,
        error: null as string | null,
      };
    } catch (err) {
      return {
        guide: null,
        handover: normalizeHandover({ ...snapshot.handover, language }),
        household: snapshot.household,
        error:
          err instanceof UnsafeGuideError ? err.message : 'This guide could not be built safely.',
      };
    }
  }, [snapshot, language]);

  const chrome = chromeFor(language);

  if (error) {
    return (
      <main className="shell hotel">
        <p className="muted">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="shell hotel">
        <p className="muted">{chrome.openingGuide}</p>
      </main>
    );
  }

  if (result.error || !result.guide) {
    return (
      <main className="shell hotel">
        <div className="critical stack-tight">
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
  const notes = guide.blocks.filter((b) => !b.critical && inFocus(b) && (b.body || b.media.length));
  const photoNotes = notes.filter((b) => b.media.length > 0);
  const textNotes = notes.filter((b) => b.media.length === 0 && b.body);
  const routine = guide.routine.filter(
    (r) => focus === 'all' || r.appliesTo === focus || r.appliesTo === 'all',
  );
  const primary = subjects.find((s) => s.kind === 'child') ?? subjects[0];
  const tint = primary ? identityPair(primary.identity.colourToken).tint : '--id-dusk';

  return (
    <main className="shell hotel">
      <header className="hotel-top">
        <ScenarioChip chrome={chrome} handover={handover} tint={tint} />
        <LanguageToggle value={language} onChange={setLanguage} compact />
      </header>

      <Greeting chrome={chrome} handover={handover} />

      {critical.length > 0 && (
        <SafetyLine
          chrome={chrome}
          blocks={critical}
          open={safetyOpen}
          onToggle={() => setSafetyOpen((v) => !v)}
        />
      )}

      {subjects.length > 1 && (
        <div className="hotel-focus">
          <button
            type="button"
            className="hotel-focus-chip"
            aria-pressed={focus === 'all'}
            onClick={() => setFocus('all')}
          >
            {chrome.everyone}
          </button>
          {subjects.map((subject: CareSubject) => {
            const pair = identityPair(subject.identity.colourToken);
            return (
              <button
                key={subject.id}
                type="button"
                className="hotel-focus-chip"
                aria-pressed={focus === subject.id}
                onClick={() => setFocus(subject.id)}
                style={
                  focus === subject.id
                    ? { background: `var(${pair.tint})`, color: `var(${pair.ink})` }
                    : undefined
                }
              >
                <span aria-hidden="true">{subject.identity.symbol}</span> {subject.name}
              </button>
            );
          })}
        </div>
      )}

      {routine.length > 0 && (
        <Timeline
          chrome={chrome}
          items={routine}
          subjects={subjects}
          focus={focus}
          nowMinutes={nowMinutes}
        />
      )}

      {photoNotes.length > 0 && (
        <section className="hotel-photos">
          {photoNotes.map((block) => (
            <article key={block.id} className="hotel-photo-note">
              {block.media.slice(0, 1).map((m) => (
                <MediaThumb key={m.id} media={m} />
              ))}
              <h3>{block.heading}</h3>
              {block.body ? <p>{block.body}</p> : null}
            </article>
          ))}
        </section>
      )}

      {textNotes.length > 0 && (
        <section className="hotel-notes">
          {textNotes.map((block) => (
            <article key={block.id} className="hotel-note">
              <h3>{block.heading}</h3>
              {block.body ? <p>{block.body}</p> : null}
            </article>
          ))}
        </section>
      )}

      {routine.length === 0 && notes.length === 0 && (
        <p className="muted">{chrome.nothingWritten}</p>
      )}

      {handover.signOff ? <p className="hotel-signoff">{handover.signOff}</p> : null}

      <div className="hotel-ask-spacer" aria-hidden="true" />
      <Link href="/c/ask" className="hotel-ask">
        <span className="hotel-ask-icon" aria-hidden="true">
          ✉
        </span>
        <span>{chrome.askPlaceholderTonight}</span>
      </Link>
    </main>
  );
}

function minutesNow(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseTime(time: string | null): number | null {
  if (!time) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function ScenarioChip({
  chrome,
  handover,
  tint,
}: {
  chrome: ChromeCopy;
  handover: Handover;
  tint: string;
}) {
  const label =
    handover.scenario === 'evening'
      ? chrome.scenarioEvening
      : handover.scenario === 'fullday'
        ? chrome.scenarioFullDay
        : handover.scenario === 'cleaner'
          ? chrome.scenarioCleaner
          : handover.scenario === 'petsitter'
            ? chrome.scenarioPetSitter
            : handover.scenario === 'goingtoyours'
              ? chrome.scenarioGoingToYours
              : chrome.scenarioWeekend;
  return (
    <span className="hotel-scenario" style={{ background: `var(${tint})` }}>
      {label}
    </span>
  );
}

function Greeting({
  chrome,
  handover,
}: {
  chrome: ChromeCopy;
  handover: Handover;
}) {
  return (
    <div className="hotel-greeting">
      <h1>{chrome.helloName(handover.caregiverName || 'there')}</h1>
      <p className="hotel-shape">{handover.expectation}</p>
    </div>
  );
}

function SafetyLine({
  chrome,
  blocks,
  open,
  onToggle,
}: {
  chrome: ChromeCopy;
  blocks: readonly GuideBlock[];
  open: boolean;
  onToggle: () => void;
}) {
  const first =
    blocks.find((b) => b.id.startsWith('allergy:')) ??
    blocks.find((b) => b.id === 'local-emergency') ??
    blocks[0];
  const summary = first ? safetySummary(first.heading, first.body) : chrome.readThisFirst;

  return (
    <section className="hotel-safety">
      <button type="button" className="hotel-safety-line" onClick={onToggle} aria-expanded={open}>
        <span className="hotel-safety-icon" aria-hidden="true">
          ⚠
        </span>
        <span className="hotel-safety-text">{open ? chrome.hideAgain : summary}</span>
      </button>
      <div className="hotel-safety-body" hidden={!open}>
        {blocks.map((block) => (
          <article key={block.id}>
            <strong>{block.heading}</strong>
            <p>{block.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Two real sentences for the collapsed safety line — never a middle-dot chain. */
function safetySummary(heading: string, body: string): string {
  const lead = heading.replace(/\s*—\s*/, ': ').replace(/\.\s*$/, '');
  const first = body.split(/[.\n]/)[0]?.trim() ?? '';
  if (!first) return `${lead}.`;
  return `${lead}. ${first.replace(/\.\s*$/, '')}.`;
}

function Timeline({
  chrome,
  items,
  subjects,
  focus,
  nowMinutes,
}: {
  chrome: ChromeCopy;
  items: readonly RoutineItem[];
  subjects: readonly CareSubject[];
  focus: string;
  nowMinutes: number;
}) {
  const timed = items
    .map((item) => ({ item, mins: parseTime(item.time) }))
    .sort((a, b) => (a.mins ?? 9999) - (b.mins ?? 9999));

  let nowIndex = -1;
  for (let i = 0; i < timed.length; i += 1) {
    const mins = timed[i]?.mins ?? null;
    if (mins === null) continue;
    if (mins <= nowMinutes) nowIndex = i;
  }
  // If everything is still ahead, highlight the first timed row.
  if (nowIndex < 0) {
    nowIndex = timed.findIndex((t) => t.mins !== null);
  }

  return (
    <section className="hotel-timeline" aria-label={chrome.aTypicalDay}>
      {timed.map(({ item, mins }, index) => {
        const who = subjects.find((s) => s.id === item.appliesTo);
        const state = mins === null ? 'future' : index < nowIndex ? 'past' : index === nowIndex ? 'now' : 'future';
        const showDetail = state === 'now' || Boolean(item.notes) || Boolean(item.product);
        return (
          <div key={item.id} className={`hotel-row hotel-row-${state}`}>
            <span className="hotel-time">
              {item.time ??
                (item.priority === 'nice' ? chrome.nice : item.priority === 'must' ? chrome.must : '—')}
            </span>
            <div className="hotel-row-body">
              <strong>{routineItemLabel(item)}</strong>
              {who && focus === 'all' && <span className="hotel-detail">{chrome.forName(who.name)}</span>}
              {showDetail && item.product && (
                <span className="hotel-detail">{chrome.useProduct(item.product)}</span>
              )}
              {showDetail && item.notes && <span className="hotel-detail">{item.notes}</span>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
