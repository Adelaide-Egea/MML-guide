'use client';

import Link from 'next/link';
import {
  DESTINATION_LABEL,
  TRIP_MODE_LABEL,
  nightsBetween,
  packingProgress,
} from '@mml/core';
import { Empty, TopBar } from '../../components/Chrome.tsx';
import { useAppState } from '../../lib/store.ts';

export default function AwayList() {
  const { household, trips } = useAppState();
  const mine = trips.filter((t) => t.householdId === household.id);

  return (
    <main className="shell">
      <TopBar title="Away" back="/" />

      <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
        Packing for the people who are going — built from who is in this household, how long you are
        gone, and whether there is laundry.
      </p>

      {mine.length === 0 ? (
        <Empty>
          <p>No trips yet.</p>
          <Link href="/away/new" className="btn">
            Plan a trip
          </Link>
        </Empty>
      ) : (
        <section className="stack">
          {mine.map((trip) => {
            const progress = packingProgress(trip.items);
            const nights = nightsBetween(trip.startDate, trip.endDate);
            return (
              <Link key={trip.id} href={`/away/${trip.id}`} className="card card-link">
                <strong>{trip.title}</strong>
                <span className="muted" style={{ display: 'block' }}>
                  {DESTINATION_LABEL[trip.destinationKind]} · {TRIP_MODE_LABEL[trip.mode]} ·{' '}
                  {nights === 0 ? 'Same day' : `${nights} night${nights === 1 ? '' : 's'}`}
                </span>
                <span className="muted" style={{ display: 'block' }}>
                  {progress.packed}/{progress.total} packed
                </span>
              </Link>
            );
          })}
          <Link href="/away/new" className="btn">
            Plan a trip
          </Link>
        </section>
      )}
    </main>
  );
}
