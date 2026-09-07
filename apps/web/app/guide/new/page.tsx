'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Handover, HandoverDuration } from '@mml/core';
import { Badge, TopBar } from '../../../components/Chrome.tsx';
import { newId } from '../../../lib/ids.ts';
import { KIND_LABEL, useActions, useAppState } from '../../../lib/store.ts';

const DURATIONS: readonly { id: HandoverDuration; label: string; hint: string }[] = [
  { id: 'evening', label: 'An evening', hint: 'Dinner through bedtime only' },
  { id: 'fullday', label: 'A day', hint: 'The whole day' },
  { id: 'fewdays', label: 'Several days', hint: 'Everything, including the dull bits' },
];

export default function NewGuide() {
  const router = useRouter();
  const { household } = useAppState();
  const actions = useActions();

  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRelationship, setRelationship] = useState('');
  const [duration, setDuration] = useState<HandoverDuration>('fewdays');
  const [subjectIds, setSubjectIds] = useState<readonly string[]>([]);
  const [note, setNote] = useState('');

  function toggle(id: string) {
    setSubjectIds((ids) => (ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id]));
  }

  function create(event: React.FormEvent) {
    event.preventDefault();
    const handover: Handover = {
      id: newId('ho'),
      householdId: household.id,
      caregiverName: caregiverName.trim(),
      caregiverRelationship: caregiverRelationship.trim(),
      duration,
      language: typeof navigator === 'undefined' ? 'en' : navigator.language,
      // Empty means every subject. Selecting a subset is a privacy boundary, not a
      // convenience: someone coming to clean has no business reading a child's
      // medical notes.
      subjectIds: subjectIds.length === household.subjects.length ? [] : subjectIds,
      importantNotes: note.trim() ? [note.trim()] : [],
      extra: '',
      signOff: '',
    };
    actions.saveHandover(handover);
    router.push(`/guide/${handover.id}`);
  }

  return (
    <main className="shell">
      <TopBar title="New guide" back="/" />

      <form className="stack" onSubmit={create}>
        <div className="field">
          <label htmlFor="who">Who is this for?</label>
          <input
            id="who"
            className="input"
            value={caregiverName}
            onChange={(e) => setCaregiverName(e.target.value)}
            placeholder="Margaret"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="rel">What are they to you?</label>
          <input
            id="rel"
            className="input"
            value={caregiverRelationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Grandparent, nanny, cleaner, neighbour"
          />
        </div>

        <div className="field">
          <label>How long?</label>
          <div className="chips">
            {DURATIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="chip"
                aria-pressed={duration === option.id}
                onClick={() => setDuration(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="hint">{DURATIONS.find((d) => d.id === duration)?.hint}</span>
        </div>

        <div className="field">
          <label>What are they looking after?</label>
          <span className="hint">
            Only what you tick is shared. Someone coming to water the plants does not need to read
            a child&apos;s medical notes.
          </span>
          <div className="stack-tight">
            {household.subjects.map((subject) => {
              const on = subjectIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  className="card row"
                  aria-pressed={on}
                  onClick={() => toggle(subject.id)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: on ? 'var(--brand)' : 'var(--hairline)',
                    background: on ? 'var(--brand-tint)' : 'var(--surface)',
                  }}
                >
                  <Badge subject={subject} size={32} />
                  <span className="grow">
                    <strong>{subject.name}</strong>
                    <span className="muted" style={{ display: 'block' }}>
                      {KIND_LABEL[subject.kind]}
                    </span>
                  </span>
                  <span aria-hidden="true">{on ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label htmlFor="note">Anything they must not miss?</label>
          <span className="hint">Goes at the very top, word for word.</span>
          <textarea
            id="note"
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="We land back on Sunday at 18:40."
          />
        </div>

        <button type="submit" className="btn" disabled={subjectIds.length === 0}>
          Make the guide
        </button>
        {subjectIds.length === 0 && (
          <p className="hint" style={{ textAlign: 'center' }}>
            Pick at least one thing they are looking after.
          </p>
        )}
      </form>
    </main>
  );
}
