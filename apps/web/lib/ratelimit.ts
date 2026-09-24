// Rate limiting for Ask and share endpoints.
//
// Serverless instances do not share memory, so an in-process counter only limits
// traffic that happens to land on the same instance. When UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN are set, a shared fixed-window counter is used
// instead and the limit actually holds across instances. Without them the
// in-process counter still blunts the most obvious abuse.

const WINDOW_MS = 60 * 60 * 1000;
/** Ask / share: generous for a sitter evening, tight enough to stop a burn run. */
const LIMIT = 30;

const memory = new Map<string, number[]>();

function pruneMemory(now: number) {
  for (const [key, timestamps] of memory) {
    const live = timestamps.filter((t) => now - t < WINDOW_MS);
    if (live.length) memory.set(key, live);
    else memory.delete(key);
  }
}

function checkMemory(key: string, now: number): { limited: boolean; shared: boolean } {
  if (memory.size > 500) pruneMemory(now);

  const timestamps = (memory.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  memory.set(key, timestamps);

  return { limited: timestamps.length > LIMIT, shared: false };
}

async function checkUpstash(
  key: string,
  now: number,
  url: string,
  token: string,
  bucket: string,
): Promise<{ limited: boolean; shared: boolean }> {
  const window = Math.floor(now / WINDOW_MS);
  const redisKey = `ratelimit:${bucket}:${window}:${key}`;

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

  const results = (await response.json()) as { result?: unknown }[];
  const count = Number(results?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error('Unexpected Upstash response shape');

  return { limited: count > LIMIT, shared: true };
}

/** Client IP for rate keys — prefers the left-most forwarded hop. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 64);
  return 'unknown';
}

export async function isRateLimited(
  key: string,
  bucket = 'answer',
): Promise<{ limited: boolean; shared: boolean }> {
  const now = Date.now();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await checkUpstash(key, now, url, token, bucket);
    } catch {
      return checkMemory(`${bucket}:${key}`, now);
    }
  }

  return checkMemory(`${bucket}:${key}`, now);
}

export const rateLimitConfig = { WINDOW_MS, LIMIT };
