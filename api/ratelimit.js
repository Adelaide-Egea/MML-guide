// Rate limiting for the generate endpoint.
//
// Serverless instances do not share memory, so an in-process counter only limits
// traffic that happens to land on the same instance. When UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN are set, a shared fixed-window counter is used
// instead and the limit actually holds across instances. Without them the
// in-process counter still blunts the most obvious abuse, so the fallback is
// deliberate rather than accidental.

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 8;

const memory = new Map();

function pruneMemory(now) {
  for (const [key, timestamps] of memory) {
    const live = timestamps.filter((t) => now - t < WINDOW_MS);
    if (live.length) memory.set(key, live);
    else memory.delete(key);
  }
}

function checkMemory(key, now) {
  // Unbounded growth here is a slow memory leak on a warm instance, so prune
  // opportunistically rather than only touching the current key.
  if (memory.size > 500) pruneMemory(now);

  const timestamps = (memory.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  memory.set(key, timestamps);

  return { limited: timestamps.length > LIMIT, shared: false };
}

async function checkUpstash(key, now, url, token) {
  const window = Math.floor(now / WINDOW_MS);
  const redisKey = `ratelimit:generate:${window}:${key}`;

  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(Math.ceil(WINDOW_MS / 1000))],
    ]),
  });

  if (!response.ok) throw new Error(`Upstash responded ${response.status}`);

  const results = await response.json();
  const count = Number(results?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error('Unexpected Upstash response shape');

  return { limited: count > LIMIT, shared: true };
}

export async function isRateLimited(key) {
  const now = Date.now();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await checkUpstash(key, now, url, token);
    } catch {
      // A rate limiter that is down must not take the product down with it.
      return checkMemory(key, now);
    }
  }

  return checkMemory(key, now);
}

export const rateLimitConfig = { WINDOW_MS, LIMIT };
