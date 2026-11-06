/**
 * Fetch a short caregiver share by id.
 * Expired records are treated as missing.
 */

import { NextResponse } from 'next/server';
import { readShare } from '../../../../lib/share-store.ts';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const found = await readShare(id);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }
  return NextResponse.json({
    payload: found.record.payload,
    expiresAt: found.record.expiresAt,
  });
}
