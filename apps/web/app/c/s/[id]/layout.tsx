import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { decodeSnapshot } from '../../../../lib/share-codec.ts';
import { sharePreview } from '../../../../lib/share-preview.ts';
import { readShare } from '../../../../lib/share-store.ts';

// Each caregiver link gets its own preview title ("For Marie · Evening sitter")
// instead of the site name. Private links: never indexed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const fallback: Metadata = { robots: { index: false, follow: false } };
  try {
    const { id } = await params;
    const found = await readShare(id);
    if (!found.ok) return fallback;
    const snapshot = await decodeSnapshot(found.record.payload);
    if (!snapshot) return fallback;
    const { title, description } = sharePreview(snapshot.household, snapshot.handover);
    return {
      ...fallback,
      title: { absolute: title },
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { title, description },
    };
  } catch {
    return fallback;
  }
}

export default function ShareLayout({ children }: { children: ReactNode }) {
  return children;
}
