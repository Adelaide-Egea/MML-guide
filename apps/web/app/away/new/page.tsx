'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  DESTINATION_KINDS,
  DESTINATION_LABEL,
  TRIP_MODES,
  TRIP_MODE_LABEL,
  createTrip,
  subjectLabel,
  type DestinationKind,
  type TripMode,
} from '@mml/core';
import { Badge, TopBar } from '../../../components/Chrome.tsx';
import { newId } from '../../../lib/ids.ts';
import { KIND_LABEL, useActions, useAppState } from '../../../lib/store.ts';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysISO(start: string, days: number): string {
  const [y, m, d] = start.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function NewTrip() {
  const router = useRouter();
  const { household } = useAppState();
  const actions = useActions();

  const travellers = useMemo(
    () => household.subjects.filter((s) => s.kind !== 'place'),
    [household.subjects],
  );

  const [title, setTitle] = useState('');
  const [destinationKind, setDestinationKind] = useState<DestinationKind>('family');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(() => addDaysISO(todayISO(), 3));
  const [mode, setMode] = useState<TripMode>('car');
  const [travellerIds, setTravellerIds] = useState<readonly string[]>(() =>
    travellers.map((s) => s.id),
  );
  const [laundryAccess, setLaundryAccess] = useState(false);
  const [notes, setNotes] = useState('');

  function toggle(id: string) {
    setTravellerIds((ids) => (ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id]));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (travellerIds.length === 0) return;
    const trimmedTitle = title.trim();
    const trip = createTrip({
      household,
      householdId: household.id,
      travellerIds,
      startDate,
      endDate,
      mode,
      destinationKind,
      destinationLabel,
      laundryAccess,
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      notes: notes.trim(),
      tripId: newId('trip'),
      legId: newId('leg'),
      id: () => newId('pack'),
    });
    actions.saveTrip(trip);
    router.push(`/away/${trip.id}`);
  }

  return (
    <main className="shell">
      <TopBar title="Plan a trip" back="/away" />

      <form className="stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="dest">Where?</label>
          <input
            id="dest"
            className="input"
            value={destinationLabel}
            onChange={(e) => setDestinationLabel(e.target.value)}
            placeholder="Grandparents, Lisbon, campsite…"
            autoFocus
          />
        </div>

        <div className="field">
          <span className="label">What kind of place?</span>
          <div className="chips">
            {DESTINATION_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className="chip"
                aria-pressed={destinationKind === kind}
                onClick={() => setDestinationKind(kind)}
              >
                {DESTINATION_LABEL[kind]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">How are you getting there?</span>
          <div className="chips">
            {TRIP_MODES.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {TRIP_MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'end' }}>
          <div className="field grow">
            <label htmlFor="start">Leave</label>
            <input
              id="start"
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="field grow">
            <label htmlFor="end">Back</label>
            <input
              id="end"
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <span className="label">Who is going?</span>
          <span className="hint">Places stay home. People and pets can travel.</span>
          <div className="stack-tight" style={{ marginTop: 'var(--space-2)' }}>
            {travellers.map((subject) => {
              const on = travellerIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  className={`card card-link${on ? '' : ' muted'}`}
                  onClick={() => toggle(subject.id)}
                  aria-pressed={on}
                >
                  <div className="row">
                    <Badge subject={subject} />
                    <span className="grow">
                      <strong>{subjectLabel(subject)}</strong>
                      <span className="muted" style={{ display: 'block' }}>
                        {KIND_LABEL[subject.kind]}
                      </span>
                    </span>
                    <span aria-hidden="true">{on ? '✓' : ''}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <label className="row" style={{ gap: 'var(--space-3)' }}>
          <input
            type="checkbox"
            checked={laundryAccess}
            onChange={(e) => setLaundryAccess(e.target.checked)}
          />
          <span>
            There will be laundry
            <span className="muted" style={{ display: 'block' }}>
              Outfit counts use the longest stretch without washing.
            </span>
          </span>
        </label>

        <div className="field">
          <label htmlFor="title">Trip name (optional)</label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brittany weekend"
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the list should know"
          />
        </div>

        <button type="submit" className="btn" disabled={travellerIds.length === 0}>
          Build packing list
        </button>
      </form>
    </main>
  );
}
