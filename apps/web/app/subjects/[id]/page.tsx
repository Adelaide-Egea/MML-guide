'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  type Entry,
  type EntryTopic,
  ENTRY_TOPICS,
  hasSafetyCritical,
  validateSubject,
} from '@mml/core';
import { Badge, TopBar } from '../../../components/Chrome.tsx';
import { MediaField, MediaThumb } from '../../../components/MediaField.tsx';
import { RoutineEditor } from '../../../components/RoutineEditor.tsx';
import { newId } from '../../../lib/ids.ts';
import { KIND_LABEL, useActions, useAppState } from '../../../lib/store.ts';

const TOPIC_LABEL: Record<EntryTopic, string> = {
  routine: 'Routine',
  meals: 'Meals',
  sleep: 'Sleep',
  clothing: 'Clothing',
  'out-of-the-house': 'Out of the house',
  comfort: 'Comfort',
  health: 'Health',
  access: 'Keys & access',
  cleaning: 'Cleaning',
  'house-rules': 'House rules',
  other: 'Anything else',
};

function blank(): Entry {
  return {
    id: newId('e'),
    topic: 'other',
    title: '',
    body: '',
    media: [],
    writtenAt: new Date().toISOString(),
    writtenBy: '',
    language: typeof navigator === 'undefined' ? 'en' : navigator.language,
  };
}

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { household } = useAppState();
  const actions = useActions();
  const [editing, setEditing] = useState<Entry | null>(null);

  const subject = household.subjects.find((s) => s.id === id);

  if (!subject) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
        <p className="muted">This one has been removed.</p>
      </main>
    );
  }

  const issues = validateSubject(subject);

  return (
    <main className="shell">
      <TopBar title={subject.name || KIND_LABEL[subject.kind]} back="/" />

      <div className="row" style={{ marginBottom: 'var(--space-5)' }}>
        <Badge subject={subject} size={48} />
        <div className="grow stack-tight">
          <input
            className="input"
            value={subject.name}
            onChange={(e) => actions.updateSubject(subject.id, { name: e.target.value })}
            aria-label="Name"
            placeholder="Name"
          />
          <input
            className="input"
            value={subject.descriptor}
            onChange={(e) => actions.updateSubject(subject.id, { descriptor: e.target.value })}
            aria-label="Description"
            placeholder={
              subject.kind === 'child'
                ? '3 years'
                : subject.kind === 'pet'
                  ? 'Labrador, 7'
                  : 'Third floor, no lift'
            }
          />
        </div>
      </div>

      {/* Safety-critical content is separated in the model and separated here. It is
          the one thing that is never summarised, never reordered and never touched
          by a model, and the interface should make that visible. */}
      <section className="safety stack">
        <div>
          <div className="row">
            <span className="safety-dot" aria-hidden="true" />
            <span className="eyebrow safety-eyebrow">Never paraphrased</span>
          </div>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Anything here is shown to the caregiver word for word, in your language, at the top of
            the guide. It is never rewritten or translated by the assistant.
          </p>
        </div>

        <div className="field">
          <label htmlFor="allergies">
            {subject.kind === 'place' ? 'Hazards' : 'Allergies'}
          </label>
          <textarea
            id="allergies"
            className="textarea"
            value={subject.safety.allergies}
            onChange={(e) =>
              actions.updateSubject(subject.id, {
                safety: { ...subject.safety, allergies: e.target.value },
              })
            }
            placeholder={
              subject.kind === 'place'
                ? 'The balcony door does not lock from outside.'
                : 'Kiwi — her throat itches and her lips swell.'
            }
          />
        </div>

        {subject.kind !== 'place' && (
          <div className="field">
            <label htmlFor="medication">Medication</label>
            <textarea
              id="medication"
              className="textarea"
              value={subject.safety.medication}
              onChange={(e) =>
                actions.updateSubject(subject.id, {
                  safety: { ...subject.safety, medication: e.target.value },
                })
              }
              placeholder="Half a joint tablet with breakfast."
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="emergency">In an emergency</label>
          <textarea
            id="emergency"
            className="textarea"
            value={subject.safety.emergencyNotes}
            onChange={(e) =>
              actions.updateSubject(subject.id, {
                safety: { ...subject.safety, emergencyNotes: e.target.value },
              })
            }
            placeholder={
              subject.kind === 'pet'
                ? 'Vet: Clinique des Batignolles, 01 42 26 55 00.'
                : subject.kind === 'place'
                  ? 'Water stopcock is under the kitchen sink.'
                  : 'Dr Rousseau, 01 44 32 88 10.'
            }
          />
        </div>
      </section>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <RoutineEditor subject={subject} />
      </div>

      <section className="stack">
        <div className="spread">
          <h2 className="eyebrow">What someone needs to know</h2>
          {!editing && (
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(blank())}>
              + Add
            </button>
          )}
        </div>

        {subject.entries.length === 0 && !editing && (
          <p className="muted">
            Nothing yet. Add the things you would say out loud on the way out of the door.
          </p>
        )}

        {subject.entries.map((entry) => (
          <article key={entry.id} className="card stack-tight">
            <div className="spread">
              <div className="grow">
                <div className="eyebrow">{TOPIC_LABEL[entry.topic]}</div>
                <strong>{entry.title || 'Untitled'}</strong>
              </div>
              <button type="button" className="btn btn-quiet" onClick={() => setEditing(entry)}>
                Edit
              </button>
            </div>
            {entry.body && <p className="block-body">{entry.body}</p>}
            {entry.media.length > 0 && (
              <div className="media-grid">
                {entry.media.map((m) => (
                  <MediaThumb key={m.id} media={m} />
                ))}
              </div>
            )}
          </article>
        ))}

        {editing && (
          <form
            className="card stack"
            onSubmit={(e) => {
              e.preventDefault();
              actions.upsertEntry(subject.id, editing);
              setEditing(null);
            }}
          >
            <div className="field">
              <label htmlFor="topic">Topic</label>
              <select
                id="topic"
                className="select"
                value={editing.topic}
                onChange={(e) => setEditing({ ...editing, topic: e.target.value as EntryTopic })}
              >
                {ENTRY_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {TOPIC_LABEL[topic]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                className="input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Which sleeping bag"
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="body">Details</label>
              <textarea
                id="body"
                className="textarea"
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                placeholder="If the room is under 18°C use the 2.5 tog."
              />
            </div>

            <div className="field">
              <label>Show, don&apos;t only tell</label>
              <span className="hint">
                A photo of the cupboard beats a description of the cupboard, especially if the
                person reading this does not share your first language.
              </span>
              <MediaField
                media={editing.media}
                onChange={(media) => setEditing({ ...editing, media })}
              />
            </div>

            <div className="row">
              <button type="submit" className="btn" disabled={!editing.title.trim()}>
                Save
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              {subject.entries.some((e) => e.id === editing.id) && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    actions.removeEntry(subject.id, editing.id);
                    setEditing(null);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      {issues.length > 0 && (
        <section className="notice" style={{ marginTop: 'var(--space-5)' }}>
          <div className="eyebrow">Worth fixing</div>
          <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)' }}>
            {issues.map((issue) => (
              <li key={issue.path}>{issue.message}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="row" style={{ marginTop: 'var(--space-6)' }}>
        <span className="muted grow">
          {hasSafetyCritical(subject)
            ? 'Safety information recorded.'
            : 'No safety information yet.'}
        </span>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (confirm(`Remove ${subject.name || 'this'} and everything written about them?`)) {
              actions.removeSubject(subject.id);
              router.push('/');
            }
          }}
        >
          Remove
        </button>
      </div>
    </main>
  );
}
