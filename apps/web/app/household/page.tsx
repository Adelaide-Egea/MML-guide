'use client';

import { type RoutineItem, ROUTINE_KINDS } from '@mml/core';
import { TopBar } from '../../components/Chrome.tsx';
import { newId } from '../../lib/ids.ts';
import { useActions, useAppState } from '../../lib/store.ts';

export default function HouseholdPage() {
  const { household } = useAppState();
  const actions = useActions();

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
                kind: 'Breakfast',
                appliesTo: 'all',
                notes: '',
              })
            }
          >
            + Add
          </button>
        </div>

        {household.routine.length === 0 && (
          <p className="muted">
            Optional. An evening sitter is only shown the evening, so adding the school run costs
            them nothing.
          </p>
        )}

        {[...household.routine]
          .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
          .map((item) => (
            <div key={item.id} className="card stack-tight">
              <div className="row">
                <input
                  className="input"
                  type="time"
                  value={item.time ?? ''}
                  onChange={(e) =>
                    actions.upsertRoutine({ ...item, time: e.target.value || null })
                  }
                  aria-label="Time"
                  style={{ maxWidth: 140 }}
                />
                <select
                  className="select grow"
                  value={item.kind}
                  onChange={(e) =>
                    actions.upsertRoutine({ ...item, kind: e.target.value as RoutineItem['kind'] })
                  }
                  aria-label="What happens"
                >
                  {ROUTINE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="select"
                value={item.appliesTo}
                onChange={(e) => actions.upsertRoutine({ ...item, appliesTo: e.target.value })}
                aria-label="Who this applies to"
              >
                <option value="all">Everyone</option>
                {household.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={item.notes}
                onChange={(e) => actions.upsertRoutine({ ...item, notes: e.target.value })}
                placeholder="Anything worth adding"
                aria-label="Notes"
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => actions.removeRoutine(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
      </section>
    </main>
  );
}
