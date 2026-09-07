// Turning retrieved entries into a sentence.
//
// This endpoint is deliberately small and deliberately dumb. It cannot be steered:
// the system prompt, the model and the token ceiling live here and are not settable
// by the caller, so it is not usable as a general-purpose proxy the way the
// prototype's generate endpoint originally was.
//
// It never sees a whole household. The client sends only the handful of entries that
// deterministic retrieval already selected, and it never sends safety fields at all
// — those are answered without a model, by `prepare`, before this is ever called.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 700;
const MAX_QUESTION = 500;
const MAX_ENTRIES = 6;
const MAX_BODY = 1500;

const SYSTEM = `You answer a caregiver's question using ONLY the guide entries provided.

Rules, in order:
1. Answer only from the entries given. Never add advice, context or general knowledge, however obvious it seems.
2. If the entries do not answer the question, reply with exactly: NOT_IN_GUIDE
3. Reply in the caregiver's language, given below. The entries may be in a different language; translate your answer, but keep names, brand names, dosages, numbers and times exactly as written.
4. Be brief. Two or three sentences. This is read standing up in someone else's kitchen.
5. Never guess at anything medical, and never infer that something is safe because it was not mentioned.

Return ONLY minified JSON, no markdown fence:
{"body":"your answer","citedEntryIds":["the entryId values you used"]}

Every entryId in citedEntryIds must be one you were given. If you would return NOT_IN_GUIDE, use {"body":"NOT_IN_GUIDE","citedEntryIds":[]}.`;

interface ContextEntry {
  entryId: string;
  subject: string;
  title: string;
  body: string;
  media: string[];
  writtenAt: string;
  language: string;
}

function str(value: unknown, cap: number): string {
  return typeof value === 'string' ? value.slice(0, cap) : '';
}

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // 503 rather than 500: the client degrades to showing the matched entries as
    // written, which is a working product, not an error state.
    return NextResponse.json({ error: 'Assistant not configured.' }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const input = payload as { question?: unknown; language?: unknown; context?: unknown };
  const question = str(input.question, MAX_QUESTION).trim();
  const language = str(input.language, 20) || 'en';
  const context = Array.isArray(input.context) ? input.context.slice(0, MAX_ENTRIES) : [];

  if (!question || context.length === 0) {
    return NextResponse.json({ error: 'Nothing to answer.' }, { status: 400 });
  }

  const entries: ContextEntry[] = context.map((raw) => {
    const e = raw as Record<string, unknown>;
    return {
      entryId: str(e.entryId, 64),
      subject: str(e.subject, 80),
      title: str(e.title, 200),
      body: str(e.body, MAX_BODY),
      media: Array.isArray(e.media) ? e.media.slice(0, 8).map((m) => str(m, 300)) : [],
      writtenAt: str(e.writtenAt, 40),
      language: str(e.language, 20),
    };
  });

  const allowed = new Set(entries.map((e) => e.entryId));

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Caregiver's language: ${language}\n\nQuestion: ${question}\n\nEntries:\n${JSON.stringify(entries)}`,
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Assistant unreachable.' }, { status: 502 });
  }

  if (!response.ok) {
    console.error('anthropic error', response.status, (await response.text()).slice(0, 400));
    return NextResponse.json({ error: 'Assistant unavailable.' }, { status: 502 });
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === 'text')?.text ?? '';

  let parsed: { body?: unknown; citedEntryIds?: unknown };
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
    parsed = JSON.parse(cleaned) as typeof parsed;
  } catch {
    // Unparseable output becomes a refusal downstream rather than an error the
    // caregiver has to interpret.
    return NextResponse.json({ body: 'NOT_IN_GUIDE', citedEntryIds: [] });
  }

  // Citations outside the offered set are dropped here as well as in the client's
  // verifyAnswer. Two checks, because this one bounds what leaves the server and
  // that one bounds what reaches the screen.
  const citedEntryIds = Array.isArray(parsed.citedEntryIds)
    ? parsed.citedEntryIds.filter((id): id is string => typeof id === 'string' && allowed.has(id))
    : [];

  return NextResponse.json({ body: str(parsed.body, 2000), citedEntryIds });
}
