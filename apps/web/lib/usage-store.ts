/** Where usage counts live.
 *
 *  Production: Upstash Redis over its REST API (plain fetch, no SDK), connected
 *  through the Vercel Marketplace. Vercel sets either UPSTASH_REDIS_REST_URL /
 *  UPSTASH_REDIS_REST_TOKEN or the older KV_REST_API_URL / KV_REST_API_TOKEN;
 *  both are accepted.
 *
 *  No credentials (local dev, previews without the integration): an in-memory
 *  store that implements the same handful of commands. It resets on restart,
 *  which is fine for dev and is also what the tests run against.
 */

export type Command = readonly (string | number)[];

export interface UsageStore {
  readonly durable: boolean;
  /** Runs commands in order and returns one result per command. */
  pipeline(commands: readonly Command[]): Promise<unknown[]>;
}

export function redisConfigFromEnv(env: Record<string, string | undefined> = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export function redisStore(url: string, token: string, fetchImpl: typeof fetch = fetch): UsageStore {
  return {
    durable: true,
    async pipeline(commands) {
      if (commands.length === 0) return [];
      const response = await fetchImpl(`${url}/pipeline`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(commands.map((c) => c.map(String))),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Usage store responded ${response.status}`);
      const rows = (await response.json()) as { result?: unknown; error?: string }[];
      return rows.map((row) => (row.error ? null : row.result));
    },
  };
}

/** In-memory stand-in. Hashes, sets and HyperLogLogs (as exact sets). */
export function memoryStore(): UsageStore {
  const hashes = new Map<string, Map<string, string>>();
  const sets = new Map<string, Set<string>>();

  const hash = (k: string) => {
    let h = hashes.get(k);
    if (!h) hashes.set(k, (h = new Map()));
    return h;
  };
  const set = (k: string) => {
    let s = sets.get(k);
    if (!s) sets.set(k, (s = new Set()));
    return s;
  };

  function run(command: Command): unknown {
    const [name, ...rawArgs] = command;
    const args = rawArgs.map(String);
    switch (String(name).toUpperCase()) {
      case 'HINCRBY': {
        const h = hash(args[0]!);
        const next = Number(h.get(args[1]!) ?? 0) + Number(args[2]);
        h.set(args[1]!, String(next));
        return next;
      }
      case 'HSET': {
        const h = hash(args[0]!);
        for (let i = 1; i + 1 < args.length; i += 2) h.set(args[i]!, args[i + 1]!);
        return 1;
      }
      case 'HSETNX': {
        const h = hash(args[0]!);
        if (h.has(args[1]!)) return 0;
        h.set(args[1]!, args[2]!);
        return 1;
      }
      case 'HGETALL': {
        const h = hashes.get(args[0]!);
        return h ? [...h.entries()].flat() : [];
      }
      case 'SADD':
      case 'PFADD': {
        const s = set(args[0]!);
        const before = s.size;
        for (const member of args.slice(1)) s.add(member);
        return s.size > before ? 1 : 0;
      }
      case 'SMEMBERS':
        return [...(sets.get(args[0]!) ?? [])];
      case 'SCARD':
        return sets.get(args[0]!)?.size ?? 0;
      case 'PFCOUNT': {
        const union = new Set<string>();
        for (const key of args) for (const m of sets.get(key) ?? []) union.add(m);
        return union.size;
      }
      case 'EXPIRE':
        return 1;
      default:
        throw new Error(`memoryStore: unsupported command ${String(name)}`);
    }
  }

  return {
    durable: false,
    async pipeline(commands) {
      return commands.map(run);
    },
  };
}

const globalRef = globalThis as unknown as { __domelaUsageStore?: UsageStore };

export function usageStore(): UsageStore {
  const config = redisConfigFromEnv();
  if (config) return redisStore(config.url, config.token);
  globalRef.__domelaUsageStore ??= memoryStore();
  return globalRef.__domelaUsageStore;
}
