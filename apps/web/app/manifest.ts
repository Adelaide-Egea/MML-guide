import type { MetadataRoute } from 'next';

/** Installable, because the caregiver opening this is standing in someone else's
 *  kitchen and should not have to find a browser tab. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notula',
    short_name: 'Notula',
    description: 'Everything she needs while you are not there.',
    start_url: '/',
    display: 'standalone',
    background_color: '#efe7da',
    theme_color: '#306369',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
