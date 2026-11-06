// Encode / decode a caregiver snapshot. No browser-only imports, so the server
// can read a share too (for the link preview title).

import { normalizeHandover, normalizeTrip } from '@mml/core';
import type { GuideSnapshot } from './share.ts';

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

