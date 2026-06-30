// Simple in-memory rate limit: max 8 requests per IP per hour.
const requestLog = new Map();
const LIMIT = 8;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a bit and try again.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: req.body.max_tokens || 1600,
        system: req.body.system,
        messages: req.body.messages
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
