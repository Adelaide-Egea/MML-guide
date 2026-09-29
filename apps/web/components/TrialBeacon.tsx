'use client';

import { useEffect } from 'react';
import { track } from '../lib/trial.ts';

/** Fires one anonymous "open" when the app loads. No household content. */
export function TrialBeacon() {
  useEffect(() => {
    // The admin looking at the dashboard is not a user.
    if (window.location.pathname.startsWith('/admin')) return;
    track('open');
  }, []);
  return null;
}
