import { NextResponse } from 'next/server';

/** In-memory aggregate counters for this server instance.
 *  Durable trail: set TRIAL_WEBHOOK_URL (Discord/Slack/Zapier) — only event + trial code.
 *  Read totals: GET /api/trial?secret=TRIAL_SECRET
 */

type EventName = 'open' | 'guide' | 'ask' | 'welcome_home' | 'sample';

const ALLOWED = new Set<EventName>(['open', 'guide', 'ask', 'welcome_home', 'sample']);

const globalStore = globalThis as unknown as {
  __domelaTrial?: { counts: Record<string, number>; byTrial: Record<string, Record<string, number>> };
};

function store() {
  if (!globalStore.__domelaTrial) {
    globalStore.__domelaTrial = { counts: {}, byTrial: {} };
  }
  return globalStore.__domelaTrial;
}

export async function POST(req: Request) {
  let payload: { event?: string; trial?: string | null; path?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = payload.event as EventName;
  if (!ALLOWED.has(event)) {
    return NextResponse.json({ ok: false, error: 'unknown event' }, { status: 400 });
  }

  // Refuse anything that looks like content
  if (payload.path && payload.path.length > 64) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const s = store();
  s.counts[event] = (s.counts[event] ?? 0) + 1;
  const trial = typeof payload.trial === 'string' ? payload.trial.slice(0, 32) : '';
  if (trial) {
    s.byTrial[trial] ??= {};
    s.byTrial[trial][event] = (s.byTrial[trial][event] ?? 0) + 1;
  }

  const webhook = process.env.TRIAL_WEBHOOK_URL;
  if (webhook) {
    void fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `Domela trial: ${event}${trial ? ` (${trial})` : ''}`,
        event,
        trial: trial || null,
        path: payload.path ?? null,
        at: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const secret = process.env.TRIAL_SECRET;
  const url = new URL(req.url);
  if (!secret || url.searchParams.get('secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const s = store();
  return NextResponse.json({
    ok: true,
    note: 'In-memory counts reset on cold start. Set TRIAL_WEBHOOK_URL for a durable trail.',
    counts: s.counts,
    byTrial: s.byTrial,
  });
}
