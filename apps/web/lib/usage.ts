/** Anonymous usage counting — what the /admin dashboard reads.
 *
 *  What is stored, and nothing else:
 *  - the event name ("guide_created", "share"…)
 *  - a random device id generated in the browser (not linked to any person)
 *  - whether that device is a parent's or a caregiver's (from the page it was on)
 *  - the tester code from a ?trial= link, if there was one
 *  - for caregiver opens only: the guide's random id, so we can tell whether the
 *    same guide was opened on more than one day
 *
 *  Never: names, guide text, photos, Ask questions, IP addresses.
 *  Days are UTC. Daily keys expire after ~13 months.
 */

import type { Command, UsageStore } from './usage-store.ts';

export const USAGE_EVENTS = [
  'open',
  'sample',
  'guide_created',
  'guide',
  'share',
  'print',
  'caregiver_open',
  'ask',
  'welcome_home',
] as const;

export type UsageEvent = (typeof USAGE_EVENTS)[number];
export type Role = 'parent' | 'caregiver';

export const EVENT_LABELS: Record<UsageEvent, string> = {
  open: 'App opened',
  sample: 'Example loaded',
  guide_created: 'Guide created',
  guide: 'Guide viewed',
  share: 'Link sent',
  print: 'Printed',
  caregiver_open: 'Caregiver opened a guide',
  ask: 'Question asked',
  welcome_home: 'Welcome home',
};

const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;
const DEVICE = /^[A-Za-z0-9-]{8,40}$/;
const TOKEN = /^[A-Za-z0-9_-]{1,40}$/;

export interface UsageInput {
  readonly event: UsageEvent;
  readonly role: Role;
  readonly device: string | null;
  readonly trial: string | null;
  readonly ref: string | null;
}

/** Validates an untrusted beacon body. Returns null for anything malformed. */
export function parseUsageInput(body: unknown): UsageInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const event = b.event;
  if (typeof event !== 'string' || !(USAGE_EVENTS as readonly string[]).includes(event)) return null;
  if (typeof b.path === 'string' && b.path.length > 64) return null;

  const path = typeof b.path === 'string' ? b.path : '';
  const role: Role =
    b.role === 'caregiver' || b.role === 'parent'
      ? b.role
      : path === '/c' || path.startsWith('/c/')
        ? 'caregiver'
        : 'parent';

  const pick = (value: unknown, pattern: RegExp) =>
    typeof value === 'string' && pattern.test(value) ? value : null;

  return {
    event: event as UsageEvent,
    role: event === 'caregiver_open' ? 'caregiver' : role,
    device: pick(b.device, DEVICE),
    trial: pick(b.trial, TOKEN),
    ref: event === 'caregiver_open' ? pick(b.ref, TOKEN) : null,
  };
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lastDays(now: Date, count: number): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    days.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  }
  return days;
}

export async function recordUsage(store: UsageStore, input: UsageInput, now = new Date()) {
  const day = dayKey(now);
  const at = now.toISOString();
  const cmds: Command[] = [
    ['HINCRBY', `ev:${day}`, input.event, 1],
    ['EXPIRE', `ev:${day}`, DAY_TTL_SECONDS],
  ];
  if (input.device) {
    cmds.push(
      ['PFADD', `hu:${day}:${input.role}`, input.device],
      ['EXPIRE', `hu:${day}:${input.role}`, DAY_TTL_SECONDS],
      ['PFADD', `ua:${input.role}`, input.device],
    );
  }
  if (input.trial) {
    cmds.push(
      ['SADD', 'trials', input.trial],
      ['HINCRBY', `tr:${input.trial}`, input.event, 1],
      ['HSETNX', 'trf', input.trial, at],
      ['HSET', 'trl', input.trial, at],
    );
    if (input.device) cmds.push(['PFADD', `tru:${input.trial}`, input.device]);
  }
  if (input.event === 'caregiver_open' && input.ref) {
    cmds.push(['SADD', 'corefs', input.ref], ['SADD', `cod:${input.ref}`, day]);
  }
  await store.pipeline(cmds);
}

// ---------------------------------------------------------------------------

export interface UserCounts {
  readonly today: number;
  readonly last7: number;
  readonly last30: number;
  readonly allTime: number;
}

export interface DayRow {
  readonly day: string;
  readonly events: Partial<Record<UsageEvent, number>>;
  readonly parents: number;
  readonly caregivers: number;
}

export interface TrialRow {
  readonly code: string;
  readonly devices: number;
  readonly events: Partial<Record<UsageEvent, number>>;
  readonly firstSeen: string | null;
  readonly lastSeen: string | null;
}

export interface UsageStats {
  readonly durable: boolean;
  readonly generatedAt: string;
  readonly days: readonly DayRow[];
  readonly parents: UserCounts;
  readonly caregivers: UserCounts;
  /** Event totals over the 30-day window. */
  readonly totals30: Partial<Record<UsageEvent, number>>;
  /** All time: guides a caregiver opened at least once / on two or more days. */
  readonly guidesOpened: number;
  readonly guidesReopened: number;
  readonly trials: readonly TrialRow[];
}

function pairs(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(value)) {
    for (let i = 0; i + 1 < value.length; i += 2) out[String(value[i])] = String(value[i + 1]);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) out[k] = String(v);
  }
  return out;
}

function eventCounts(value: unknown): Partial<Record<UsageEvent, number>> {
  const out: Partial<Record<UsageEvent, number>> = {};
  for (const [k, v] of Object.entries(pairs(value))) {
    if ((USAGE_EVENTS as readonly string[]).includes(k)) out[k as UsageEvent] = Number(v) || 0;
  }
  return out;
}

const num = (v: unknown) => Number(v) || 0;
const strings = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

export async function readUsageStats(store: UsageStore, now = new Date()): Promise<UsageStats> {
  const days = lastDays(now, 30);
  const week = days.slice(-7);
  const today = days[days.length - 1]!;

  const first: Command[] = [
    ...days.map((d): Command => ['HGETALL', `ev:${d}`]),
    ...days.map((d): Command => ['PFCOUNT', `hu:${d}:parent`]),
    ...days.map((d): Command => ['PFCOUNT', `hu:${d}:caregiver`]),
    ['PFCOUNT', ...week.map((d) => `hu:${d}:parent`)],
    ['PFCOUNT', ...week.map((d) => `hu:${d}:caregiver`)],
    ['PFCOUNT', ...days.map((d) => `hu:${d}:parent`)],
    ['PFCOUNT', ...days.map((d) => `hu:${d}:caregiver`)],
    ['PFCOUNT', 'ua:parent'],
    ['PFCOUNT', 'ua:caregiver'],
    ['SMEMBERS', 'trials'],
    ['HGETALL', 'trf'],
    ['HGETALL', 'trl'],
    ['SMEMBERS', 'corefs'],
  ];
  const r = await store.pipeline(first);
  const n = days.length;

  const dayRows: DayRow[] = days.map((day, i) => ({
    day,
    events: eventCounts(r[i]),
    parents: num(r[n + i]),
    caregivers: num(r[2 * n + i]),
  }));
  let k = 3 * n;
  const p7 = num(r[k++]);
  const c7 = num(r[k++]);
  const p30 = num(r[k++]);
  const c30 = num(r[k++]);
  const pAll = num(r[k++]);
  const cAll = num(r[k++]);
  const trialCodes = strings(r[k++]).sort();
  const firstSeen = pairs(r[k++]);
  const lastSeen = pairs(r[k++]);
  const refs = strings(r[k++]).slice(0, 5000);

  const second: Command[] = [
    ...trialCodes.flatMap((code): Command[] => [
      ['HGETALL', `tr:${code}`],
      ['PFCOUNT', `tru:${code}`],
    ]),
    ...refs.map((ref): Command => ['SCARD', `cod:${ref}`]),
  ];
  const r2 = await store.pipeline(second);

  const trials: TrialRow[] = trialCodes.map((code, i) => ({
    code,
    events: eventCounts(r2[i * 2]),
    devices: num(r2[i * 2 + 1]),
    firstSeen: firstSeen[code] ?? null,
    lastSeen: lastSeen[code] ?? null,
  }));
  trials.sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));

  const openDays = r2.slice(trialCodes.length * 2).map(num);

  const totals30: Partial<Record<UsageEvent, number>> = {};
  for (const row of dayRows) {
    for (const [event, count] of Object.entries(row.events)) {
      totals30[event as UsageEvent] = (totals30[event as UsageEvent] ?? 0) + (count ?? 0);
    }
  }

  const todayRow = dayRows.find((row) => row.day === today)!;
  return {
    durable: store.durable,
    generatedAt: now.toISOString(),
    days: dayRows,
    parents: { today: todayRow.parents, last7: p7, last30: p30, allTime: pAll },
    caregivers: { today: todayRow.caregivers, last7: c7, last30: c30, allTime: cAll },
    totals30,
    guidesOpened: openDays.filter((d) => d >= 1).length,
    guidesReopened: openDays.filter((d) => d >= 2).length,
    trials,
  };
}
