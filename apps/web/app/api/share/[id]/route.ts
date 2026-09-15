/**
 * Fetch a short caregiver share by id.
 * Expired records are treated as missing.
 */

import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { isShareId, shareBlobPath } from '../../../../lib/share-id.ts';

export const runtime = 'nodejs';

interface ShareRecord {
  readonly v: 1;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly payload: string;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Short links are not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  if (!isShareId(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(shareBlobPath(id), {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let record: ShareRecord;
  try {
    const text = await new Response(result.stream).text();
    record = JSON.parse(text) as ShareRecord;
  } catch {
    return NextResponse.json({ error: 'Corrupt share.' }, { status: 500 });
  }

  if (!record || record.v !== 1 || typeof record.payload !== 'string') {
    return NextResponse.json({ error: 'Corrupt share.' }, { status: 500 });
  }

  if (Date.parse(record.expiresAt) < Date.now()) {
    return NextResponse.json({ error: 'This link has expired.' }, { status: 410 });
  }

  return NextResponse.json({
    payload: record.payload,
    expiresAt: record.expiresAt,
  });
}
