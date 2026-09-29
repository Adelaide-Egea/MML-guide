import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/admin-auth.ts';
import { parseUsageInput, readUsageStats, recordUsage } from '../../../lib/usage.ts';
import { usageStore } from '../../../lib/usage-store.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Anonymous usage beacon. Body: { event, device, role, trial, ref, path }.
 *  Stored in Upstash Redis when connected (lib/usage-store.ts), else in memory.
 *  Optional durable trail: TRIAL_WEBHOOK_URL (Discord/Slack/Zapier) — event + tester code only.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const input = parseUsageInput(body);
  if (!input) return NextResponse.json({ ok: false, error: 'bad event' }, { status: 400 });

  try {
    await recordUsage(usageStore(), input);
  } catch {
    // Counting must never break the app.
  }

  const webhook = process.env.TRIAL_WEBHOOK_URL;
  if (webhook && input.trial) {
    void fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `Domela tester ${input.trial}: ${input.event}`,
        event: input.event,
        trial: input.trial,
        at: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

/** JSON version of the dashboard, for the admin only. */
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const stats = await readUsageStats(usageStore());
  return NextResponse.json({ ok: true, stats });
}
