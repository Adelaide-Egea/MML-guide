// Caregiver share snapshots.
//
// The parent writes on one phone; the caregiver needs the guide on theirs. Until a
// short-lived server exists, the snapshot rides in the URL fragment so nothing is
// uploaded: photos stay on the parent's device, text and structure travel with the
// link. Fragments are not sent to the server, which keeps medical detail out of logs.

import type { Handover, Household } from '@mml/core';
import { subjectsFor } from '@mml/core';

export interface GuideSnapshot {
  readonly v: 1;
  readonly household: Household;
  readonly handover: Handover;
}

/** Keep the subjects this caregiver is responsible for; drop the rest. */
export function snapshotForShare(household: Household, handover: Handover): GuideSnapshot {
  const subjects = subjectsFor(household, handover);
  const ids = new Set(subjects.map((s) => s.id));
  return {
    v: 1,
    household: {
      ...household,
      subjects,
      routine: household.routine.filter(
        (item) => item.appliesTo === 'all' || ids.has(item.appliesTo),
      ),
    },
    handover,
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
      const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'));
      json = await new Response(stream).text();
    } else if (prefix === 'r0') {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }
    const parsed = JSON.parse(json) as GuideSnapshot;
    if (parsed?.v !== 1 || !parsed.household || !parsed.handover) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function shareUrlFor(household: Household, handover: Handover): Promise<string> {
  const snapshot = snapshotForShare(household, handover);
  const encoded = await encodeSnapshot(snapshot);
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/c#${encoded}`;
}
