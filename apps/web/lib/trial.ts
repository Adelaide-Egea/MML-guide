/** Privacy-safe usage telemetry.
 *
 *  Sends only: event name, a random device id, parent/caregiver, the coarse path,
 *  an optional tester code from ?trial=, and (caregiver opens only) the guide's
 *  random id. Never sends household names, guide text, photos, or Ask questions.
 *  What the server does with it: lib/usage.ts.
 */

import type { UsageEvent } from './usage.ts';

export type TrialEvent = UsageEvent;

const KEY = 'domela-trial-code';
const DEVICE_KEY = 'domela-device';

export function trialCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('trial');
    if (fromUrl) {
      localStorage.setItem(KEY, fromUrl.slice(0, 32));
      return fromUrl.slice(0, 32);
    }
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** A random id for this browser, so the same phone is counted once. Not tied to a person. */
function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track(event: TrialEvent, options: { ref?: string } = {}): void {
  if (typeof window === 'undefined') return;
  // Coarse path only — no query, no ids
  const path = window.location.pathname.split('/').slice(0, 2).join('/') || '/';
  const body = JSON.stringify({
    event,
    trial: trialCode(),
    device: deviceId(),
    role: path === '/c' ? 'caregiver' : 'parent',
    ref: options.ref,
    path,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/trial', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch('/api/trial', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
