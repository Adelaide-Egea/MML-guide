'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '../../../../components/Chrome.tsx';
import {
  loadCaregiverShareId,
  loadCaregiverSnapshot,
  persistCaregiverSnapshot,
} from '../../../../lib/caregiver-session.ts';
import { decodeSnapshot, installSnapshotMedia } from '../../../../lib/share.ts';
import CaregiverPage from '../../page.tsx';

/**
 * Short caregiver link: /c/s/{id}
 *
 * Stay on this URL. Redirecting to /c dropped the guide if someone opened the
 * WhatsApp preview in Safari, refreshed, or copied the address bar.
 */
export default function ShortCaregiverPage() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    if (loadCaregiverShareId() === id && loadCaregiverSnapshot()) {
      setReady(true);
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/share/${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (response.status === 410) {
          setError('This link has expired. Ask them to send a new one.');
          return;
        }
        if (!response.ok) {
          setError('This link could not be opened. Ask them to send it again.');
          return;
        }
        const data = (await response.json()) as { payload?: string };
        if (!data.payload) {
          setError('This link could not be opened. Ask them to send it again.');
          return;
        }
        const decoded = await decodeSnapshot(data.payload);
        if (!decoded) {
          setError('This link could not be read. Ask them to send it again.');
          return;
        }
        try {
          await installSnapshotMedia(decoded);
        } catch {
          // Text still shows without photos.
        }
        persistCaregiverSnapshot(decoded, id);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setError('This link could not be opened. Check your connection and try again.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (ready) return <CaregiverPage />;

  return (
    <main className="shell">
      <TopBar title="Guide" />
      <p className="muted">{error ?? 'Opening the guide…'}</p>
    </main>
  );
}
