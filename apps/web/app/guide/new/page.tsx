'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  DEFAULT_EXPECTATION,
  chromeFor,
  createTrip,
  durationFromScenario,
  guideCoverage,
  type Handover,
  type Scenario,
  SCENARIOS,
} from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { LanguageToggle } from '../../../components/LanguageToggle.tsx';
import { newId } from '../../../lib/ids.ts';
import { useActions, useAppState } from '../../../lib/store.ts';

const SCENARIO_CARD: Record<
  Scenario,
  { label: string; icon: string; hint: string }
> = {
  evening: { label: 'Evening sitter', icon: '☽', hint: 'After dinner or bedtime' },
  fullday: { label: 'Full day', icon: '☀', hint: 'Meals, nap and pickup' },
  weekend: { label: 'Weekend', icon: '⌂', hint: 'A few days in this house' },
  cleaner: { label: 'Cleaner', icon: '◇', hint: 'Room by room' },
  petsitter: { label: 'Pet sitter', icon: '△', hint: 'Animals only' },
  goingtoyours: { label: 'Going to yours', icon: '→', hint: 'They travel to the caregiver' },
};

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

/** Who this scenario is about — chosen by the visit kind, not a multi-select. */
function subjectIdsForScenario(
  subjects: readonly { id: string; kind: string }[],
  scenario: Scenario,
): readonly string[] {
  switch (scenario) {
    case 'cleaner':
      return subjects.filter((s) => s.kind === 'place').map((s) => s.id);
    case 'petsitter':
      return subjects.filter((s) => s.kind === 'pet').map((s) => s.id);
    case 'goingtoyours':
      return subjects.filter((s) => s.kind !== 'place').map((s) => s.id);
    case 'evening':
    case 'fullday':
    case 'weekend':
      return subjects.filter((s) => s.kind === 'child').map((s) => s.id);
  }
}

function photoCountIn(subjects: readonly { entries: readonly { media: readonly unknown[] }[] }[]): number {
  let n = 0;
  for (const subject of subjects) {
    for (const entry of subject.entries) n += entry.media.length;
  }
  return n;
}

export default function NewGuide() {
  const router = useRouter();
  const { household } = useAppState();
  const actions = useActions();
  const chrome = chromeFor('en');

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [caregiverName, setCaregiverName] = useState('');
  const [language, setLanguage] = useState(
    typeof navigator === 'undefined' ? 'en' : navigator.language,
  );

  const subjectIds = useMemo(
    () => (scenario ? subjectIdsForScenario(household.subjects, scenario) : []),
    [household.subjects, scenario],
  );

  const previewHandover: Handover | null = useMemo(() => {
    if (!scenario) return null;
    return {
      id: 'preview',
      householdId: household.id,
      caregiverName: caregiverName.trim() || 'there',
      caregiverRelationship: '',
      scenario,
      duration: durationFromScenario(scenario),
      expectation: DEFAULT_EXPECTATION[scenario],
      language,
      subjectIds,
      importantNotes: [],
      extra: '',
      signOff: '',
      tripId: null,
      entryRecaps: {},
    };
  }, [scenario, household.id, caregiverName, language, subjectIds]);

  const coverage = previewHandover
    ? guideCoverage(household, previewHandover)
    : { covered: 0, total: 0, gaps: [] as readonly string[] };
  const photos = photoCountIn(
    household.subjects.filter((s) => subjectIds.length === 0 || subjectIds.includes(s.id)),
  );

  function create() {
    if (!scenario || !previewHandover) return;
    if (subjectIds.length === 0) return;

    let tripId: string | null = null;
    if (scenario === 'goingtoyours') {
      const start = todayISO();
      const end = addDaysISO(start, 2);
      const trip = createTrip({
        household,
        householdId: household.id,
        travellerIds: subjectIds,
        startDate: start,
        endDate: end,
        mode: 'car',
        destinationKind: 'family',
        destinationLabel: caregiverName.trim() || 'Yours',
        laundryAccess: true,
        title: `Going to ${caregiverName.trim() || 'yours'}`,
        tripId: newId('trip'),
        legId: newId('leg'),
        id: () => newId('pack'),
      });
      actions.saveTrip(trip);
      tripId = trip.id;
    }

    const handover: Handover = {
      ...previewHandover,
      id: newId('ho'),
      caregiverName: caregiverName.trim(),
      tripId,
    };
    actions.saveHandover(handover);
    router.push(`/guide/${handover.id}`);
  }

  if (!scenario) {
    return (
      <main className="shell">
        <TopBar title="New guide" back="/" />
        <h2 className="display" style={{ marginBottom: 'var(--space-2)' }}>
          What kind of visit?
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
          One choice. The guide follows from there.
        </p>
        <div className="scenario-grid">
          {SCENARIOS.map((id) => {
            const card = SCENARIO_CARD[id];
            return (
              <button
                key={id}
                type="button"
                className="scenario-card"
                onClick={() => setScenario(id)}
              >
                <span className="scenario-card-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <strong>{card.label}</strong>
                <span className="muted">{card.hint}</span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  const card = SCENARIO_CARD[scenario];
  const chipLabel =
    scenario === 'evening'
      ? chrome.scenarioEvening
      : scenario === 'fullday'
        ? chrome.scenarioFullDay
        : scenario === 'cleaner'
          ? chrome.scenarioCleaner
          : scenario === 'petsitter'
            ? chrome.scenarioPetSitter
            : scenario === 'goingtoyours'
              ? chrome.scenarioGoingToYours
              : chrome.scenarioWeekend;

  return (
    <main className="shell">
      <TopBar title="New guide" back="/" />

      <button
        type="button"
        className="btn btn-quiet btn-inline"
        style={{ marginBottom: 'var(--space-4)', textDecoration: 'underline' }}
        onClick={() => setScenario(null)}
      >
        Change visit kind
      </button>

      <section className="hotel-preview card stack" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="hotel-scenario" style={{ background: 'var(--surface-sunk)', alignSelf: 'flex-start' }}>
          {chipLabel}
        </span>
        <h2 className="display" style={{ fontSize: 'var(--text-xl)' }}>
          {chrome.helloName(caregiverName.trim() || 'there')}
        </h2>
        <p className="hotel-shape">{DEFAULT_EXPECTATION[scenario]}</p>
        <p className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {coverage.total} thing{coverage.total === 1 ? '' : 's'}, {photos} photo
          {photos === 1 ? '' : 's'}
        </p>
        {coverage.gaps.length > 0 ? (
          <div className="readiness-gaps">
            {coverage.gaps.map((gap) => {
              const subject = household.subjects.find((s) => gap.startsWith(`${s.name}:`));
              const href =
                gap === 'Caregiver name blank'
                  ? '#who'
                  : subject
                    ? `/subjects/${subject.id}`
                    : '/household';
              return (
                <Link key={gap} href={href} className="readiness-chip">
                  {gap}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="muted">Ready to send once you name who it is for.</p>
        )}
      </section>

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
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
          <span className="hint">
            {card.label}: looking after{' '}
            {subjectIds.length === 0
              ? 'nobody yet — add someone who matches this visit'
              : household.subjects
                  .filter((s) => subjectIds.includes(s.id))
                  .map((s) => s.name)
                  .join(', ')}
            .
          </span>
        </div>

        <div className="field">
          <label>Their language</label>
          <LanguageToggle value={language} onChange={setLanguage} />
        </div>

        <button type="submit" className="btn" disabled={subjectIds.length === 0}>
          Make the guide
        </button>
        {subjectIds.length === 0 && (
          <p className="hint" style={{ textAlign: 'center' }}>
            Add a {scenario === 'cleaner' ? 'place' : scenario === 'petsitter' ? 'pet' : 'child'} to
            this household first.
          </p>
        )}
      </form>
    </main>
  );
}
