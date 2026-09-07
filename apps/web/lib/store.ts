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
  type SubjectKind,
  EMPTY_SAFETY,
} from '@mml/core';
import { useCallback, useSyncExternalStore } from 'react';
import { newId } from './ids.ts';

const KEY = 'household-v1';

export interface AppState {
  readonly household: Household;
  readonly handovers: readonly Handover[];
}

/** Identity tokens, paired with a symbol so colour is never the only signal. */
export const IDENTITIES: readonly { token: string; symbol: string }[] = [
  { token: '--id-teal', symbol: '●' },
  { token: '--id-clay', symbol: '▲' },
  { token: '--id-indigo', symbol: '■' },
  { token: '--id-ochre', symbol: '◆' },
  { token: '--id-plum', symbol: '★' },
  { token: '--id-moss', symbol: '✚' },
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

function emptyState(): AppState {
  return {
    household: {
      id: newId('hh'),
      name: '',
      country: '',
      subjects: [],
      contacts: [],
      routine: [],
    },
    handovers: [],
  };
}

// ── The store ────────────────────────────────────────────────────────────────

let state: AppState | null = null;
const listeners = new Set<() => void>();

function read(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as AppState) : emptyState();
  } catch {
    // A corrupt blob is recoverable by starting over; a crash on boot is not.
    state = emptyState();
  }
  return state;
}

function save(next: AppState): void {
  state = next;
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
const SERVER_STATE: AppState = {
  household: { id: 'ssr', name: '', country: '', subjects: [], contacts: [], routine: [] },
  handovers: [],
};

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, read, () => SERVER_STATE);
}

export function useActions() {
  const update = useCallback((fn: (current: AppState) => AppState) => {
    save(fn(read()));
  }, []);

  return useCallback(
    () => ({
      // ── Household ──────────────────────────────────────────────────────────
      setHousehold(patch: Partial<Pick<Household, 'name' | 'country'>>) {
        update((s) => ({ ...s, household: { ...s.household, ...patch } }));
      },

      // ── Subjects ───────────────────────────────────────────────────────────
      addSubject(kind: SubjectKind, name: string): string {
        const id = newId('sub');
        update((s) => {
          const identity = IDENTITIES[s.household.subjects.length % IDENTITIES.length]!;
          const subject: CareSubject = {
            id,
            kind,
            name,
            descriptor: '',
            identity: { colourToken: identity.token, symbol: identity.symbol },
            safety: EMPTY_SAFETY,
            entries: [],
          };
          return {
            ...s,
            household: { ...s.household, subjects: [...s.household.subjects, subject] },
          };
        });
        return id;
      },

      updateSubject(id: string, patch: Partial<CareSubject>) {
        update((s) => ({
          ...s,
          household: {
            ...s.household,
            subjects: s.household.subjects.map((sub) =>
              sub.id === id ? { ...sub, ...patch } : sub,
            ),
          },
        }));
      },

      removeSubject(id: string) {
        update((s) => ({
          ...s,
          household: {
            ...s.household,
            subjects: s.household.subjects.filter((sub) => sub.id !== id),
            // A routine item pointing at a deleted subject fails validation, so it
            // goes with them rather than blocking every future guide.
            routine: s.household.routine.filter((item) => item.appliesTo !== id),
          },
          handovers: s.handovers.map((h) => ({
            ...h,
            subjectIds: h.subjectIds.filter((sid) => sid !== id),
          })),
        }));
      },

      // ── Entries ────────────────────────────────────────────────────────────
      upsertEntry(subjectId: string, entry: Entry) {
        update((s) => ({
          ...s,
          household: {
            ...s.household,
            subjects: s.household.subjects.map((sub) => {
              if (sub.id !== subjectId) return sub;
              const exists = sub.entries.some((e) => e.id === entry.id);
              return {
                ...sub,
                entries: exists
                  ? sub.entries.map((e) => (e.id === entry.id ? entry : e))
                  : [...sub.entries, entry],
              };
            }),
          },
        }));
      },

      removeEntry(subjectId: string, entryId: string) {
        update((s) => ({
          ...s,
          household: {
            ...s.household,
            subjects: s.household.subjects.map((sub) =>
              sub.id === subjectId
                ? { ...sub, entries: sub.entries.filter((e) => e.id !== entryId) }
                : sub,
            ),
          },
        }));
      },

      // ── Contacts and routine ───────────────────────────────────────────────
      upsertContact(contact: Contact) {
        update((s) => {
          const exists = s.household.contacts.some((c) => c.id === contact.id);
          return {
            ...s,
            household: {
              ...s.household,
              contacts: exists
                ? s.household.contacts.map((c) => (c.id === contact.id ? contact : c))
                : [...s.household.contacts, contact],
            },
          };
        });
      },

      removeContact(id: string) {
        update((s) => ({
          ...s,
          household: {
            ...s.household,
            contacts: s.household.contacts.filter((c) => c.id !== id),
          },
        }));
      },

      upsertRoutine(item: RoutineItem) {
        update((s) => {
          const exists = s.household.routine.some((r) => r.id === item.id);
          return {
            ...s,
            household: {
              ...s.household,
              routine: exists
                ? s.household.routine.map((r) => (r.id === item.id ? item : r))
                : [...s.household.routine, item],
            },
          };
        });
      },

      removeRoutine(id: string) {
        update((s) => ({
          ...s,
          household: { ...s.household, routine: s.household.routine.filter((r) => r.id !== id) },
        }));
      },

      // ── Handovers ──────────────────────────────────────────────────────────
      saveHandover(handover: Handover) {
        update((s) => {
          const exists = s.handovers.some((h) => h.id === handover.id);
          return {
            ...s,
            handovers: exists
              ? s.handovers.map((h) => (h.id === handover.id ? handover : h))
              : [...s.handovers, handover],
          };
        });
      },

      removeHandover(id: string) {
        update((s) => ({ ...s, handovers: s.handovers.filter((h) => h.id !== id) }));
      },

      replaceAll(next: AppState) {
        update(() => next);
      },
    }),
    [update],
  )();
}

export function resolveColour(token: string): string {
  return `var(${token})`;
}
