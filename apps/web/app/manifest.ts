import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Domela',
    short_name: 'Domela',
    description: 'The household guide — everything they need while you are not there.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef0ed',
    theme_color: '#d9923a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
