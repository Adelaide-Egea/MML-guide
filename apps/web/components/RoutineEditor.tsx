'use client';

import { useState } from 'react';
import {
  type CareSubject,
  type RoutineItem,
  type RoutineKind,
  ROUTINE_KINDS,
  ROUTINE_KINDS_FOR,
  presetsFor,
  routineFor,
} from '@mml/core';
import { newId } from '../lib/ids.ts';
import { useActions, useAppState } from '../lib/store.ts';

/** One subject's day, edited where you are already thinking about them.
 *
 *  The routine still belongs to the household rather than to the subject — an
 *  evening contains a feed and a walk and a bath, and the guide has to interleave
 *  them into one timeline. This is a filtered view onto that list, not a second
 *  copy of it.
 */
export function RoutineEditor({ subject }: { subject: CareSubject }) {
  const { household, presets } = useAppState();
  const actions = useActions();
  const [showPresets, setShowPresets] = useState(false);
  const [naming, setNaming] = useState(false);
  const [label, setLabel] = useState('');

  const items = [...routineFor(household.routine, subject.id)].sort((a, b) =>
    (a.time ?? '99:99').localeCompare(b.time ?? '99:99'),
  );
  const offered = presetsFor(subject.kind, presets);

  // Kinds are filtered to the ones that make sense for this sort of subject, so a
  // flat is not offered "Nappy" and a baby is not offered "Bins". 'Other' is always
  // there, and an item that already holds an unusual kind keeps it rather than
  // silently changing under the parent.
  function kindsFor(item: RoutineItem): readonly RoutineKind[] {
    const suggested = ROUTINE_KINDS_FOR[subject.kind];
    return suggested.includes(item.kind) ? suggested : [item.kind, ...suggested];
  }

  function add() {
    const fallback = ROUTINE_KINDS_FOR[subject.kind][0] ?? ROUTINE_KINDS[0]!;
    actions.upsertRoutine({
      id: newId('r'),
      time: '08:00',
      kind: fallback,
      appliesTo: subject.id,
      notes: '',
    });
  }

  return (
    <section className="stack">
      <div className="spread">
        <h2 className="eyebrow">Their day</h2>
        <div className="row">
          {/* Offered whether or not the day is already started. Reusing a preset on
              a child who has one item recorded is the normal case, not an edge one,
              and hiding it until the list is empty made it unreachable. */}
          {offered.length > 0 && (
            <button type="button" className="btn btn-quiet" onClick={() => setShowPresets((v) => !v)}>
              Use a preset
            </button>
          )}
          <button type="button" className="btn btn-quiet" onClick={add}>
            + Add
          </button>
        </div>
      </div>

      {items.length === 0 && !showPresets && (
        <p className="muted">
          Optional, and quick to start from a preset. An evening sitter is only shown the evening,
          so filling in the whole day costs them nothing.
        </p>
      )}

      {showPresets && (
        <div className="card stack-tight">
          <span className="hint">A starting point. Everything is editable afterwards.</span>
          {offered.map((preset) => (
            <div
              key={preset.id}
              className="row"
              style={{ borderTop: '1px solid var(--hairline)', padding: 'var(--space-2) 0' }}
            >
              <button
                type="button"
                className="grow"
                onClick={() => {
                  actions.applyPreset(preset, subject.id);
                  setShowPresets(false);
                }}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 0,
                  padding: 'var(--space-2) 0',
                }}
              >
                <strong>{preset.label}</strong>
                <span className="muted" style={{ display: 'block' }}>
                  {preset.hint} · {preset.items.length} items
                </span>
              </button>
              {preset.custom && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => actions.removePreset(preset.id)}
                  aria-label={`Delete the ${preset.label} preset`}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => setShowPresets(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* One card with hairline-separated rows rather than a card per item. A day is
          a list, and eight stacked cards read as eight separate decisions. */}
      {items.length > 0 && (
        <div className="card stack-tight">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="stack-tight"
              style={
                i === 0
                  ? undefined
                  : { borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-3)' }
              }
            >
              <div className="row">
                <input
                  className="input"
                  type="time"
                  value={item.time ?? ''}
                  onChange={(e) => actions.upsertRoutine({ ...item, time: e.target.value || null })}
                  aria-label="Time"
                  style={{ maxWidth: 140 }}
                />
                <select
                  className="select grow"
                  value={item.kind}
                  onChange={(e) =>
                    actions.upsertRoutine({ ...item, kind: e.target.value as RoutineKind })
                  }
                  aria-label="What happens"
                >
                  {kindsFor(item).map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => actions.removeRoutine(item.id)}
                  aria-label={`Remove ${item.kind}`}
                >
                  ✕
                </button>
              </div>
              <input
                className="input"
                value={item.notes}
                onChange={(e) => actions.upsertRoutine({ ...item, notes: e.target.value })}
                placeholder="Anything worth adding"
                aria-label={`Notes for ${item.kind}`}
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="row">
          {naming ? (
            <>
              <input
                className="input grow"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name this preset"
                aria-label="Preset name"
                autoFocus
              />
              <button
                type="button"
                className="btn btn-inline"
                disabled={!label.trim()}
                onClick={() => {
                  actions.savePreset(label.trim(), subject.kind, subject.id);
                  setLabel('');
                  setNaming(false);
                }}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-quiet" onClick={() => setNaming(true)}>
                Save as a preset
              </button>
              <span className="grow" />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => actions.clearRoutine(subject.id)}
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
