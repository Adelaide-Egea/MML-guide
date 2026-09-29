import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminPassword, adminToken, safeEqual } from './admin-auth.ts';
import { lastDays, parseUsageInput, readUsageStats, recordUsage } from './usage.ts';
import { memoryStore, redisConfigFromEnv, redisStore } from './usage-store.ts';

const DAY = 86_400_000;
const now = new Date('2026-09-29T12:00:00Z');

test('parseUsageInput rejects unknown events and anything that looks like content', () => {
  assert.equal(parseUsageInput({ event: 'hack' }), null);
  assert.equal(parseUsageInput(null), null);
  assert.equal(parseUsageInput({ event: 'open', path: 'x'.repeat(65) }), null);
  const input = parseUsageInput({
    event: 'open',
    device: 'not a valid id!',
    trial: 'anna',
    path: '/c',
  });
  assert.deepEqual(input, { event: 'open', role: 'caregiver', device: null, trial: 'anna', ref: null });
});

test('parseUsageInput keeps ref only for caregiver opens', () => {
  const open = parseUsageInput({ event: 'caregiver_open', ref: 'ho_123', device: 'abcd-1234-efgh' });
  assert.equal(open?.ref, 'ho_123');
  assert.equal(open?.role, 'caregiver');
  const other = parseUsageInput({ event: 'share', ref: 'ho_123' });
  assert.equal(other?.ref, null);
  assert.equal(other?.role, 'parent');
});

test('lastDays returns oldest first, ending today', () => {
  const days = lastDays(now, 3);
  assert.deepEqual(days, ['2026-09-27', '2026-09-28', '2026-09-29']);
});

test('records and reads back users, events, testers and reopened guides', async () => {
  const store = memoryStore();
  const rec = (body: Record<string, unknown>, at: Date) =>
    recordUsage(store, parseUsageInput(body)!, at);

  // Parent A (tester anna) on two days, parent B once, one caregiver.
  await rec({ event: 'open', device: 'parent-aaaa', trial: 'anna', path: '/' }, new Date(now.getTime() - 10 * DAY));
  await rec({ event: 'guide_created', device: 'parent-aaaa', trial: 'anna', path: '/guide' }, new Date(now.getTime() - 10 * DAY));
  await rec({ event: 'share', device: 'parent-aaaa', trial: 'anna', path: '/guide' }, new Date(now.getTime() - 10 * DAY));
  await rec({ event: 'open', device: 'parent-aaaa', trial: 'anna', path: '/' }, now);
  await rec({ event: 'open', device: 'parent-bbbb', path: '/' }, now);
  await rec({ event: 'sample', device: 'parent-bbbb', path: '/' }, now);
  await rec({ event: 'caregiver_open', device: 'carer-cccc', ref: 'ho_1', path: '/c' }, new Date(now.getTime() - 10 * DAY));
  await rec({ event: 'caregiver_open', device: 'carer-cccc', ref: 'ho_1', path: '/c' }, new Date(now.getTime() - 9 * DAY));
  await rec({ event: 'caregiver_open', device: 'carer-dddd', ref: 'ho_2', path: '/c' }, now);
  await rec({ event: 'caregiver_open', device: 'carer-dddd', ref: 'ho_2', path: '/c' }, now);

  const stats = await readUsageStats(store, now);
  assert.equal(stats.durable, false);
  assert.equal(stats.days.length, 30);
  assert.deepEqual(stats.parents, { today: 2, last7: 2, last30: 2, allTime: 2 });
  assert.deepEqual(stats.caregivers, { today: 1, last7: 1, last30: 2, allTime: 2 });
  assert.equal(stats.totals30.guide_created, 1);
  assert.equal(stats.totals30.share, 1);
  assert.equal(stats.totals30.open, 3);
  assert.equal(stats.guidesOpened, 2);
  assert.equal(stats.guidesReopened, 1, 'ho_2 was opened twice but on the same day');
  assert.equal(stats.trials.length, 1);
  const anna = stats.trials[0]!;
  assert.equal(anna.code, 'anna');
  assert.equal(anna.devices, 1);
  assert.equal(anna.events.open, 2);
  assert.equal(anna.firstSeen, new Date(now.getTime() - 10 * DAY).toISOString());
  assert.equal(anna.lastSeen, now.toISOString());
});

test('empty store reads as zeros', async () => {
  const stats = await readUsageStats(memoryStore(), now);
  assert.equal(stats.parents.allTime, 0);
  assert.equal(stats.trials.length, 0);
  assert.equal(stats.guidesOpened, 0);
});

test('redisStore sends one pipeline request with bearer auth and maps errors to null', async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify([{ result: 3 }, { error: 'WRONGTYPE' }]), { status: 200 });
  }) as unknown as typeof fetch;
  const store = redisStore('https://example.upstash.io', 'tok', fakeFetch);
  const out = await store.pipeline([
    ['HINCRBY', 'ev:2026-09-29', 'open', 1],
    ['PFCOUNT', 'x'],
  ]);
  assert.deepEqual(out, [3, null]);
  assert.equal(seen!.url, 'https://example.upstash.io/pipeline');
  assert.equal((seen!.init.headers as Record<string, string>).authorization, 'Bearer tok');
  assert.equal(seen!.init.body, JSON.stringify([['HINCRBY', 'ev:2026-09-29', 'open', '1'], ['PFCOUNT', 'x']]));
});

test('redis config accepts both Upstash and legacy Vercel KV names', () => {
  assert.deepEqual(redisConfigFromEnv({ UPSTASH_REDIS_REST_URL: 'https://a/', UPSTASH_REDIS_REST_TOKEN: 't' }), {
    url: 'https://a',
    token: 't',
  });
  assert.deepEqual(redisConfigFromEnv({ KV_REST_API_URL: 'https://b', KV_REST_API_TOKEN: 'u' }), {
    url: 'https://b',
    token: 'u',
  });
  assert.equal(redisConfigFromEnv({}), null);
});

test('admin password must be 8+ characters and the cookie token is stable', async () => {
  assert.equal(adminPassword({ ADMIN_PASSWORD: 'short' }), null);
  assert.equal(adminPassword({ TRIAL_SECRET: 'long-enough-secret' }), 'long-enough-secret');
  const a = await adminToken('correct horse');
  assert.equal(a, await adminToken('correct horse'));
  assert.notEqual(a, await adminToken('correct horsf'));
  assert.equal(safeEqual(a, a), true);
  assert.equal(safeEqual(a, a.slice(1)), false);
});
