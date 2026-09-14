'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  DESTINATION_LABEL,
  PACK_CATEGORIES,
  PACK_CATEGORY_LABEL,
  TRIP_MODE_LABEL,
  nightsBetween,
  packingProgress,
  subjectLabel,
  type PackCategory,
  type PackItem,
  type PackLeg,
} from '@mml/core';
import { Badge, Empty, TopBar } from '../../../components/Chrome.tsx';
import { newId } from '../../../lib/ids.ts';
import { useActions, useAppState } from '../../../lib/store.ts';

export default function TripPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { household, trips } = useAppState();
  const actions = useActions();
  const [leg, setLeg] = useState<PackLeg>('outbound');
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<PackCategory>('other');

  const trip = trips.find((t) => t.id === params.id);

  const travellers = useMemo(() => {
    if (!trip) return [];
    const wanted = new Set(trip.travellerIds);
    return household.subjects.filter((s) => wanted.has(s.id));
  }, [household.subjects, trip]);

  if (!trip || trip.householdId !== household.id) {
    return (
      <main className="shell">
        <TopBar title="Trip" back="/away" />
        <Empty>
          <p>This trip is not in this household.</p>
          <Link href="/away" className="btn btn-secondary">
            All trips
          </Link>
        </Empty>
      </main>
    );
  }

  // Narrowed for nested handlers — closures do not keep the early-return refinement.
  const active = trip;

  const items = active.items.filter((i) => i.leg === leg);
  const progress = packingProgress(active.items, leg);
  const nights = nightsBetween(active.startDate, active.endDate);
  const byCategory = PACK_CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  function togglePacked(item: PackItem) {
    actions.setPackItemPacked(active.id, item.id, !item.packed);
  }

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim()) return;
    const item: PackItem = {
      id: newId('pack'),
      label: newLabel.trim(),
      category: newCategory,
      forSubjectIds: [],
      qty: 1,
      packed: false,
      notes: '',
      leg,
    };
    actions.upsertPackItem(active.id, item);
    setNewLabel('');
    setAdding(false);
  }

  function whoLabel(item: PackItem): string {
    if (item.forSubjectIds.length === 0) return 'Shared';
    return item.forSubjectIds
      .map((id) => travellers.find((s) => s.id === id)?.name ?? 'Someone')
      .join(', ');
  }

  return (
    <main className="shell">
      <TopBar title={active.title} back="/away" />

      <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
        {DESTINATION_LABEL[active.destinationKind]}
        {active.destinationLabel ? ` · ${active.destinationLabel}` : ''} · {TRIP_MODE_LABEL[active.mode]} ·{' '}
        {active.startDate} → {active.endDate}
        {nights > 0 ? ` · ${nights} night${nights === 1 ? '' : 's'}` : ''}
      </p>

      {travellers.length > 0 && (
        <div
          className="row"
          style={{ flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}
        >
          {travellers.map((s) => (
            <span key={s.id} className="row" style={{ gap: '0.4rem' }}>
              <Badge subject={s} size={28} />
              <span>{subjectLabel(s)}</span>
            </span>
          ))}
        </div>
      )}

      {active.notes ? (
        <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
          {active.notes}
        </p>
      ) : null}

      <div className="chips" style={{ marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={leg === 'outbound'}
          onClick={() => setLeg('outbound')}
        >
          Packing to go
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={leg === 'return'}
          onClick={() => setLeg('return')}
        >
          Packing home
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 'var(--space-3)' }}>
        {progress.packed} of {progress.total} packed
      </p>

      <section className="stack">
        {byCategory.map(({ category, items: group }) => (
          <div key={category} className="stack-tight">
            <h2 className="eyebrow">{PACK_CATEGORY_LABEL[category]}</h2>
            {group.map((item) => (
              <label
                key={item.id}
                className="card row"
                style={{ gap: 'var(--space-3)', cursor: 'pointer' }}
              >
                <input type="checkbox" checked={item.packed} onChange={() => togglePacked(item)} />
                <span className="grow">
                  <strong style={{ textDecoration: item.packed ? 'line-through' : undefined }}>
                    {item.label}
                  </strong>
                  <span className="muted" style={{ display: 'block' }}>
                    {whoLabel(item)}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-quiet btn-inline"
                  aria-label={`Remove ${item.label}`}
                  onClick={(e) => {
                    e.preventDefault();
                    actions.removePackItem(active.id, item.id);
                  }}
                >
                  ×
                </button>
              </label>
            ))}
          </div>
        ))}
      </section>

      {adding ? (
        <form className="card stack" style={{ marginTop: 'var(--space-4)' }} onSubmit={addItem}>
          <div className="field">
            <label htmlFor="item-label">Add an item</label>
            <input
              id="item-label"
              className="input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="What to pack"
              autoFocus
            />
          </div>
          <div className="chips">
            {PACK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={newCategory === c}
                onClick={() => setNewCategory(c)}
              >
                {PACK_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="row">
            <button type="submit" className="btn" disabled={!newLabel.trim()}>
              Add
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-4)' }}
          onClick={() => setAdding(true)}
        >
          Add item
        </button>
      )}

      <button
        type="button"
        className="btn btn-quiet"
        style={{ marginTop: 'var(--space-5)' }}
        onClick={() => {
          actions.removeTrip(active.id);
          router.push('/away');
        }}
      >
        Delete trip
      </button>
    </main>
  );
}
