import type { MetadataRoute } from 'next';

/** Installable, because the caregiver opening this is standing in someone else's
 *  kitchen and should not have to find a browser tab. No product name yet, so the
 *  labels describe what it is. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Care guide',
    short_name: 'Guide',
    description: 'Everything someone needs to know while you are not there.',
    start_url: '/',
    display: 'standalone',
    background_color: '#e0d2bc',
    theme_color: '#445f72',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
