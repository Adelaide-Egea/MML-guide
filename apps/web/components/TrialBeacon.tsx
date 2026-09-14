'use client';

import { useEffect } from 'react';
import { track } from '../lib/trial.ts';

/** Fires one anonymous "open" when the app loads. No household content. */
export function TrialBeacon() {
  useEffect(() => {
    track('open');
  }, []);
  return null;
}
