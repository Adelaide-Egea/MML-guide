import { buildSystemPrompt } from './prompt.js';
import { isRateLimited } from './ratelimit.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2500;
const MAX_PROMPT_CHARS = 24000;

// Requests from anywhere other than the app itself have no legitimate reason to
// hit this endpoint. ALLOWED_ORIGINS overrides the default for preview deploys.
const DEFAULT_ALLOWED_ORIGIN_SUFFIXES = ['.vercel.app'];

function allowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return configured;
}

function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin form posts and curl-less clients omit it

  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }

  const configured = allowedOrigins();
  if (configured.length) {
    return configured.some((allowed) => {
      try {
        return new URL(allowed).host === host;
      } catch {
        return allowed === host;
      }
    });
  }

  if (host === 'localhost' || host.startsWith('localhost:') || host.startsWith('127.0.0.1')) return true;
  return DEFAULT_ALLOWED_ORIGIN_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function clientKey(req) {
  // Vercel sets these; the first entry of x-forwarded-for is the real client.
  const forwarded = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length) return String(forwarded[0]).trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

// Older cached clients send { system, messages }. The system prompt they supply is
// discarded — it is rebuilt here — but their user text is still honoured so a stale
// tab does not break mid-guide.
export function extractUserPrompt(body) {
  if (typeof body?.userPrompt === 'string') return body.userPrompt;

  const first = Array.isArray(body?.messages) ? body.messages[0] : null;
  if (!first) return null;
  if (typeof first.content === 'string') return first.content;
  if (Array.isArray(first.content)) {
    const text = first.content.find((block) => block?.type === 'text' && typeof block.text === 'string');
    return text ? text.text : null;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isOriginAllowed(req.headers.origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { limited } = await isRateLimited(clientKey(req));
  if (limited) {
    return res.status(429).json({ error: 'Too many requests — please wait a bit and try again.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'The guide service is temporarily unavailable.' });
  }

  const userPrompt = extractUserPrompt(req.body);
  if (!userPrompt || !userPrompt.trim()) {
    return res.status(400).json({ error: 'Nothing to generate.' });
  }
  if (userPrompt.length > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: 'That guide is too long to generate. Try shortening your notes.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(req.body?.duration),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Upstream errors can carry account and key detail, so they stay in the logs.
      console.error('Anthropic error', response.status, JSON.stringify(data).slice(0, 500));
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({
        error: status === 429
          ? 'The guide service is busy — please try again in a moment.'
          : 'The guide could not be generated. Please try again.',
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('generate failed', err);
    return res.status(502).json({ error: 'The guide could not be generated. Please try again.' });
  }
}
