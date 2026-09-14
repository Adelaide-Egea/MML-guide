/** Privacy-safe trial telemetry.
 *
 *  Sends only: event name + optional trial code from ?trial= or localStorage.
 *  Never sends household names, guide text, photos, or Ask questions.
 */

export type TrialEvent = 'open' | 'guide' | 'ask' | 'welcome_home' | 'sample';

const KEY = 'domela-trial-code';

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

export function track(event: TrialEvent): void {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    event,
    trial: trialCode(),
    // Coarse path only — no query, no ids
    path: window.location.pathname.split('/').slice(0, 2).join('/') || '/',
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
