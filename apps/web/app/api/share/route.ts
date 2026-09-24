/**
 * Create a short caregiver share link.
 *
 * The parent client POSTs an already-encoded snapshot. We store it privately in
 * Vercel Blob for a short TTL and return an id so the babysitter gets
 * https://…/c/s/{id} instead of a multi-kilobyte URL fragment.
 */

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from '../../../lib/ratelimit.ts';
import { isShareId, newShareId, SHARE_TTL_MS, shareBlobPath } from '../../../lib/share-id.ts';

export const runtime = 'nodejs';

const MAX_PAYLOAD_CHARS = 1_400_000;

interface ShareRecord {
  readonly v: 1;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly payload: string;
}

export async function POST(request: Request) {
  const limited = await isRateLimited(clientIp(request), 'share');
  if (limited.limited) {
    return NextResponse.json(
      { error: 'Too many share links from this phone. Try again in an hour.' },
      { status: 429 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Short links are not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const payload =
    body && typeof body === 'object' && typeof (body as { payload?: unknown }).payload === 'string'
      ? (body as { payload: string }).payload
      : '';

  if (!payload || payload.length > MAX_PAYLOAD_CHARS) {
    return NextResponse.json({ error: 'Payload missing or too large.' }, { status: 400 });
  }
  if (!(payload.startsWith('g1.') || payload.startsWith('r0.'))) {
    return NextResponse.json({ error: 'Unrecognized payload.' }, { status: 400 });
  }

  let id = newShareId();
  // Extremely unlikely collision; regenerate once if the client sent a preferred id.
  const preferred =
    body && typeof body === 'object' && typeof (body as { id?: unknown }).id === 'string'
      ? (body as { id: string }).id
      : null;
  if (preferred && isShareId(preferred)) id = preferred;

  const now = Date.now();
  const record: ShareRecord = {
    v: 1,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SHARE_TTL_MS).toISOString(),
    payload,
  };

  try {
    await put(shareBlobPath(id), JSON.stringify(record), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Store failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    id,
    path: `/c/s/${id}`,
    expiresAt: record.expiresAt,
  });
}
