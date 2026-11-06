// Server only: read a stored caregiver share by id (Vercel Blob, private).

import { get } from '@vercel/blob';
import { isShareId, shareBlobPath } from './share-id.ts';

export interface ShareRecord {
  readonly v: 1;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly payload: string;
}

export type ShareLookup =
  | { readonly ok: true; readonly record: ShareRecord }
  | { readonly ok: false; readonly status: 404 | 410 | 500 | 503; readonly error: string };

export async function readShare(id: string): Promise<ShareLookup> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, status: 503, error: 'Short links are not configured.' };
  }
  if (!isShareId(id)) return { ok: false, status: 404, error: 'Not found.' };

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(shareBlobPath(id), {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch {
    return { ok: false, status: 404, error: 'Not found.' };
  }
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { ok: false, status: 404, error: 'Not found.' };
  }

  let record: ShareRecord;
  try {
    record = JSON.parse(await new Response(result.stream).text()) as ShareRecord;
  } catch {
    return { ok: false, status: 500, error: 'Corrupt share.' };
  }
  if (!record || record.v !== 1 || typeof record.payload !== 'string') {
    return { ok: false, status: 500, error: 'Corrupt share.' };
  }
  if (Date.parse(record.expiresAt) < Date.now()) {
    return { ok: false, status: 410, error: 'This link has expired.' };
  }
  return { ok: true, record };
}
