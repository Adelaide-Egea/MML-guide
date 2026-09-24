'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type ChromeCopy,
  type GuideBlock,
  type Handover,
  type PackItem,
  type RoutineItem,
  type Trip,
  UnsafeGuideError,
  buildVerifiedGuide,
  chromeFor,
  localizeGuideHeading,
  mergeRoutineRows,
  normalizeHandover,
  packingProgress,
  routineItemLabel,
  subjectsFor,
} from '@mml/core';
import { LanguageToggle } from '../../components/LanguageToggle.tsx';
import { MediaThumb } from '../../components/MediaField.tsx';
import { identityPair } from '../../lib/identity.ts';
import { decodeSnapshot, installSnapshotMedia, type GuideSnapshot } from '../../lib/share.ts';
import { useActions } from '../../lib/store.ts';

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
  const actions = useActions();

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
  const spine = spineForScenario(handover.scenario);
  const trip = snapshot?.trip ?? null;

  function togglePacked(itemId: string, packed: boolean) {
    if (!snapshot?.trip) return;
    const nextTrip: Trip = {
      ...snapshot.trip,
      updatedAt: new Date().toISOString(),
      items: snapshot.trip.items.map((item) =>
        item.id === itemId ? { ...item, packed } : item,
      ),
    };
    setSnapshot({ ...snapshot, trip: nextTrip });
    actions.setPackItemPacked(nextTrip.id, itemId, packed);
  }

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

      {subjects.length > 1 && spine !== 'bag' && (
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

      {spine === 'bag' && trip ? (
        <PackingPanel trip={trip} onToggle={togglePacked} />
      ) : spine === 'bag' ? (
        <p className="muted">No packing list was attached to this guide.</p>
      ) : null}

      {spine !== 'bag' && routine.length > 0 && (
        <Timeline
          chrome={chrome}
          items={routine}
          parentOrder={household.routine}
          subjects={subjects}
          focus={focus}
          nowMinutes={nowMinutes}
          spine={spine}
        />
      )}

      {photoNotes.length > 0 && (
        <section className="hotel-photos">
          {photoNotes.map((block) => (
            <article key={block.id} className="hotel-photo-note">
              {block.media.slice(0, 1).map((m) => (
                <MediaThumb key={m.id} media={m} />
              ))}
              <h3>{localizeGuideHeading(block.heading, chrome)}</h3>
              {block.body ? <p>{block.body}</p> : null}
            </article>
          ))}
        </section>
      )}

      {textNotes.length > 0 && (
        <section className="hotel-notes">
          {textNotes.map((block) => (
            <article key={block.id} className="hotel-note">
              <h3>{localizeGuideHeading(block.heading, chrome)}</h3>
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
  const summary = first
    ? safetySummary(localizeGuideHeading(first.heading, chrome), first.body)
    : chrome.readThisFirst;

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
            <strong>{localizeGuideHeading(block.heading, chrome)}</strong>
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

function spineForScenario(scenario: Handover['scenario']): 'time' | 'room' | 'bag' {
  if (scenario === 'cleaner') return 'room';
  if (scenario === 'goingtoyours') return 'bag';
  return 'time';
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function PackingPanel({
  trip,
  onToggle,
}: {
  trip: Trip;
  onToggle: (itemId: string, packed: boolean) => void;
}) {
  const returnReady = Boolean(trip.returnsOn && todayISO() >= trip.returnsOn);
  const [returnList, setReturnList] = useState(returnReady);

  useEffect(() => {
    setReturnList(returnReady);
  }, [returnReady, trip.id]);

  const visible = returnList
    ? trip.items.filter((item) => item.comesHome)
    : trip.items.filter((item) => item.leg !== 'return' || item.comesHome);
  const progress = packingProgress(visible);
  const bags: string[] = [];
  const byBag = new Map<string, PackItem[]>();
  for (const item of visible) {
    const bag = item.bag?.trim() || 'Shared';
    if (!byBag.has(bag)) {
      bags.push(bag);
      byBag.set(bag, []);
    }
    byBag.get(bag)!.push(item);
  }
  const fill = progress.total === 0 ? 0 : (progress.packed / progress.total) * 100;

  return (
    <section className="hotel-packing" aria-label={returnList ? 'Before they leave' : 'Packing'}>
      <div className="hotel-pack-progress">
        <p className="hotel-pack-count">
          {progress.packed} of {progress.total} packed
        </p>
        <div className="hotel-pack-track" aria-hidden="true">
          <div className="hotel-pack-fill" style={{ width: `${fill}%` }} />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-quiet btn-inline"
        style={{ marginBottom: 'var(--space-4)', textDecoration: 'underline' }}
        onClick={() => setReturnList((v) => !v)}
      >
        {returnList ? 'Show full list' : 'Before they leave'}
      </button>

      {returnList ? <h2 className="eyebrow">Before they leave</h2> : null}

      {bags.map((bag) => (
        <div key={bag} className="hotel-pack-bag">
          <h3 className="hotel-room-heading">{bag}</h3>
          <ul className="hotel-pack-list">
            {(byBag.get(bag) ?? []).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`hotel-pack-item${item.packed ? ' is-packed' : ''}`}
                  onClick={() => onToggle(item.id, !item.packed)}
                  aria-pressed={item.packed}
                >
                  <span className="hotel-pack-mark" aria-hidden="true">
                    {item.packed ? '✓' : '○'}
                  </span>
                  <span className="grow">
                    <strong>
                      {item.qty > 1 ? `${item.qty}× ` : ''}
                      {item.label}
                    </strong>
                    {item.comesHome && !returnList ? (
                      <span className="hotel-pack-tag">comes home</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Timeline({
  chrome,
  items,
  parentOrder,
  subjects,
  focus,
  nowMinutes,
  spine,
}: {
  chrome: ChromeCopy;
  items: readonly RoutineItem[];
  parentOrder: readonly RoutineItem[];
  subjects: readonly CareSubject[];
  focus: string;
  nowMinutes: number;
  spine: 'time' | 'room' | 'bag';
}) {
  // Packing spine is rendered by PackingPanel, not this timeline.
  if (spine === 'bag') {
    return null;
  }

  if (spine === 'room') {
    const ordered = [...items].sort((a, b) => {
      const ia = parentOrder.findIndex((r) => r.id === a.id);
      const ib = parentOrder.findIndex((r) => r.id === b.id);
      return (ia < 0 ? 9999 : ia) - (ib < 0 ? 9999 : ib);
    });
    const groups: { section: string; items: RoutineItem[] }[] = [];
    const index = new Map<string, number>();
    for (const item of ordered) {
      const section = item.section?.trim() ?? '';
      let at = index.get(section);
      if (at === undefined) {
        at = groups.length;
        index.set(section, at);
        groups.push({ section, items: [] });
      }
      groups[at]!.items.push(item);
    }

    return (
      <section className="hotel-timeline" aria-label={chrome.aTypicalDay}>
        {groups.map((group) => (
          <div key={group.section || 'ungrouped'} className="hotel-room-group">
            {group.section ? <h3 className="hotel-room-heading">{group.section}</h3> : null}
            {group.items.map((item) => {
              const who = subjects.find((s) => s.id === item.appliesTo);
              return (
                <div key={item.id} className="hotel-row hotel-row-future">
                  <span className="hotel-time">
                    {item.priority === 'nice'
                      ? chrome.nice
                      : item.priority === 'must'
                        ? chrome.must
                        : '—'}
                  </span>
                  <div className="hotel-row-body">
                    <strong>{routineItemLabel(item, chrome.routineKinds)}</strong>
                    {who && focus === 'all' && (
                      <span className="hotel-detail">{chrome.forName(who.name)}</span>
                    )}
                    {item.product && (
                      <span className="hotel-detail">{chrome.useProduct(item.product)}</span>
                    )}
                    {item.notes && <span className="hotel-detail">{item.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </section>
    );
  }

  const timed = mergeRoutineRows(items)
    .map((row) => ({ ...row, mins: parseTime(row.item.time) }))
    .sort((a, b) => (a.mins ?? 9999) - (b.mins ?? 9999));

  // Highlight every row at the current clock slot — two 10:00 snacks (before merge)
  // or two different kinds at the same minute must both read as "now", not only the
  // last one in the list. Different bedtimes still take turns as the clock moves.
  let nowMins: number | null = null;
  for (const row of timed) {
    if (row.mins === null) continue;
    if (row.mins <= nowMinutes) nowMins = row.mins;
  }
  if (nowMins === null) {
    nowMins = timed.find((t) => t.mins !== null)?.mins ?? null;
  }

  return (
    <section className="hotel-timeline" aria-label={chrome.aTypicalDay}>
      {timed.map(({ item, mins, appliesToIds }) => {
        const names =
          focus === 'all' && !appliesToIds.includes('all')
            ? appliesToIds
                .map((id) => subjects.find((s) => s.id === id)?.name)
                .filter((n): n is string => Boolean(n))
            : [];
        const state =
          mins === null
            ? 'future'
            : nowMins !== null && mins < nowMins
              ? 'past'
              : nowMins !== null && mins === nowMins
                ? 'now'
                : 'future';
        const showDetail = state === 'now' || Boolean(item.notes) || Boolean(item.product);
        return (
          <div key={appliesToIds.join('-') + ':' + item.id} className={`hotel-row hotel-row-${state}`}>
            <span className="hotel-time">
              {item.time ??
                (item.priority === 'nice' ? chrome.nice : item.priority === 'must' ? chrome.must : '—')}
            </span>
            <div className="hotel-row-body">
              <strong>{routineItemLabel(item, chrome.routineKinds)}</strong>
              {names.length > 0 && (
                <span className="hotel-detail">{chrome.forNames(names)}</span>
              )}
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
