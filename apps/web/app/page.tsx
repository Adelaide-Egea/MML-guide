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
  const { household, handovers, trips, sampleId } = useAppState();
  const actions = useActions();
  const [adding, setAdding] = useState<SubjectKind | null>(null);
  const [name, setName] = useState('');
  const [switching, setSwitching] = useState(false);

  const empty = household.subjects.length === 0;
  const guides = handovers.filter((h) => h.householdId === household.id);
  const awayTrips = trips.filter((t) => t.householdId === household.id);
  const isSample = household.id === sampleId;

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!adding || !name.trim()) return;
    actions.addSubject(adding, name.trim());
    setName('');
    setAdding(null);
  }

  /** Leave the example in one tap: new blank household, sample gone from the list. */
  function startYourOwn() {
    actions.addHousehold('');
    setSwitching(false);
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
          onClick={() => setSwitching((open) => !open)}
          aria-expanded={switching}
        >
          <span>{household.name || 'This household'}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      {switching && (
        <HouseSwitcher
          onDone={() => setSwitching(false)}
          onSample={() => {
            const { household: sample, handover, presets, trips: sampleTrips } = loadSample();
            actions.addSample(sample, handover, presets, sampleTrips);
            setSwitching(false);
          }}
        />
      )}

      <Welcome />

      {isSample && (
        <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
          This is an example, not one of your households — look around, then start yours.{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={startYourOwn}
          >
            Start your own
          </button>
          {' · '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => actions.removeSample()}
          >
            Remove example
          </button>
        </p>
      )}

      <section className="stack">
        <h2 className="eyebrow">Who is here</h2>
        {household.subjects.length > 0 && (
          <div className="card rows">
            {household.subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="rows-item row card-link"
              >
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
              </Link>
            ))}
          </div>
        )}

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
          {guides.length > 0 && (
            <div className="card rows">
              {guides.map((handover) => (
                <Link
                  key={handover.id}
                  href={`/guide/${handover.id}`}
                  className="rows-item card-link"
                >
                  <strong>{handover.caregiverName || 'Untitled guide'}</strong>
                  <span className="muted" style={{ display: 'block' }}>
                    {handover.caregiverRelationship || 'Caregiver'}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/guide/new" className="btn">
            Create a guide
          </Link>
          <Link href="/household" className="btn btn-secondary">
            Contacts and daily routine
          </Link>
        </section>
      )}

      {!empty && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="eyebrow">Away</h2>
          <p className="muted">Packing for trips — part of organising the household.</p>
          {awayTrips.length > 0 && (
            <div className="card rows">
              {awayTrips.map((trip) => (
                <Link key={trip.id} href={`/away/${trip.id}`} className="rows-item card-link">
                  <strong>{trip.title}</strong>
                  <span className="muted" style={{ display: 'block' }}>
                    {trip.destinationLabel || trip.startDate}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/away/new" className="btn">
            Plan a trip
          </Link>
        </section>
      )}

      {empty && !sampleId && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          Write it once. She can ask it the rest.
          <br />
          Want to look around first?{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => {
              const { household: sample, handover, presets, trips: sampleTrips } = loadSample();
              actions.addSample(sample, handover, presets, sampleTrips);
            }}
          >
            See an example
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
          ? `Everything about ${listed}, written once, so it is still there on Thursday.`
          : "Everything you'd put in a long text message on the way out of the door. Written once, so it's still there on Thursday."}
      </p>
    </section>
  );
}

function HouseSwitcher({
  onDone,
  onSample,
}: {
  onDone: () => void;
  onSample: () => void;
}) {
  const { households, household, sampleId } = useAppState();
  const actions = useActions();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const realHouseholds = households.filter((h) => h.id !== sampleId);
  const sample = sampleId ? households.find((h) => h.id === sampleId) : undefined;

  return (
    <div className="card rows" style={{ marginBottom: 'var(--space-5)' }}>
      {realHouseholds.map((h) => (
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
              {`${h.subjects.length} to look after`}
            </span>
          </span>
          {h.id === household.id && <span aria-hidden="true">✓</span>}
        </button>
      ))}

      {sample && (
        <div className="rows-item stack-tight" style={{ borderTop: '1px solid var(--hairline)' }}>
          <span className="hint">Example — not one of your households</span>
          <div className="row">
            <button
              type="button"
              className="btn btn-quiet grow"
              onClick={() => {
                actions.selectHousehold(sample.id);
                onDone();
              }}
              style={{ justifyContent: 'flex-start' }}
            >
              {sample.name || 'Example'}
              {household.id === sample.id ? ' ✓' : ''}
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-inline"
              onClick={() => {
                actions.removeSample();
                onDone();
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

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

        {!sampleId && (
          <button type="button" className="btn btn-quiet" onClick={onSample}>
            See an example
          </button>
        )}
      </div>
    </div>
  );
}
