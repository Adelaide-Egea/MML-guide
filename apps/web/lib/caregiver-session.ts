import type { GuideSnapshot } from './share.ts';

const SNAP_KEY = 'mml.caregiver-snapshot';
const ID_KEY = 'mml.caregiver-share-id';

/** Keep the opened guide on this phone so Ask and refresh still work. */
export function persistCaregiverSnapshot(
  snapshot: GuideSnapshot,
  shareId?: string | null,
): void {
  window.sessionStorage.setItem(
    SNAP_KEY,
    JSON.stringify({
      ...snapshot,
      mediaBlobs: undefined,
    }),
  );
  if (shareId) window.sessionStorage.setItem(ID_KEY, shareId);
}

export function loadCaregiverSnapshot(): GuideSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(SNAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuideSnapshot;
    if (parsed?.household && parsed?.handover) return parsed;
  } catch {
    // Ignore a corrupt session.
  }
  return null;
}

export function loadCaregiverShareId(): string | null {
  try {
    return window.sessionStorage.getItem(ID_KEY);
  } catch {
    return null;
  }
}
