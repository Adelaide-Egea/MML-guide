import type { Metadata, Viewport } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import './globals.css';
import { SiteFooter } from '../components/SiteFooter.tsx';
import { TrialBeacon } from '../components/TrialBeacon.tsx';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const ui = Figtree({
  subsets: ['latin'],
  variable: '--font-ui-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Domela — the household guide',
  description: 'Everything they need while you are not there.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf6ee' },
    { media: '(prefers-color-scheme: dark)', color: '#1c2622' },
  ],
};

const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem('theme');
  var dark = stored ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <style>{`:root{
          --font-display: var(--font-display-loaded), Georgia, serif;
          --font-ui: var(--font-ui-loaded), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }`}</style>
      </head>
      <body>
        <TrialBeacon />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
