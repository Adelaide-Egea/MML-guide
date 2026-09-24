// Caregiver share snapshots.
//
// Sending to a babysitter creates a short /c/s/{id} link. The encoded guide is
// stored privately for 14 days so WhatsApp/SMS stay readable. If short-link
// storage is unavailable, we fall back to a long URL fragment (nothing uploaded).
//
// Photos are opt-in. By default the link carries text only. When the parent
// consents, photo bytes are compressed and included — anyone with the link can
// then see them.

import type { Handover, Household, Media, Trip } from '@mml/core';
import { normalizeHandover, normalizeTrip, subjectsFor } from '@mml/core';
import { getBlob, putBlob } from './media.ts';

/** Practical ceiling for a shareable fragment. Beyond this, most messengers and
 *  browsers choke; we refuse rather than send a broken link. */
export const MAX_SHARE_CHARS = 1_400_000;

export interface EmbeddedBlob {
  readonly mime: string;
  /** Standard base64 (not url-safe) — nested inside the gzip JSON payload. */
  readonly data: string;
}

export interface GuideSnapshot {
  /** 1 = text only (legacy). 2 = may include embedded photo blobs. */
  readonly v: 1 | 2;
  readonly household: Household;
  readonly handover: Handover;
  /** Packing list for goingtoyours (and any handover that links a trip). */
  readonly trip?: Trip | null;
  /** Present only when the parent consented to include photos. Keyed by Media.key. */
  readonly mediaBlobs?: Readonly<Record<string, EmbeddedBlob>>;
}

export interface ShareOptions {
  /** When true, photo blobs are embedded in the link. Default false. */
  readonly includePhotos?: boolean;
  /** Trip to embed when the handover is a packing visit. */
  readonly trip?: Trip | null;
}

export type ShareBuildResult =
  | {
      readonly ok: true;
      readonly url: string;
      readonly photoCount: number;
      readonly omittedVideos: number;
      /** True when the URL is a short /c/s/{id} link stored temporarily on Domela. */
      readonly short: boolean;
      readonly expiresAt?: string;
    }
  | {
      readonly ok: false;
      readonly reason: 'too-large';
      readonly photoCount: number;
      readonly chars: number;
    };

/** Keep the subjects this caregiver is responsible for; drop the rest. */
export function snapshotForShare(
  household: Household,
  handover: Handover,
  opts: ShareOptions = {},
): GuideSnapshot {
  const normalized = normalizeHandover(handover);
  const subjects = subjectsFor(household, normalized);
  const ids = new Set(subjects.map((s) => s.id));
  const includePhotos = opts.includePhotos === true;

  const scopedSubjects = subjects.map((subject) => {
    if (includePhotos) return subject;
    // Without consent, strip media metadata so the caregiver view does not show
    // empty photo slots for blobs that were never sent.
    return {
      ...subject,
      entries: subject.entries.map((entry) => ({
        ...entry,
        media: [] as readonly Media[],
      })),
    };
  });

  return {
    v: includePhotos ? 2 : 1,
    household: {
      ...household,
      subjects: scopedSubjects,
      routine: household.routine.filter(
        (item) => item.appliesTo === 'all' || ids.has(item.appliesTo),
      ),
    },
    handover: normalized,
    trip: opts.trip ? normalizeTrip(opts.trip) : null,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export async function encodeSnapshot(snapshot: GuideSnapshot): Promise<string> {
  const json = JSON.stringify(snapshot);
  const input = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'undefined') {
    return `r0.${bytesToBase64Url(input)}`;
  }
  const stream = new Blob([new Uint8Array(input)]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return `g1.${bytesToBase64Url(compressed)}`;
}

export async function decodeSnapshot(payload: string): Promise<GuideSnapshot | null> {
  try {
    const dot = payload.indexOf('.');
    if (dot < 0) return null;
    const prefix = payload.slice(0, dot);
    const data = payload.slice(dot + 1);
    if (!data) return null;
    const bytes = base64UrlToBytes(data);
    let json: string;
    if (prefix === 'g1' && typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([new Uint8Array(bytes)])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      json = await new Response(stream).text();
    } else if (prefix === 'r0') {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }
    const parsed = JSON.parse(json) as GuideSnapshot;
    if ((parsed?.v !== 1 && parsed?.v !== 2) || !parsed.household || !parsed.handover) {
      return null;
    }
    return {
      ...parsed,
      handover: normalizeHandover(parsed.handover),
      trip: parsed.trip ? normalizeTrip(parsed.trip) : parsed.trip ?? null,
    };
  } catch {
    return null;
  }
}

/** Collect photo keys from a household (videos are skipped — too large for a link). */
export function photoKeysIn(household: Household): readonly string[] {
  const keys: string[] = [];
  for (const subject of household.subjects) {
    for (const entry of subject.entries) {
      for (const media of entry.media) {
        if (media.kind === 'photo') keys.push(media.key);
      }
    }
  }
  return keys;
}

export function videoCountIn(household: Household): number {
  let n = 0;
  for (const subject of household.subjects) {
    for (const entry of subject.entries) {
      for (const media of entry.media) {
        if (media.kind === 'video') n += 1;
      }
    }
  }
  return n;
}

/** Max edge length for photos embedded in a share (keeps babysitter links small). */
const SHARE_PHOTO_MAX_EDGE = 1280;
const SHARE_PHOTO_QUALITY = 0.72;

/** Downscale + re-encode a photo for sharing. Falls back to the original bytes. */
async function compressPhotoForShare(blob: Blob): Promise<{ mime: string; bytes: Uint8Array }> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    return { mime: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
  }
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, SHARE_PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return { mime: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', SHARE_PHOTO_QUALITY),
    );
    if (!compressed) {
      return { mime: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
    }
    return { mime: 'image/jpeg', bytes: new Uint8Array(await compressed.arrayBuffer()) };
  } catch {
    return { mime: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
  }
}

async function loadPhotoBlobs(keys: readonly string[]): Promise<Record<string, EmbeddedBlob>> {
  const out: Record<string, EmbeddedBlob> = {};
  for (const key of keys) {
    const blob = await getBlob(key);
    if (!blob) continue;
    const compressed = await compressPhotoForShare(blob);
    out[key] = {
      mime: compressed.mime,
      data: bytesToBase64(compressed.bytes),
    };
  }
  return out;
}

/** Install embedded blobs into this device's media store so MediaThumb works. */
export async function installSnapshotMedia(snapshot: GuideSnapshot): Promise<number> {
  const blobs = snapshot.mediaBlobs;
  if (!blobs) return 0;
  let n = 0;
  for (const [key, embedded] of Object.entries(blobs)) {
    const bytes = base64ToBytes(embedded.data);
    // Copy into a fresh ArrayBuffer so BlobPart typing accepts it under strict DOM libs.
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: embedded.mime || 'image/jpeg' });
    await putBlob(key, blob);
    n += 1;
  }
  return n;
}

export async function buildShareUrl(
  household: Household,
  handover: Handover,
  opts: ShareOptions = {},
): Promise<ShareBuildResult> {
  const includePhotos = opts.includePhotos === true;
  let snapshot = snapshotForShare(household, handover, {
    includePhotos,
    trip: opts.trip ?? null,
  });
  let photoCount = 0;
  let omittedVideos = 0;

  if (includePhotos) {
    omittedVideos = videoCountIn(snapshot.household);
    const keys = photoKeysIn(snapshot.household);
    if (keys.length > 0) {
      const mediaBlobs = await loadPhotoBlobs(keys);
      photoCount = Object.keys(mediaBlobs).length;
      snapshot = { ...snapshot, v: 2, mediaBlobs };
    }
  }

  const encoded = await encodeSnapshot(snapshot);
  if (encoded.length > MAX_SHARE_CHARS) {
    return { ok: false, reason: 'too-large', photoCount, chars: encoded.length };
  }
  const base = typeof window === 'undefined' ? '' : window.location.origin;

  // Prefer a short /c/s/{id} link so WhatsApp/SMS stay readable. Falls back to the
  // long fragment URL if the short-link service is unavailable (offline, misconfig).
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: encoded }),
    });
    if (response.ok) {
      const data = (await response.json()) as { id?: string; path?: string; expiresAt?: string };
      if (data.path && data.id) {
        return {
          ok: true,
          url: `${base}${data.path}`,
          photoCount,
          omittedVideos,
          short: true,
          ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
        };
      }
    }
  } catch {
    // Fall through to fragment URL.
  }

  return {
    ok: true,
    url: `${base}/c#${encoded}`,
    photoCount,
    omittedVideos,
    short: false,
  };
}

/** Convenience wrapper. If photos make the link too large, falls back to text-only. */
export async function shareUrlFor(
  household: Household,
  handover: Handover,
  opts: ShareOptions = {},
): Promise<string> {
  const result = await buildShareUrl(household, handover, opts);
  if (result.ok) return result.url;
  const fallback = await buildShareUrl(household, handover, { includePhotos: false });
  if (fallback.ok) return fallback.url;
  throw new Error('Share link is too large even without photos.');
}
