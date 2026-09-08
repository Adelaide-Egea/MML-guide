'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type SubjectKind, subjectLabel } from '@mml/core';
import { Badge } from '../components/Chrome.tsx';
import { Mark } from '../components/Mark.tsx';
import { KIND_HINT, KIND_LABEL, useActions, useAppState } from '../lib/store.ts';
import { loadSample } from '../lib/sample.ts';

const KINDS: readonly SubjectKind[] = ['child', 'pet', 'place'];

export default function Home() {
  const { household, handovers, sampleId } = useAppState();
  const actions = useActions();
  const [adding, setAdding] = useState<SubjectKind | null>(null);
  const [name, setName] = useState('');
  const [switching, setSwitching] = useState(false);
  /** Open the switcher already asking for a name — used when the sample itself
   *  offers "start yours", so the person does not have to discover the switcher. */
  const [startNaming, setStartNaming] = useState(false);

  const empty = household.subjects.length === 0;
  const guides = handovers.filter((h) => h.householdId === household.id);
  const isSample = household.id === sampleId;

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!adding || !name.trim()) return;
    actions.addSubject(adding, name.trim());
    setName('');
    setAdding(null);
  }

  function openSwitcher(naming = false) {
    setStartNaming(naming);
    setSwitching(true);
  }

  return (
    <main className="shell">
      <div className="crown no-print">
        <Mark size={30} />
        {/* Always here, even with one household. It is how you find out you can have
            a second, and it is the only way back into the sample once you have left
            it. Hiding it until it looked useful made both of those unreachable. */}
        <button
          type="button"
          className="house-switch"
          onClick={() => (switching ? setSwitching(false) : openSwitcher(false))}
          aria-expanded={switching}
        >
          <span>{household.name || 'This household'}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      {switching && (
        <HouseSwitcher
          startNaming={startNaming}
          onDone={() => {
            setSwitching(false);
            setStartNaming(false);
          }}
          onSample={() => {
            const { household: sample, handover, presets } = loadSample();
            actions.addSample(sample, handover, presets);
            setSwitching(false);
            setStartNaming(false);
          }}
        />
      )}

      <Welcome />

      {isSample && (
        <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
          This is a sample household, here to look around. Anything you change stays in it.{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => openSwitcher(true)}
          >
            Start your own
          </button>
          — the sample stays here.
        </p>
      )}

      <section className="stack">
        <h2 className="eyebrow">Who is here</h2>
        {household.subjects.map((subject) => (
          <Link key={subject.id} href={`/subjects/${subject.id}`} className="card card-link">
            <div className="row">
              <Badge subject={subject} />
              <span className="grow">
                <strong>{subjectLabel(subject)}</strong>
                <span className="muted" style={{ display: 'block' }}>
                  {KIND_LABEL[subject.kind]} · {subject.entries.length}{' '}
                  {subject.entries.length === 1 ? 'note' : 'notes'}
                </span>
              </span>
              <span aria-hidden="true" className="muted">
                →
              </span>
            </div>
          </Link>
        ))}

        {adding === null ? (
          <div className="chips">
            {KINDS.map((kind) => (
              <button key={kind} type="button" className="chip" onClick={() => setAdding(kind)}>
                + {KIND_LABEL[kind]}
              </button>
            ))}
          </div>
        ) : (
          <form className="card stack" onSubmit={add}>
            <div className="field">
              <label htmlFor="new-name">{KIND_LABEL[adding]} name</label>
              <span className="hint">{KIND_HINT[adding]}</span>
              <input
                id="new-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={adding === 'place' ? 'The flat' : 'Their name'}
                autoFocus
              />
            </div>
            <div className="row">
              <button type="submit" className="btn" disabled={!name.trim()}>
                Add
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setAdding(null);
                  setName('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {!empty && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="eyebrow">Guides</h2>
          {guides.map((handover) => (
            <Link key={handover.id} href={`/guide/${handover.id}`} className="card card-link">
              <strong>{handover.caregiverName || 'Untitled guide'}</strong>
              <span className="muted" style={{ display: 'block' }}>
                {handover.caregiverRelationship || 'Caregiver'}
              </span>
            </Link>
          ))}
          <Link href="/guide/new" className="btn">
            Create a guide
          </Link>
          <Link href="/household" className="btn btn-secondary">
            Contacts and daily routine
          </Link>
        </section>
      )}

      {empty && !sampleId && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          Want to look around first?{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => {
              const { household: sample, handover, presets } = loadSample();
              actions.addSample(sample, handover, presets);
            }}
          >
            Load a sample household
          </button>
        </p>
      )}
    </main>
  );
}

/** The first thing on the screen, and the reason the screen is not a list of
 *  records. Someone opening this has just remembered they are leaving in an hour;
 *  being greeted rather than queried is most of the difference. */
function Welcome() {
  const { household } = useAppState();
  // The greeting depends on the clock, which the server does not share, so it waits
  // for the client rather than rendering a guess and correcting it.
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  // "Léa, Pomme and The flat" reads as a typo. A place is usually named with its
  // article, which is right as a title and wrong halfway through a sentence.
  const names = household.subjects
    .map((s) => s.name)
    .filter(Boolean)
    .map((name, i) => (i === 0 ? name : name.replace(/^(The|Le|La|Les) /, (m) => m.toLowerCase())));
  const listed =
    names.length === 0
      ? null
      : names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

  return (
    <section className="welcome">
      <h2 className="display">{greeting ? `${greeting}.` : '\u00a0'}</h2>
      <p>
        {listed
          ? `${listed} — everything about them, written down once, ready for whoever has them next.`
          : 'Everything they need while you are not there. Write it once, with photos, and they can just ask it.'}
      </p>
    </section>
  );
}

function HouseSwitcher({
  onDone,
  onSample,
  startNaming = false,
}: {
  onDone: () => void;
  onSample: () => void;
  startNaming?: boolean;
}) {
  const { households, household, sampleId } = useAppState();
  const actions = useActions();
  const [naming, setNaming] = useState(startNaming);
  const [name, setName] = useState('');

  return (
    <div className="card rows" style={{ marginBottom: 'var(--space-5)' }}>
      {households.map((h) => (
        <button
          key={h.id}
          type="button"
          className="rows-item row house-option"
          onClick={() => {
            actions.selectHousehold(h.id);
            onDone();
          }}
        >
          <span className="grow">
            <strong>{h.name || 'Unnamed household'}</strong>
            <span className="muted" style={{ display: 'block' }}>
              {h.id === sampleId ? 'Sample' : `${h.subjects.length} to look after`}
            </span>
          </span>
          {h.id === household.id && <span aria-hidden="true">✓</span>}
        </button>
      ))}

      <div className="rows-item stack-tight">
        {naming ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              actions.addHousehold(name.trim());
              setName('');
              setNaming(false);
              onDone();
            }}
          >
            <input
              className="input grow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The country house"
              aria-label="Household name"
              autoFocus
            />
            <button type="submit" className="btn btn-inline" disabled={!name.trim()}>
              Add
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => setNaming(true)}>
            + Another household
          </button>
        )}

        {/* The sample is a household like any other, so it can be brought back
            after it has been left. It used to be a mode, and leaving it meant
            deleting it. */}
        {!sampleId && (
          <button type="button" className="btn btn-quiet" onClick={onSample}>
            Show the sample household
          </button>
        )}
      </div>
    </div>
  );
}
