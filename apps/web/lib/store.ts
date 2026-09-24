'use client';

// Local-first storage.
//
// Everything lives on the device. That is not a placeholder for a real backend so
// much as the correct default: the app is useful on the first run with no account,
// no network and no credentials, and the parent's household — which contains their
// children's medical information — is not sent anywhere until they ask for it.
//
// The seam for sync is `save`. When a server exists, it writes through here.

import {
  type CareSubject,
  type Contact,
  type Entry,
  type Handover,
  type Household,
  type PackItem,
  type RoutineItem,
  type RoutinePreset,
  type SubjectKind,
  type Trip,
  EMPTY_SAFETY,
  instantiatePreset,
  normalizeHandover,
  normalizeTrip,
  presetFromRoutine,
} from '@mml/core';
import { useCallback, useSyncExternalStore } from 'react';
import { newId } from './ids.ts';

const KEY = 'household-v1';
/** Last-known-good copy — written before each save so a bad migrate cannot wipe people. */
const BACKUP_KEY = 'household-v1.bak';

/** What is written to disk.
 *
 *  Households are plural because a household is a place with people in it, and
 *  people have two of those more often than the singular version admits: the flat
 *  and the grandparents' house, the family home and the one they let out. The
 *  sample is one of them rather than a mode the app is in, which is the only way
 *  "look around first" can be undone without destroying anything.
 */
interface Stored {
  readonly households: readonly Household[];
  readonly activeId: string;
  /** Every guide across every household. Each one names the household it belongs
   *  to, so a link to a guide resolves without depending on what is selected. */
  readonly handovers: readonly Handover[];
  /** Trips / packing lists for the Away surface. Same ownership rule as guides. */
  readonly trips: readonly Trip[];
  /** Only the parent's own presets. The built-in ones live in core and are not
   *  copied into storage, so improving them does not require a migration. */
  readonly presets: readonly RoutinePreset[];
  /** Which household is the demo, if it is still around. */
  readonly sampleId: string | null;
}

export interface AppState extends Stored {
  /** The selected household, resolved once here so that the pages that only ever
   *  care about one do not each have to do the lookup. */
  readonly household: Household;
}

/** Identity tokens — tint background + matching ink. Colour never travels alone. */
export const IDENTITIES: readonly { token: string; ink: string; symbol: string }[] = [
  { token: '--id-dusk', ink: '--id-dusk-ink', symbol: '●' },
  { token: '--id-terracotta', ink: '--id-terracotta-ink', symbol: '▲' },
  { token: '--id-sage', ink: '--id-sage-ink', symbol: '■' },
  { token: '--id-clay', ink: '--id-clay-ink', symbol: '◆' },
  { token: '--id-plum', ink: '--id-plum-ink', symbol: '★' },
  { token: '--id-honey', ink: '--id-honey-ink', symbol: '✚' },
];

export const KIND_LABEL: Record<SubjectKind, string> = {
  child: 'Child',
  pet: 'Pet',
  place: 'Place',
};

export const KIND_HINT: Record<SubjectKind, string> = {
  child: 'A child someone will be looking after.',
  pet: 'A dog, cat, rabbit — anything that needs feeding.',
  place: 'The flat, the plants, the boiler. Anything without a pulse.',
};

export function emptyHousehold(name = ''): Household {
  return { id: newId('hh'), name, country: '', subjects: [], contacts: [], routine: [] };
}

function emptyState(): Stored {
  const household = emptyHousehold();
  return {
    households: [household],
    activeId: household.id,
    handovers: [],
    trips: [],
    presets: [],
    sampleId: null,
  };
}

/** The shape stored before households were plural. */
interface StoredV1 {
  readonly household?: Household;
  readonly handovers?: readonly Handover[];
  readonly trips?: readonly Trip[];
  readonly presets?: readonly RoutinePreset[];
  readonly sample?: boolean;
}

/** Lift older shapes into the current Stored form without dropping what people saved.
 *
 *  Rules:
 *  - Always start from emptyState defaults (additive fields get a safe empty value).
 *  - Prefer existing arrays/ids over inventing new ones.
 *  - Never invent a wipe: a missing `trips` becomes `[]`, not a blank household.
 *  - Unknown top-level keys are ignored on write (canonical save), so upgrades stay
 *    forward-compatible without accumulating junk forever.
 */
export function migrate(parsed: Partial<Stored> & StoredV1): Stored {
  const defaults = emptyState();

  const handovers = (parsed.handovers ?? defaults.handovers).map((h) =>
    normalizeHandover(h as Handover),
  );
  const trips = (parsed.trips ?? defaults.trips).map((t) => normalizeTrip(t as Trip));

  if (parsed.households && parsed.households.length > 0) {
    const households = parsed.households;
    const activeId =
      typeof parsed.activeId === 'string' && households.some((h) => h.id === parsed.activeId)
        ? parsed.activeId
        : households[0]!.id;
    return {
      households,
      activeId,
      handovers,
      trips,
      presets: parsed.presets ?? defaults.presets,
      sampleId:
        parsed.sampleId === undefined
          ? defaults.sampleId
          : parsed.sampleId,
    };
  }

  // Pre-plural shape: a single `household` field.
  const household = parsed.household ?? defaults.households[0] ?? emptyHousehold();
  return {
    households: [household],
    activeId: household.id,
    handovers: (parsed.handovers ?? []).map((h) => normalizeHandover(h as Handover)),
    trips: (parsed.trips ?? []).map((t) => normalizeTrip(t as Trip)),
    presets: parsed.presets ?? [],
    sampleId: parsed.sample ? household.id : parsed.sampleId ?? null,
  };
}

function canonical(stored: Stored): Stored {
  return {
    households: stored.households,
    activeId: stored.activeId,
    handovers: stored.handovers,
    trips: stored.trips ?? [],
    presets: stored.presets,
    sampleId: stored.sampleId,
  };
}

/** A household nobody has touched.
 *
 *  Adding a second household when the first is still the blank one the app created
 *  on boot leaves a permanent "Unnamed household · 0 to look after" in the switcher.
 *  Nothing is lost by dropping it, because there is nothing in it. */
function untouched(
  household: Household,
  handovers: readonly Handover[],
  trips: readonly Trip[],
): boolean {
  return (
    household.name.trim() === '' &&
    household.subjects.length === 0 &&
    household.contacts.length === 0 &&
    household.routine.length === 0 &&
    !handovers.some((h) => h.householdId === household.id) &&
    !trips.some((t) => t.householdId === household.id)
  );
}

function prune(
  households: readonly Household[],
  keepId: string,
  handovers: readonly Handover[],
  trips: readonly Trip[],
) {
  const kept = households.filter((h) => h.id === keepId || !untouched(h, handovers, trips));
  return kept.length > 0 ? kept : households;
}

function derive(stored: Stored): AppState {
  // Falling back rather than throwing: a dangling activeId is recoverable and a
  // blank screen is not.
  const household =
    stored.households.find((h) => h.id === stored.activeId) ??
    stored.households[0] ??
    emptyHousehold();
  return { ...stored, household };
}

// ── The store ────────────────────────────────────────────────────────────────

let state: AppState | null = null;
const listeners = new Set<() => void>();

function readFrom(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    return derive(migrate(JSON.parse(raw)));
  } catch {
    return null;
  }
}

function read(): AppState {
  if (state) return state;
  try {
    const primary = readFrom(localStorage.getItem(KEY));
    if (primary) {
      state = primary;
      return state;
    }
    // Primary missing or unreadable — try the last-known-good backup before wiping.
    const backup = readFrom(localStorage.getItem(BACKUP_KEY));
    if (backup) {
      state = backup;
      try {
        localStorage.setItem(KEY, JSON.stringify(canonical(backup)));
      } catch {
        // Still usable in memory even if we cannot restore the primary key.
      }
      return state;
    }
  } catch {
    // Fall through to empty.
  }
  // Only reach here when both primary and backup are gone or unreadable.
  state = derive(emptyState());
  return state;
}

function save(next: Stored): void {
  const stored = canonical(next);
  state = derive(stored);
  try {
    // Preserve the previous good blob before overwriting, so a future bad write or
    // migrate never leaves the parent with nothing.
    const previous = localStorage.getItem(KEY);
    if (previous) {
      try {
        localStorage.setItem(BACKUP_KEY, previous);
      } catch {
        // Backup is best-effort; a full quota should not block the real save.
      }
    }
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Quota exceeded. The in-memory state is still correct, so the session keeps
    // working and only persistence is lost.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The server renders with an empty household. Returning a stable object rather than
// building one per call matters: useSyncExternalStore compares by identity and a
// fresh object every time is an infinite render loop.
const SSR_HOUSEHOLD: Household = {
  id: 'ssr',
  name: '',
  country: '',
  subjects: [],
  contacts: [],
  routine: [],
};

const SERVER_STATE: AppState = {
  households: [SSR_HOUSEHOLD],
  activeId: 'ssr',
  household: SSR_HOUSEHOLD,
  handovers: [],
  trips: [],
  presets: [],
  sampleId: null,
};

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, read, () => SERVER_STATE);
}

export function useActions() {
  const update = useCallback((fn: (current: AppState) => Stored) => {
    save(fn(read()));
  }, []);

  /** Most actions change one household — the selected one — and leave the rest
   *  alone. Written once here so that every action below reads as if there were
   *  still only one. */
  const patch = useCallback(
    (fn: (household: Household, current: AppState) => Household) => {
      update((s) => ({
        ...s,
        households: s.households.map((h) => (h.id === s.household.id ? fn(h, s) : h)),
      }));
    },
    [update],
  );

  return useCallback(
    () => ({
      // ── Households ─────────────────────────────────────────────────────────
      setHousehold(fields: Partial<Pick<Household, 'name' | 'country'>>) {
        patch((h) => ({ ...h, ...fields }));
      },

      /** Adds a real household and selects it.
       *
       *  If the sample was the active household, it is removed — the sample is an
       *  example to look around, not a second house that should linger in the list.
       */
      addHousehold(name = ''): string {
        const household = emptyHousehold(name);
        update((s) => {
          const leavingSample = Boolean(s.sampleId && s.activeId === s.sampleId);
          const base = leavingSample
            ? s.households.filter((h) => h.id !== s.sampleId)
            : s.households;
          const sampleId = leavingSample ? null : s.sampleId;
          return {
            ...s,
            households: prune([...base, household], household.id, s.handovers, s.trips),
            activeId: household.id,
            handovers: leavingSample
              ? s.handovers.filter((ho) => ho.householdId !== s.sampleId)
              : s.handovers,
            trips: leavingSample ? s.trips.filter((t) => t.householdId !== s.sampleId) : s.trips,
            sampleId,
          };
        });
        return household.id;
      },

      selectHousehold(id: string) {
        update((s) => (s.households.some((h) => h.id === id) ? { ...s, activeId: id } : s));
      },

      removeHousehold(id: string) {
        update((s) => {
          // Never leave nothing selected, and never leave nothing to select.
          const remaining = s.households.filter((h) => h.id !== id);
          const households = remaining.length > 0 ? remaining : [emptyHousehold()];
          return {
            ...s,
            households,
            activeId: s.activeId === id ? households[0]!.id : s.activeId,
            handovers: s.handovers.filter((ho) => ho.householdId !== id),
            trips: s.trips.filter((t) => t.householdId !== id),
            sampleId: s.sampleId === id ? null : s.sampleId,
          };
        });
      },

      /** Dismiss the example household. Same as removeHousehold(sampleId). */
      removeSample() {
        update((s) => {
          if (!s.sampleId) return s;
          const id = s.sampleId;
          const remaining = s.households.filter((h) => h.id !== id);
          const households = remaining.length > 0 ? remaining : [emptyHousehold()];
          return {
            ...s,
            households,
            activeId: s.activeId === id ? households[0]!.id : s.activeId,
            handovers: s.handovers.filter((ho) => ho.householdId !== id),
            trips: s.trips.filter((t) => t.householdId !== id),
            sampleId: null,
          };
        });
      },

      /** Adds the demo alongside whatever is already there and switches to it. */
      addSample(
        household: Household,
        handover: Handover,
        presets: readonly RoutinePreset[],
        trips: readonly Trip[] = [],
      ) {
        update((s) => {
          const already = s.households.some((h) => h.id === household.id);
          const tripIds = new Set(s.trips.map((t) => t.id));
          return {
            ...s,
            households: prune(
              already ? s.households : [...s.households, household],
              household.id,
              s.handovers,
              s.trips,
            ),
            activeId: household.id,
            handovers: s.handovers.some((h) => h.id === handover.id)
              ? s.handovers
              : [...s.handovers, handover],
            trips: [...s.trips, ...trips.filter((t) => !tripIds.has(t.id))],
            presets: [
              ...s.presets,
              ...presets.filter((p) => !s.presets.some((q) => q.id === p.id)),
            ],
            sampleId: household.id,
          };
        });
      },

      // ── Subjects ───────────────────────────────────────────────────────────
      addSubject(kind: SubjectKind, name: string): string {
        const id = newId('sub');
        patch((h) => {
          const identity = IDENTITIES[h.subjects.length % IDENTITIES.length]!;
          const subject: CareSubject = {
            id,
            kind,
            name,
            descriptor: '',
            identity: { colourToken: identity.token, symbol: identity.symbol },
            safety: EMPTY_SAFETY,
            entries: [],
          };
          return { ...h, subjects: [...h.subjects, subject] };
        });
        return id;
      },

      updateSubject(id: string, fields: Partial<CareSubject>) {
        patch((h) => ({
          ...h,
          subjects: h.subjects.map((sub) => (sub.id === id ? { ...sub, ...fields } : sub)),
        }));
      },

      removeSubject(id: string) {
        update((s) => ({
          ...s,
          households: s.households.map((h) =>
            h.id === s.household.id
              ? {
                  ...h,
                  subjects: h.subjects.filter((sub) => sub.id !== id),
                  // A routine item pointing at a deleted subject fails validation,
                  // so it goes with them rather than blocking every future guide.
                  routine: h.routine.filter((item) => item.appliesTo !== id),
                }
              : h,
          ),
          handovers: s.handovers.map((ho) =>
            ho.householdId === s.household.id
              ? { ...ho, subjectIds: ho.subjectIds.filter((sid) => sid !== id) }
              : ho,
          ),
          trips: s.trips.map((trip) =>
            trip.householdId === s.household.id
              ? {
                  ...trip,
                  travellerIds: trip.travellerIds.filter((sid) => sid !== id),
                  legs: trip.legs.map((leg) => ({
                    ...leg,
                    travellerIds: leg.travellerIds.filter((sid) => sid !== id),
                  })),
                  items: trip.items.map((item) => ({
                    ...item,
                    forSubjectIds: item.forSubjectIds.filter((sid) => sid !== id),
                  })),
                }
              : trip,
          ),
        }));
      },

      // ── Entries ────────────────────────────────────────────────────────────
      upsertEntry(subjectId: string, entry: Entry) {
        patch((h) => ({
          ...h,
          subjects: h.subjects.map((sub) => {
            if (sub.id !== subjectId) return sub;
            const exists = sub.entries.some((e) => e.id === entry.id);
            return {
              ...sub,
              entries: exists
                ? sub.entries.map((e) => (e.id === entry.id ? entry : e))
                : [...sub.entries, entry],
            };
          }),
        }));
      },

      removeEntry(subjectId: string, entryId: string) {
        patch((h) => ({
          ...h,
          subjects: h.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, entries: sub.entries.filter((e) => e.id !== entryId) }
              : sub,
          ),
        }));
      },

      // ── Contacts and routine ───────────────────────────────────────────────
      upsertContact(contact: Contact) {
        patch((h) => ({
          ...h,
          contacts: h.contacts.some((c) => c.id === contact.id)
            ? h.contacts.map((c) => (c.id === contact.id ? contact : c))
            : [...h.contacts, contact],
        }));
      },

      removeContact(id: string) {
        patch((h) => ({ ...h, contacts: h.contacts.filter((c) => c.id !== id) }));
      },

      upsertRoutine(item: RoutineItem) {
        patch((h) => ({
          ...h,
          routine: h.routine.some((r) => r.id === item.id)
            ? h.routine.map((r) => (r.id === item.id ? item : r))
            : [...h.routine, item],
        }));
      },

      removeRoutine(id: string) {
        patch((h) => ({ ...h, routine: h.routine.filter((r) => r.id !== id) }));
      },

      // ── Presets ────────────────────────────────────────────────────────────

      /** Presets are deliberately not scoped to a household. A routine that worked
       *  for the first child works for the second wherever they sleep. */
      applyPreset(preset: RoutinePreset, subjectId: string) {
        patch((h) => ({
          ...h,
          routine: [...h.routine, ...instantiatePreset(preset, subjectId, () => newId('r'))],
        }));
      },

      savePreset(label: string, kind: SubjectKind, subjectId: string) {
        update((s) => ({
          ...s,
          presets: [
            ...s.presets,
            presetFromRoutine(label, kind, s.household.routine, subjectId, newId('preset')),
          ],
        }));
      },

      removePreset(id: string) {
        update((s) => ({ ...s, presets: s.presets.filter((p) => p.id !== id) }));
      },

      /** Removes every routine item belonging to one subject. Applying a preset on
       *  top of an existing routine is usually a mistake rather than an intent, so
       *  the interface offers this next to it. */
      clearRoutine(subjectId: string) {
        patch((h) => ({ ...h, routine: h.routine.filter((r) => r.appliesTo !== subjectId) }));
      },

      // ── Handovers ──────────────────────────────────────────────────────────
      saveHandover(handover: Handover) {
        update((s) => ({
          ...s,
          handovers: s.handovers.some((h) => h.id === handover.id)
            ? s.handovers.map((h) => (h.id === handover.id ? handover : h))
            : [...s.handovers, handover],
        }));
      },

      removeHandover(id: string) {
        update((s) => ({ ...s, handovers: s.handovers.filter((h) => h.id !== id) }));
      },

      // ── Trips (Away / packing) ──────────────────────────────────────────────
      saveTrip(trip: Trip) {
        update((s) => ({
          ...s,
          trips: s.trips.some((t) => t.id === trip.id)
            ? s.trips.map((t) => (t.id === trip.id ? trip : t))
            : [...s.trips, trip],
        }));
      },

      removeTrip(id: string) {
        update((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
      },

      setPackItemPacked(tripId: string, itemId: string, packed: boolean) {
        update((s) => ({
          ...s,
          trips: s.trips.map((trip) => {
            if (trip.id !== tripId) return trip;
            return {
              ...trip,
              updatedAt: new Date().toISOString(),
              items: trip.items.map((item) =>
                item.id === itemId ? { ...item, packed } : item,
              ),
            };
          }),
        }));
      },

      upsertPackItem(tripId: string, item: PackItem) {
        update((s) => ({
          ...s,
          trips: s.trips.map((trip) => {
            if (trip.id !== tripId) return trip;
            const exists = trip.items.some((i) => i.id === item.id);
            return {
              ...trip,
              updatedAt: new Date().toISOString(),
              items: exists
                ? trip.items.map((i) => (i.id === item.id ? item : i))
                : [...trip.items, item],
            };
          }),
        }));
      },

      removePackItem(tripId: string, itemId: string) {
        update((s) => ({
          ...s,
          trips: s.trips.map((trip) =>
            trip.id !== tripId
              ? trip
              : {
                  ...trip,
                  updatedAt: new Date().toISOString(),
                  items: trip.items.filter((i) => i.id !== itemId),
                },
          ),
        }));
      },
    }),
    [update, patch],
  )();
}

export function resolveColour(token: string): string {
  return `var(${token})`;
}
