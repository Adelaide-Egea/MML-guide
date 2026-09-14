'use client';

import { useState } from 'react';
import {
  type CareSubject,
  type RoutineItem,
  type RoutineKind,
  type RoutinePriority,
  ROUTINE_KIND_LABEL,
  ROUTINE_KINDS,
  ROUTINE_KINDS_FOR,
  presetsFor,
  routineFor,
  routineItemLabel,
} from '@mml/core';
import { newId } from '../lib/ids.ts';
import { useActions, useAppState } from '../lib/store.ts';

/** One subject's day — or, for a place, the checklist for the visit.
 *
 *  The routine still belongs to the household rather than to the subject: an
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
  const place = subject.kind === 'place';

  const items = [...routineFor(household.routine, subject.id)].sort((a, b) => {
    const pa = a.priority === 'nice' ? 1 : 0;
    const pb = b.priority === 'nice' ? 1 : 0;
    if (pa !== pb) return pa - pb;
    const sa = a.section ?? '';
    const sb = b.section ?? '';
    if (sa !== sb) return sa.localeCompare(sb);
    return (a.time ?? '99:99').localeCompare(b.time ?? '99:99');
  });
  const offered = presetsFor(subject.kind, presets);

  function kindsFor(item: RoutineItem): readonly RoutineKind[] {
    const suggested = ROUTINE_KINDS_FOR[subject.kind];
    return suggested.includes(item.kind) ? suggested : [item.kind, ...suggested];
  }

  function add() {
    const fallback = ROUTINE_KINDS_FOR[subject.kind][0] ?? ROUTINE_KINDS[0]!;
    actions.upsertRoutine({
      id: newId('r'),
      time: place ? null : '08:00',
      kind: fallback,
      appliesTo: subject.id,
      notes: '',
      ...(place ? { priority: 'must' as const, section: 'Must do' } : {}),
    });
  }

  return (
    <section className="stack">
      <div className="spread">
        <h2 className="eyebrow">{place ? 'While they are here' : 'Their day'}</h2>
        <div className="row">
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
          {place
            ? 'Optional. Start from a cleaner, change-and-restock, or deep-clean preset — a checklist for the visit, not a timed day.'
            : 'Optional, and quick to start from a preset. An evening sitter is only shown the evening, so filling in the whole day costs them nothing.'}
        </p>
      )}

      {showPresets && (
        <div className="card stack-tight">
          <span className="hint">
            {place
              ? 'Pick a visit shape. Sections, priorities and product notes stay editable.'
              : 'A starting point. Everything is editable afterwards.'}
          </span>
          {offered.map((preset) => (
            <div key={preset.id} className="row preset-row">
              <button
                type="button"
                className="grow preset-pick"
                onClick={() => {
                  actions.applyPreset(preset, subject.id);
                  setShowPresets(false);
                }}
              >
                <strong>{preset.label}</strong>
                <span className="muted">
                  {preset.hint} · {preset.items.length} items
                </span>
              </button>
              {preset.custom && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => actions.removePreset(preset.id)}
                  aria-label={`Delete the ${preset.label} preset`}
                  title="Delete this preset"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => setShowPresets(false)}>
            Cancel
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="card rows">
          {items.map((item) => (
            <RoutineRow
              key={item.id}
              item={item}
              place={place}
              kinds={kindsFor(item)}
              onChange={(next) => actions.upsertRoutine(next)}
              onRemove={() => actions.removeRoutine(item.id)}
            />
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

function RoutineRow({
  item,
  place,
  kinds,
  onChange,
  onRemove,
}: {
  item: RoutineItem;
  place: boolean;
  kinds: readonly RoutineKind[];
  onChange: (item: RoutineItem) => void;
  onRemove: () => void;
}) {
  const title = routineItemLabel(item);

  return (
    <div className="rows-item stack-tight">
      <div className="row">
        {!place && (
          <input
            className="input"
            type="time"
            value={item.time ?? ''}
            onChange={(e) => onChange({ ...item, time: e.target.value || null })}
            aria-label="Time"
            style={{ maxWidth: 128 }}
          />
        )}
        {place && (
          <select
            className="select"
            value={item.priority ?? 'must'}
            onChange={(e) => onChange({ ...item, priority: e.target.value as RoutinePriority })}
            aria-label="Priority"
            style={{ maxWidth: 140 }}
          >
            <option value="must">Must do</option>
            <option value="nice">Nice to have</option>
          </select>
        )}
        <select
          className="select grow"
          value={item.kind}
          onChange={(e) => {
            const kind = e.target.value as RoutineKind;
            if (kind === 'Other') {
              onChange({ ...item, kind });
              return;
            }
            const { label: _removed, ...rest } = item;
            onChange({ ...rest, kind });
          }}
          aria-label="What happens"
        >
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {ROUTINE_KIND_LABEL[kind]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          title="Remove"
        >
          ×
        </button>
      </div>

      {item.kind === 'Other' && (
        <input
          className="input"
          value={item.label ?? ''}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          placeholder="Name this — e.g. Quiet time, Steam the bathroom"
          aria-label="Name for Other"
        />
      )}

      {place && (
        <>
          <input
            className="input"
            value={item.section ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                const { section: _removed, ...rest } = item;
                onChange(rest);
              } else {
                onChange({ ...item, section: value });
              }
            }}
            placeholder="Section — Change, Deep clean, Restock…"
            aria-label="Section"
          />
          <input
            className="input"
            value={item.product ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                const { product: _removed, ...rest } = item;
                onChange(rest);
              } else {
                onChange({ ...item, product: value });
              }
            }}
            placeholder="Product or tool — steamer, Product A, gloves under the sink"
            aria-label="Product or tool"
          />
        </>
      )}

      <input
        className="input"
        value={item.notes}
        onChange={(e) => onChange({ ...item, notes: e.target.value })}
        placeholder={place ? 'Anything worth adding for this task' : 'Anything worth adding'}
        aria-label={`Notes for ${title}`}
      />
    </div>
  );
}
