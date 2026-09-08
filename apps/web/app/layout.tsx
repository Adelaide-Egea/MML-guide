import type { Metadata, Viewport } from 'next';
import { Figtree, Newsreader } from 'next/font/google';
import './globals.css';

// The brand manifest's pairing. Newsreader for headings only; Figtree for
// everything a caregiver actually reads. Loaded through next/font so they are
// self-hosted and there is no render-blocking request to a third party.
const display = Newsreader({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const ui = Figtree({
  subsets: ['latin'],
  variable: '--font-ui-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Notula',
  description: 'Everything they need while you are not there.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#efe7da' },
    { media: '(prefers-color-scheme: dark)', color: '#2b333a' },
  ],
};

/** Sets the theme before first paint. Doing this in an effect produces a white
 *  flash on every load, which is exactly the wrong thing for a product whose dark
 *  theme exists for people reading at 2am. */
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
    // The theme script sets data-theme before React hydrates, which is the whole
    // point of it — the alternative is a flash of the wrong theme. React sees that
    // as a mismatch on this element only.
    <html lang="en" className={`${display.variable} ${ui.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <style>{`:root{
          --font-display: var(--font-display-loaded), Georgia, serif;
          --font-ui: var(--font-ui-loaded), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
