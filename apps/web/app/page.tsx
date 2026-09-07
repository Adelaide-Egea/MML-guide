'use client';

import Link from 'next/link';
import { useState } from 'react';
import { type SubjectKind, subjectLabel } from '@mml/core';
import { Badge, TopBar } from '../components/Chrome.tsx';
import { KIND_HINT, KIND_LABEL, useActions, useAppState } from '../lib/store.ts';
import { loadSample } from '../lib/sample.ts';

const KINDS: readonly SubjectKind[] = ['child', 'pet', 'place'];

export default function Home() {
  const { household, handovers } = useAppState();
  const actions = useActions();
  const [adding, setAdding] = useState<SubjectKind | null>(null);
  const [name, setName] = useState('');

  const empty = household.subjects.length === 0;

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!adding || !name.trim()) return;
    actions.addSubject(adding, name.trim());
    setName('');
    setAdding(null);
  }

  return (
    <main className="shell">
      <TopBar title="Your household" />

      {empty && (
        <div className="stack" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="display">Who is being left behind?</h2>
          <p className="muted">
            A child, a dog, a flat with plants in it. The same guide covers all of them, so add
            whatever someone else will be looking after.
          </p>
        </div>
      )}

      <section className="stack">
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
      </section>

      <section className="stack" style={{ marginTop: 'var(--space-5)' }}>
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
          {handovers.map((handover) => (
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

      {empty && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          Want to look around first?{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => actions.replaceAll(loadSample())}
          >
            Load a sample household
          </button>
        </p>
      )}
    </main>
  );
}
