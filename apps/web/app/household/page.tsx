'use client';

import Link from 'next/link';
import { type RoutineItem, routineKindsFor } from '@mml/core';
import { TopBar } from '../../components/Chrome.tsx';
import { newId } from '../../lib/ids.ts';
import { useActions, useAppState } from '../../lib/store.ts';

export default function HouseholdPage() {
  const { household } = useAppState();
  const actions = useActions();
  const householdKinds = routineKindsFor(household, 'all');

  return (
    <main className="shell">
      <TopBar title="Household" back="/" />

      <section className="stack" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="field">
          <label htmlFor="hh-name">What do you call this place?</label>
          <input
            id="hh-name"
            className="input"
            value={household.name}
            onChange={(e) => actions.setHousehold({ name: e.target.value })}
            placeholder="Chez Martin"
          />
        </div>
      </section>

      {/* Contacts become a safety-critical block in the guide, so they belong to the
          household rather than to any one guide — the same neighbour is called about
          the child and about the boiler. */}
      <section className="stack" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="spread">
          <h2 className="eyebrow">Who to call</h2>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() =>
              actions.upsertContact({ id: newId('c'), name: '', phone: '', relationship: '' })
            }
          >
            + Add
          </button>
        </div>

        {household.contacts.length === 0 && (
          <p className="muted">
            Nobody yet. This appears at the top of every guide, next to the allergies.
          </p>
        )}

        {household.contacts.map((contact) => (
          <div key={contact.id} className="card stack-tight">
            <input
              className="input"
              value={contact.name}
              onChange={(e) => actions.upsertContact({ ...contact, name: e.target.value })}
              placeholder="Name"
              aria-label="Contact name"
            />
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={contact.phone}
              onChange={(e) => actions.upsertContact({ ...contact, phone: e.target.value })}
              placeholder="Phone"
              aria-label="Phone"
            />
            <input
              className="input"
              value={contact.relationship}
              onChange={(e) => actions.upsertContact({ ...contact, relationship: e.target.value })}
              placeholder="Mum, neighbour with a spare key, vet"
              aria-label="Relationship"
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => actions.removeContact(contact.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      {/* The whole day, read rather than edited.
      
          Every row here already has an owner, and that owner has a page where the
          presets and the right vocabulary for them live. Repeating a full editor
          here produced three stacked controls per row and a picker that offered
          nappies for a flat. So this is the overview — the view a caregiver gets,
          shown to the parent — and each row is a way into the page that owns it. */}
      <section className="stack">
        <div className="spread">
          <h2 className="eyebrow">A typical day</h2>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() =>
              actions.upsertRoutine({
                id: newId('r'),
                time: '08:00',
                kind: householdKinds[0] ?? 'Other',
                appliesTo: 'all',
                notes: '',
              })
            }
          >
            + Add for everyone
          </button>
        </div>

        <p className="muted">
          Everyone in one timeline, which is how a caregiver reads it. Tap a row to change it on
          the page it belongs to. Add here only what applies to the household rather than to one
          of them.
        </p>

        {household.routine.length === 0 && (
          <p className="muted">
            Optional. An evening sitter is only shown the evening, so adding the school run costs
            them nothing.
          </p>
        )}

        {household.routine.length > 0 && (
          <div className="card rows">
            {[...household.routine]
              .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
              .map((item) => {
                const who = household.subjects.find((s) => s.id === item.appliesTo);
                if (!who) return <SharedRow key={item.id} item={item} />;
                return (
                  <Link
                    key={item.id}
                    href={`/subjects/${who.id}`}
                    className="rows-item routine-item card-link"
                  >
                    <span className="routine-time">{item.time ?? '—'}</span>
                    <span>
                      <strong>{item.kind}</strong>
                      <span className="muted"> · {who.name}</span>
                      {item.notes && <span className="routine-note">{item.notes}</span>}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </section>
    </main>
  );
}

/** A routine item that belongs to nobody in particular — bin night, the shared
 *  breakfast. It has no subject page to live on, so it stays editable here. */
function SharedRow({ item }: { item: RoutineItem }) {
  const { household } = useAppState();
  const actions = useActions();
  const kinds = routineKindsFor(household, 'all', item.kind);

  return (
    <div className="rows-item stack-tight">
      <div className="row">
        <input
          className="input"
          type="time"
          value={item.time ?? ''}
          onChange={(e) => actions.upsertRoutine({ ...item, time: e.target.value || null })}
          aria-label="Time"
          style={{ maxWidth: 128 }}
        />
        <select
          className="select grow"
          value={item.kind}
          onChange={(e) =>
            actions.upsertRoutine({ ...item, kind: e.target.value as RoutineItem['kind'] })
          }
          aria-label="What happens"
        >
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-btn"
          onClick={() => actions.removeRoutine(item.id)}
          aria-label={`Remove ${item.kind}`}
          title="Remove"
        >
          ×
        </button>
      </div>
      <input
        className="input"
        value={item.notes}
        onChange={(e) => actions.upsertRoutine({ ...item, notes: e.target.value })}
        placeholder="Everyone — anything worth adding"
        aria-label="Notes"
      />
    </div>
  );
}
