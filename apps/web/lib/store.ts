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
  type RoutineItem,
  type RoutinePreset,
  type SubjectKind,
  EMPTY_SAFETY,
  instantiatePreset,
  presetFromRoutine,
} from '@mml/core';
import { useCallback, useSyncExternalStore } from 'react';
import { newId } from './ids.ts';

const KEY = 'household-v1';

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

/** Identity tokens, paired with a symbol so colour is never the only signal. */
export const IDENTITIES: readonly { token: string; symbol: string }[] = [
  { token: '--id-petrol', symbol: '●' },
  { token: '--id-clay', symbol: '▲' },
  { token: '--id-indigo', symbol: '■' },
  { token: '--id-olive', symbol: '◆' },
  { token: '--id-plum', symbol: '★' },
  { token: '--id-forest', symbol: '✚' },
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
    presets: [],
    sampleId: null,
  };
}

/** The shape stored before households were plural. */
interface StoredV1 {
  readonly household?: Household;
  readonly handovers?: readonly Handover[];
  readonly presets?: readonly RoutinePreset[];
  readonly sample?: boolean;
}

function migrate(parsed: Partial<Stored> & StoredV1): Stored {
  if (parsed.households) return { ...emptyState(), ...(parsed as Partial<Stored>) } as Stored;
  const household = parsed.household ?? emptyHousehold();
  return {
    households: [household],
    activeId: household.id,
    handovers: parsed.handovers ?? [],
    presets: parsed.presets ?? [],
    sampleId: parsed.sample ? household.id : null,
  };
}

/** A household nobody has touched.
 *
 *  Adding a second household when the first is still the blank one the app created
 *  on boot leaves a permanent "Unnamed household · 0 to look after" in the switcher.
 *  Nothing is lost by dropping it, because there is nothing in it. */
function untouched(household: Household, handovers: readonly Handover[]): boolean {
  return (
    household.name.trim() === '' &&
    household.subjects.length === 0 &&
    household.contacts.length === 0 &&
    household.routine.length === 0 &&
    !handovers.some((h) => h.householdId === household.id)
  );
}

function prune(households: readonly Household[], keepId: string, handovers: readonly Handover[]) {
  const kept = households.filter((h) => h.id === keepId || !untouched(h, handovers));
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

function read(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = derive(raw ? migrate(JSON.parse(raw)) : emptyState());
  } catch {
    // A corrupt blob is recoverable by starting over; a crash on boot is not.
    state = derive(emptyState());
  }
  return state;
}

function save(next: Stored): void {
  state = derive(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
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

      /** Adds a household and selects it. Nothing that already exists is touched,
       *  which is the whole point: the sample stays where it is. */
      addHousehold(name = ''): string {
        const household = emptyHousehold(name);
        update((s) => ({
          ...s,
          households: prune([...s.households, household], household.id, s.handovers),
          activeId: household.id,
        }));
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
            sampleId: s.sampleId === id ? null : s.sampleId,
          };
        });
      },

      /** Adds the demo alongside whatever is already there and switches to it. */
      addSample(household: Household, handover: Handover, presets: readonly RoutinePreset[]) {
        update((s) => {
          const already = s.households.some((h) => h.id === household.id);
          return {
            ...s,
            households: prune(
              already ? s.households : [...s.households, household],
              household.id,
              s.handovers,
            ),
            activeId: household.id,
            handovers: s.handovers.some((h) => h.id === handover.id)
              ? s.handovers
              : [...s.handovers, handover],
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
    }),
    [update, patch],
  )();
}

export function resolveColour(token: string): string {
  return `var(${token})`;
}
