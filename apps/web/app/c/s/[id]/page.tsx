'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '../../../../components/Chrome.tsx';
import { decodeSnapshot, installSnapshotMedia } from '../../../../lib/share.ts';

/**
 * Short caregiver link: /c/s/{id}
 *
 * Loads the snapshot from Domela's private store, installs any photos, then
 * hands off to /c using sessionStorage so Ask and refresh keep working.
 */
export default function ShortCaregiverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
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
        window.sessionStorage.setItem(
          'mml.caregiver-snapshot',
          JSON.stringify({
            ...decoded,
            mediaBlobs: undefined,
          }),
        );
        router.replace('/c');
      } catch {
        if (!cancelled) setError('This link could not be opened. Check your connection and try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <main className="shell">
      <TopBar title="Guide" />
      <p className="muted">{error ?? 'Opening the guide…'}</p>
    </main>
  );
}
