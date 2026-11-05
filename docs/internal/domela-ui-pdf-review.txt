# Domela — UI colour + PDF/print pack for Claude

Use this single file to redesign **colours** and **print/PDF layout**.

## How “PDF” works today (important)

There is **no real PDF generator**. The guide button calls `window.print()` (“Print or save as PDF”).
All PDF look/layout comes from **`@media print` in `apps/web/app/globals.css`** plus `no-print` / `print-only` classes in the guide page.

So fixing the PDF = fixing print CSS (and optionally a dedicated print stylesheet / layout), not a separate PDF library.

## Current colour direction (what you’re looking at)

From `design/tokens.css`:
- Ground: cool slate-sage `--paper: #dfe8e5` (meant to kill beige)
- Accent: marigold `--brand: #d9923a`
- Ink: pine `--ink: #1a2c26`
- Dark theme via `[data-theme="dark"]` / `localStorage.theme`

## Files included below

- `design/tokens.css`
- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/manifest.ts`
- `apps/web/components/Chrome.tsx`
- `apps/web/components/Mark.tsx`
- `apps/web/components/SiteFooter.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/guide/[id]/page.tsx`
- `design/domela-brand.md`

---

## FILE: `design/tokens.css`

```css
/* Design tokens — Domela.

 * Cool slate-sage ground — not chalk, not cream. The previous mist (#f3f6f4)
 * still read as beige next to marigold; this ground is clearly green-grey.
 * Marigold stays the only interactive accent. Brand tints are cool washes,
 * never sand.
 *
 * Buttons: pine text on marigold fill — never white on marigold.
 * design/contrast.mjs verifies every pair and fails the build.
 */

:root {
  /* Surfaces — cool slate-sage (deliberately not cream) */
  --putty: #9eb5ae;
  --paper: #dfe8e5;
  --surface: #d0ddd8;
  --surface-sunk: #bfcfc9;
  --hairline: #aebfc0;
  --hairline-strong: #6a7f78;

  /* Ink — pine */
  --ink: #1a2c26;
  --ink-muted: #4f635b;

  /* Marigold — the single interactive accent */
  --brand: #d9923a;
  --brand-tint: #d5e3dd; /* cool sage wash, not sand */
  --on-brand: #1a2c26; /* pine on marigold — never white */
  --petrol: #d9923a; /* alias kept for contrast.mjs / legacy refs */

  /* Moss — done only */
  --done: #3f7a4d;
  --done-tint: #cfe0d4;

  --amber: #7a4c10; /* marigold deep AA on cool paper + amber-tint */
  --amber-tint: #d7e0d6; /* cool wash */

  --critical: #9e2b25; /* brick — safety only */
  --critical-tint: #f0d6d4;

  --id-petrol: #306369;
  --id-indigo: #485899;
  --id-plum: #7a3c6e;
  --id-clay: #8f4828;
  --id-olive: #566125;
  --id-forest: #2f5d3a;

  --radius-sm: 8px;
  --radius: 14px;
  --radius-lg: 22px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 28px;
  --space-7: 40px;

  --font-display: "Fraunces", "Newsreader", Georgia, serif;
  --font-ui: "Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --text-xs: 13px;
  --text-sm: 15px;
  --text-base: 17px;
  --text-read: 18px;
  --text-lg: 19px;
  --text-xl: 22px;
  --text-2xl: 28px;

  --shadow-card: 0 1px 1px rgba(26, 44, 38, 0.04), 0 2px 10px rgba(26, 44, 38, 0.06);
}

:root[data-theme="dark"] {
  --putty: #121c19;
  --paper: #15201c;
  --surface: #21302b;
  --surface-sunk: #101a17;
  --hairline: #31413b;
  --hairline-strong: #5a6f67;

  --ink: #dfe8e5;
  --ink-muted: #9aada5;

  --brand: #e0a04a;
  --brand-tint: #2a3832;
  --on-brand: #15201c;
  --petrol: #e0a04a;

  --done: #7abc89;
  --done-tint: #1e3228;

  --amber: #e0a04a;
  --amber-tint: #2a3832;

  --critical: #e49a98;
  --critical-tint: #4a2a29;

  --id-petrol: #75b8bf;
  --id-indigo: #a2acd3;
  --id-plum: #cf9ec6;
  --id-clay: #dd9f83;
  --id-olive: #a1b746;
  --id-forest: #7abc89;
}
```

## FILE: `apps/web/app/globals.css`

```css
/* The palette is imported from design/tokens.css rather than copied, so the
   contrast test in design/contrast.mjs guards the colours that actually ship
   instead of a spec sheet nobody runs. */
@import "../../../design/tokens.css";

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  /* iOS inflates text in landscape unless told not to, which breaks the layout
     of anything sized in a fixed viewport. */
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  /* Cool sage mist with a soft depth wash — avoids a flat cream slab. */
  background:
    radial-gradient(120% 70% at 100% -10%, rgba(110, 150, 145, 0.22), transparent 55%),
    radial-gradient(90% 50% at 0% 100%, rgba(90, 130, 140, 0.12), transparent 45%),
    var(--paper);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.15;
  margin: 0;
}

p {
  margin: 0;
}

a {
  color: var(--amber);
}

button,
input,
textarea,
select {
  font: inherit;
  color: inherit;
}

/* Every interactive element gets the same visible focus ring. Removing it is the
   single most common way a product becomes unusable by keyboard. */
:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Respect a user who has asked for less movement. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Layout ───────────────────────────────────────────────────────────────── */

.shell {
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-4) var(--space-7);
  min-height: 100dvh;
}

.topbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0 var(--space-5);
}

.topbar .mark {
  color: var(--ink);
  flex: none;
}

.topbar h1 {
  font-size: var(--text-lg);
  letter-spacing: -0.01em;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stack-tight {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spread {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.grow {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.muted {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.display {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
}

/* ── Cards ────────────────────────────────────────────────────────────────── */

.card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

/* A list of like things is one card with hairlines, not a card per item. Eight
   stacked cards read as eight separate decisions; a day is a single list. */
.rows {
  padding: 0;
}

.rows-item {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--hairline);
}

.rows-item:first-child {
  border-top: 0;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */

/* Destructive actions in a list are marks, not full-width red buttons. The red
   button repeated down a page reads as a warning about the page. */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-muted);
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--surface-sunk);
  color: var(--critical);
}

.preset-row {
  border-top: 1px solid var(--hairline);
  padding: var(--space-1) 0;
}

.preset-pick {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  text-align: left;
  background: transparent;
  border: 0;
  padding: var(--space-2) 0;
  cursor: pointer;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  /* 44px floor — the platform minimum. A thumb is about 9mm and a tired one is less
     accurate, so this does not go lower even though the type did. */
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: var(--brand);
  color: var(--on-brand);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--surface);
  color: var(--ink);
  border-color: var(--hairline-strong);
}

.btn-quiet {
  background: transparent;
  color: var(--ink-muted);
  border-color: transparent;
  min-height: 40px;
  padding: 0 var(--space-3);
  width: auto;
}

.btn-danger {
  background: transparent;
  color: var(--critical);
  border-color: transparent;
  min-height: 40px;
  padding: 0 var(--space-3);
  width: auto;
}

.btn-inline {
  width: auto;
}

/* ── Fields ───────────────────────────────────────────────────────────────── */

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field > label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.field .hint {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.input,
.textarea,
.select {
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-sm);
}

.textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.5;
}

/* ── Identity ─────────────────────────────────────────────────────────────── */

/* Colour is never the only signal. Every badge carries a symbol too, because
   these hues are confusable under deuteranopia and a caregiver picking "the blue
   one" for a child with a nut allergy must not be relying on colour vision. */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--text-lg);
  flex: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  background: var(--surface-sunk);
  border: 1px solid var(--hairline);
  font-size: var(--text-sm);
  cursor: pointer;
}

/* Selection is a solid fill rather than a tint. On a beige ground any tint pale
   enough to carry brand-coloured text is within 1.05:1 of the ground, which is a
   selected state you cannot see. */
.chip[aria-pressed="true"] {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--on-brand);
  font-weight: 600;
}

.chip .mark {
  color: var(--mark, inherit);
}

.chip[aria-pressed="true"] .mark {
  color: var(--on-brand);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* ── Critical content ─────────────────────────────────────────────────────── */

/* Reserved for allergies, medication and emergency instructions. Used anywhere
   else it stops carrying weight, and the one screen where it matters gets
   skimmed. */
.critical {
  background: var(--critical-tint);
  border: 1px solid var(--critical);
  border-radius: var(--radius);
  padding: var(--space-4);
}

.critical .eyebrow {
  color: var(--critical);
}

/* Guide content is set a size larger than the interface around it. The chrome can
   afford to be compact; the words a caregiver is decoding in a second language at
   2am cannot. */
.critical-body {
  white-space: pre-wrap;
  font-weight: 600;
  font-size: var(--text-read);
}

/* The guide's safety banner.
   
   A full red-tinted block the height of a screen was the loudest thing in the
   product and therefore the first thing skipped. This keeps the card surface of
   everything around it and spends its emphasis on one red rule and one red dot,
   which is enough to be unmistakable and little enough to be read. */
.safety {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--critical);
  border-radius: var(--radius);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
}

.safety-eyebrow {
  color: var(--critical);
}

.safety-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--critical);
  flex: none;
}

.safety-collapsed {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: var(--space-3) var(--space-4);
}

.notice {
  background: var(--amber-tint);
  border: 1px solid var(--amber);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
}

/* ── Guide ────────────────────────────────────────────────────────────────── */

.block-body {
  white-space: pre-wrap;
  font-size: var(--text-read);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.media-item img,
.media-item video {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--hairline);
  display: block;
  background: var(--surface-sunk);
}

.media-item figcaption {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-top: var(--space-1);
}

.routine-item {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--hairline);
}

.routine-item:last-child {
  border-bottom: 0;
}

.routine-time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--ink-muted);
}

.routine-note {
  display: block;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  margin-top: 2px;
}

/* A heading inside a hairline list belongs to the list, not to a row. */
.rows-head {
  padding: var(--space-3) var(--space-4) 0;
}

.rows .routine-item {
  padding: var(--space-3) var(--space-4);
}

/* A row that is both — one hairline between neighbours, not two. */
.rows-item.routine-item {
  border-bottom: 0;
}

a.routine-item {
  text-decoration: none;
  color: inherit;
}

.print-only {
  display: none;
}

/* ── Breathing ────────────────────────────────────────────────────────────── */

.breathing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-7) var(--space-4);
  text-align: center;
}

/* Four seconds in, four seconds out — a slow breath rather than a spinner, which
   is the difference between being told to wait and being given a moment. */
.breathing-mark {
  color: var(--ink);
  animation: breathe 8s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

.breathing-line {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 300;
  font-size: var(--text-xl);
  color: var(--ink-muted);
  max-width: 26ch;
}

/* ── Welcome ──────────────────────────────────────────────────────────────── */

.welcome {
  padding: var(--space-6) 0 var(--space-7);
}

.welcome h2 {
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-3);
}

.welcome p {
  color: var(--ink-muted);
  max-width: 32ch;
  line-height: 1.55;
}

.crown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-3);
  color: var(--ink);
}

/* Which house you are in. Quiet until you need it, which is most of the time. */
.house-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 60%;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  border: 1px solid var(--hairline-strong);
  background: transparent;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  cursor: pointer;
}

.house-option {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--hairline);
  cursor: pointer;
  color: inherit;
}

.house-option:first-child {
  border-top: 0;
}

.house-switch > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Ask ──────────────────────────────────────────────────────────────────── */

.answer {
  border-left: 3px solid var(--brand);
  padding-left: var(--space-4);
}

.citation {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.empty {
  text-align: center;
  padding: var(--space-6) var(--space-4);
  color: var(--ink-muted);
}

.site-footer {
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-7);
  text-align: center;
  font-size: var(--text-sm);
}

.site-footer a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.read .lede {
  font-size: var(--text-lg);
  color: var(--ink-muted);
  max-width: 36rem;
}

.plain-list {
  margin: 0;
  padding-left: 1.2rem;
}

.plain-list li {
  margin-bottom: var(--space-2);
}

.disclaimer {
  border-top: 1px solid var(--hairline);
  padding-top: var(--space-5);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--hairline);
  vertical-align: top;
}

.data-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: flex;
  }
  body {
    background: #fff;
  }
  .card,
  .safety {
    box-shadow: none;
  }
  .no-break,
  .safety {
    break-inside: avoid;
  }
}


/* Identity picker — colour swatches and glyph/emoji marks */
.identity-swatch {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
}
.identity-swatch[aria-pressed='true'] {
  border-color: var(--ink);
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--ink);
}
.identity-glyph {
  min-width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink);
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 var(--space-2);
}
.identity-glyph[aria-pressed='true'] {
  border-color: var(--brand);
  background: var(--brand-tint);
}
```

## FILE: `apps/web/app/layout.tsx`

```tsx
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
    { media: '(prefers-color-scheme: light)', color: '#dfe8e5' },
    { media: '(prefers-color-scheme: dark)', color: '#15201c' },
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
```

## FILE: `apps/web/app/manifest.ts`

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Domela',
    short_name: 'Domela',
    description: 'The household guide — everything they need while you are not there.',
    start_url: '/',
    display: 'standalone',
    background_color: '#dfe8e5',
    theme_color: '#d9923a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

## FILE: `apps/web/components/Chrome.tsx`

```tsx
'use client';

import Link from 'next/link';
import type { CareSubject } from '@mml/core';
import { Mark } from './Mark.tsx';

export function TopBar({ title, back }: { title: string; back?: string }) {
  return (
    <header className="topbar no-print">
      {back ? (
        <Link href={back} className="btn btn-quiet btn-inline" aria-label="Back">
          ←
        </Link>
      ) : (
        <span className="mark">
          <Mark size={30} />
        </span>
      )}
      <h1 className="grow">{title}</h1>
    </header>
  );
}

/** Colour plus symbol, always together. */
export function Badge({ subject, size = 40 }: { subject: CareSubject; size?: number }) {
  return (
    <span
      className="badge"
      style={{
        background: `var(${subject.identity.colourToken})`,
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
      aria-hidden="true"
    >
      {subject.identity.symbol}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
```

## FILE: `apps/web/components/Mark.tsx`

```tsx
/** The mark: the D is the door.
 *
 *  Capital D with the counter open to the baseline — an open doorway.
 *  Inside: the punctum (note left for whoever comes in).
 *  Spec: design/domela-brand.md
 */
export function Mark({
  size = 32,
  withPunctum = true,
}: {
  size?: number;
  withPunctum?: boolean;
}) {
  const showDot = withPunctum && size >= 24;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Stem */}
      <path d="M13 9 V39" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      {/* Open bowl — gap at the bottom-left of the counter creates the doorway */}
      <path
        d="M13 9 H25 C34.5 9 39 15.5 39 24 C39 32.5 34.5 39 25 39 H18"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {showDot && <rect x="21" y="21" width="6" height="6" fill="var(--brand, #d08a2c)" />}
    </svg>
  );
}
```

## FILE: `apps/web/components/SiteFooter.tsx`

```tsx
import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <p className="muted">
        Domela — the household guide.{' '}
        <Link href="/privacy">Privacy</Link>
        {' · '}
        <Link href="/data">Your data</Link>
      </p>
    </footer>
  );
}
```

## FILE: `apps/web/app/page.tsx`

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type SubjectKind, subjectLabel } from '@mml/core';
import { Badge } from '../components/Chrome.tsx';
import { Mark } from '../components/Mark.tsx';
import { KIND_HINT, KIND_LABEL, useActions, useAppState } from '../lib/store.ts';
import { loadSample } from '../lib/sample.ts';

const KINDS: readonly SubjectKind[] = ['child', 'pet', 'place'];

export default function Home() {
  const { household, handovers, trips, sampleId } = useAppState();
  const actions = useActions();
  const [adding, setAdding] = useState<SubjectKind | null>(null);
  const [name, setName] = useState('');
  const [switching, setSwitching] = useState(false);
  /** Open the switcher already asking for a name — used when the sample itself
   *  offers "start yours", so the person does not have to discover the switcher. */
  const [startNaming, setStartNaming] = useState(false);

  const empty = household.subjects.length === 0;
  const guides = handovers.filter((h) => h.householdId === household.id);
  const awayTrips = trips.filter((t) => t.householdId === household.id);
  const isSample = household.id === sampleId;

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!adding || !name.trim()) return;
    actions.addSubject(adding, name.trim());
    setName('');
    setAdding(null);
  }

  function openSwitcher(naming = false) {
    setStartNaming(naming);
    setSwitching(true);
  }

  return (
    <main className="shell">
      <div className="crown no-print">
        <Mark size={30} />
        {/* Always here, even with one household. It is how you find out you can have
            a second, and it is the only way back into the sample once you have left
            it. Hiding it until it looked useful made both of those unreachable. */}
        <button
          type="button"
          className="house-switch"
          onClick={() => (switching ? setSwitching(false) : openSwitcher(false))}
          aria-expanded={switching}
        >
          <span>{household.name || 'This household'}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      {switching && (
        <HouseSwitcher
          startNaming={startNaming}
          onDone={() => {
            setSwitching(false);
            setStartNaming(false);
          }}
          onSample={() => {
            const { household: sample, handover, presets, trips: sampleTrips } = loadSample();
            actions.addSample(sample, handover, presets, sampleTrips);
            setSwitching(false);
            setStartNaming(false);
          }}
        />
      )}

      <Welcome />

      {isSample && (
        <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
          This is a sample household, here to look around. Anything you change stays in it.{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => openSwitcher(true)}
          >
            Start your own
          </button>
          — the sample stays here.
        </p>
      )}

      <section className="stack">
        <h2 className="eyebrow">Who is here</h2>
        {household.subjects.map((subject) => (
          <Link key={subject.id} href={`/subjects/${subject.id}`} className="card card-link">
            <div className="row">
              <Badge subject={subject} />
              <span className="grow">
                <strong>{subjectLabel(subject)}</strong>
                <span className="muted" style={{ display: 'block' }}>
                  {KIND_LABEL[subject.kind]} · {subject.entries.length}{' '}
                  {subject.entries.length === 1 ? 'note' : 'notes'}
                </span>
              </span>
              <span aria-hidden="true" className="muted">
                →
              </span>
            </div>
          </Link>
        ))}

        {adding === null ? (
          <div className="chips">
            {KINDS.map((kind) => (
              <button key={kind} type="button" className="chip" onClick={() => setAdding(kind)}>
                + {KIND_LABEL[kind]}
              </button>
            ))}
          </div>
        ) : (
          <form className="card stack" onSubmit={add}>
            <div className="field">
              <label htmlFor="new-name">{KIND_LABEL[adding]} name</label>
              <span className="hint">{KIND_HINT[adding]}</span>
              <input
                id="new-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={adding === 'place' ? 'The flat' : 'Their name'}
                autoFocus
              />
            </div>
            <div className="row">
              <button type="submit" className="btn" disabled={!name.trim()}>
                Add
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setAdding(null);
                  setName('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {!empty && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="eyebrow">Guides</h2>
          {guides.map((handover) => (
            <Link key={handover.id} href={`/guide/${handover.id}`} className="card card-link">
              <strong>{handover.caregiverName || 'Untitled guide'}</strong>
              <span className="muted" style={{ display: 'block' }}>
                {handover.caregiverRelationship || 'Caregiver'}
              </span>
            </Link>
          ))}
          <Link href="/guide/new" className="btn">
            Create a guide
          </Link>
          <Link href="/household" className="btn btn-secondary">
            Contacts and daily routine
          </Link>
        </section>
      )}

      {!empty && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="eyebrow">Away</h2>
          <p className="muted">Packing for trips — part of organising the household.</p>
          {awayTrips.map((trip) => (
            <Link key={trip.id} href={`/away/${trip.id}`} className="card card-link">
              <strong>{trip.title}</strong>
              <span className="muted" style={{ display: 'block' }}>
                {trip.destinationLabel || trip.startDate}
              </span>
            </Link>
          ))}
          <Link href="/away/new" className="btn">
            Plan a trip
          </Link>
        </section>
      )}

      {empty && !sampleId && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          Want to look around first?{' '}
          <button
            type="button"
            className="btn btn-quiet btn-inline"
            style={{ textDecoration: 'underline' }}
            onClick={() => {
              const { household: sample, handover, presets, trips: sampleTrips } = loadSample();
              actions.addSample(sample, handover, presets, sampleTrips);
            }}
          >
            Load a sample household
          </button>
        </p>
      )}
    </main>
  );
}

/** The first thing on the screen, and the reason the screen is not a list of
 *  records. Someone opening this has just remembered they are leaving in an hour;
 *  being greeted rather than queried is most of the difference. */
function Welcome() {
  const { household } = useAppState();
  // The greeting depends on the clock, which the server does not share, so it waits
  // for the client rather than rendering a guess and correcting it.
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  // "Léa, Pomme and The flat" reads as a typo. A place is usually named with its
  // article, which is right as a title and wrong halfway through a sentence.
  const names = household.subjects
    .map((s) => s.name)
    .filter(Boolean)
    .map((name, i) => (i === 0 ? name : name.replace(/^(The|Le|La|Les) /, (m) => m.toLowerCase())));
  const listed =
    names.length === 0
      ? null
      : names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

  return (
    <section className="welcome">
      <h2 className="display">{greeting ? `${greeting}.` : '\u00a0'}</h2>
      <p>
        {listed
          ? `${listed} — everything about them, written down once, ready for whoever has them next.`
          : 'Everything they need while you are not there. Write it once, with photos, and they can just ask it.'}
      </p>
    </section>
  );
}

function HouseSwitcher({
  onDone,
  onSample,
  startNaming = false,
}: {
  onDone: () => void;
  onSample: () => void;
  startNaming?: boolean;
}) {
  const { households, household, sampleId } = useAppState();
  const actions = useActions();
  const [naming, setNaming] = useState(startNaming);
  const [name, setName] = useState('');

  // Parent can ask us to open the name field after we are already mounted
  // (e.g. "Start your own" while the switcher is open). useState alone only
  // reads startNaming on the first mount, so without this the button looked dead.
  useEffect(() => {
    if (startNaming) setNaming(true);
  }, [startNaming]);

  return (
    <div className="card rows" style={{ marginBottom: 'var(--space-5)' }}>
      {households.map((h) => (
        <button
          key={h.id}
          type="button"
          className="rows-item row house-option"
          onClick={() => {
            actions.selectHousehold(h.id);
            onDone();
          }}
        >
          <span className="grow">
            <strong>{h.name || 'Unnamed household'}</strong>
            <span className="muted" style={{ display: 'block' }}>
              {h.id === sampleId ? 'Sample' : `${h.subjects.length} to look after`}
            </span>
          </span>
          {h.id === household.id && <span aria-hidden="true">✓</span>}
        </button>
      ))}

      <div className="rows-item stack-tight">
        {naming ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              actions.addHousehold(name.trim());
              setName('');
              setNaming(false);
              onDone();
            }}
          >
            <input
              className="input grow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The country house"
              aria-label="Household name"
              autoFocus
            />
            <button type="submit" className="btn btn-inline" disabled={!name.trim()}>
              Add
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => setNaming(true)}>
            + Another household
          </button>
        )}

        {/* The sample is a household like any other, so it can be brought back
            after it has been left. It used to be a mode, and leaving it meant
            deleting it. */}
        {!sampleId && (
          <button type="button" className="btn btn-quiet" onClick={onSample}>
            Show the sample household
          </button>
        )}
      </div>
    </div>
  );
}
```

## FILE: `apps/web/app/guide/[id]/page.tsx`

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type GuideBlock,
  UnsafeGuideError,
  buildVerifiedGuide,
  routineItemLabel,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { LanguageToggle } from '../../../components/LanguageToggle.tsx';
import { MediaThumb } from '../../../components/MediaField.tsx';
import { buildShareUrl } from '../../../lib/share.ts';
import { useActions, useAppState } from '../../../lib/store.ts';
import { track } from '../../../lib/trial.ts';

/** Whose part of the guide is on screen. `all` is the default and the one a guide
 *  is printed in; the rest exist because a caregiver mid-task is doing one thing for
 *  one of them and should not be reading past the other two. */
type Focus = 'all' | string;

export default function GuidePage() {
  const { id } = useParams<{ id: string }>();
  const { households, household: active, handovers } = useAppState();
  const [focus, setFocus] = useState<Focus>('all');
  const [acknowledged, setAcknowledged] = useState(false);
  const [shareState, setShareState] = useState<
    'idle' | 'working' | 'copied' | 'failed' | 'too-large'
  >('idle');
  /** Explicit opt-in: photos only travel with the link when the parent ticks this. */
  const [includePhotos, setIncludePhotos] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const actions = useActions();

  const handover = handovers.find((h) => h.id === id);
  // A guide names the household it belongs to, so a link to one opens correctly
  // whichever household happens to be selected.
  const household = households.find((h) => h.id === handover?.householdId) ?? active;

  // Acknowledgement is per guide and per device: it means "this caregiver, on this
  // phone, has seen the allergies". It is deliberately not synced or shared, because
  // one person reading it is not the next person reading it.
  const ackKey = `mml.safety-ack.${id}`;
  useEffect(() => {
    setAcknowledged(window.localStorage.getItem(ackKey) === '1');
  }, [ackKey]);

  useEffect(() => {
    if (handover) track('guide');
  }, [handover]);

  // buildVerifiedGuide builds from facts, applies enrichment, then asserts that
  // nothing safety-critical was lost or altered on the way. It throws rather than
  // rendering a guide that quietly dropped an allergy — a guide that refuses to
  // render is recoverable and one that silently omits is not.
  const result = useMemo(() => {
    if (!handover) return null;
    try {
      return { guide: buildVerifiedGuide(household, handover), error: null as string | null };
    } catch (error) {
      return {
        guide: null,
        error:
          error instanceof UnsafeGuideError
            ? error.message
            : 'This guide could not be built safely.',
      };
    }
  }, [household, handover]);

  if (!handover || !result) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
        <p className="muted">This guide has been removed.</p>
      </main>
    );
  }

  if (result.error || !result.guide) {
    return (
      <main className="shell">
        <TopBar title="Guide" back="/" />
        <div className="critical stack-tight">
          <div className="eyebrow">Not safe to show</div>
          <p>{result.error}</p>
          <p className="muted">
            Nothing has been lost — this is the check that stops a guide going out with something
            important missing.
          </p>
        </div>
      </main>
    );
  }

  const guide = result.guide;
  const subjects = subjectsFor(household, handover);

  // Filtering never hides a safety-critical block. Narrowing to the dog must not be
  // a way to stop being told about the child's EpiPen, so `critical` is taken from
  // the whole guide and only the readable content below it responds to the filter.
  const critical = guide.blocks.filter((b) => b.critical);
  const inFocus = (b: GuideBlock) =>
    focus === 'all' || b.subjectId === focus || b.subjectId === undefined;
  const rest = guide.blocks.filter((b) => !b.critical && inFocus(b));
  const routine = guide.routine.filter(
    (r) => focus === 'all' || r.appliesTo === focus || r.appliesTo === 'all',
  );
  const focused = subjects.find((s) => s.id === focus);

  // Every heading is "Pomme (Labrador, 7) — Walks", which is right in a whole guide
  // and pure repetition once the filter above already says Pomme.
  const heading = (block: GuideBlock) =>
    focused && block.subjectId === focused.id
      ? block.heading.split(' — ').slice(1).join(' — ') || block.heading
      : block.heading;

  return (
    <main className="shell">
      <TopBar title={handover.caregiverName || 'Guide'} back="/" />

      <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="muted">
          For {handover.caregiverName || 'whoever is looking after things'}
          {handover.caregiverRelationship ? ` · ${handover.caregiverRelationship}` : ''}
        </p>
        <LanguageToggle
          value={handover.language}
          onChange={(language) => actions.saveHandover({ ...handover, language })}
        />
        <div className="row no-print" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Link href={`/guide/${handover.id}/ask`} className="btn">
            Ask about anything
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={shareState === 'working'}
            onClick={() => {
              void (async () => {
                setShareState('working');
                setShareNote(null);
                try {
                  const result = await buildShareUrl(household, handover, { includePhotos });
                  if (!result.ok) {
                    setShareState('too-large');
                    setShareNote(
                      'Those photos make the link too big to send. Untick photos and send the text, or remove a few pictures and try again.',
                    );
                    return;
                  }
                  let note =
                    includePhotos && result.omittedVideos > 0
                      ? `${result.photoCount} photo${result.photoCount === 1 ? '' : 's'} included. Short videos stay on this phone — they are too large for a link.`
                      : includePhotos
                        ? result.photoCount === 0
                          ? 'No photos on this guide yet — the link is text only.'
                          : `${result.photoCount} photo${result.photoCount === 1 ? '' : 's'} included. Anyone with the link can see them.`
                        : 'Text only — photos stayed on this phone.';
                  if (result.short) {
                    note = `${note} Short link ready — easy to paste into WhatsApp. Expires in 14 days.`;
                  } else {
                    note = `${note} Could not shorten the link, so this one is long — still works.`;
                  }
                  setShareNote(note);
                  if (navigator.share) {
                    await navigator.share({
                      title: `Guide for ${handover.caregiverName || 'caregiver'}`,
                      text: 'Everything they need while you are not there.',
                      url: result.url,
                    });
                    setShareState('copied');
                  } else {
                    await navigator.clipboard.writeText(result.url);
                    setShareState('copied');
                  }
                } catch {
                  setShareState('failed');
                  setShareNote(null);
                }
              })();
            }}
          >
            {shareState === 'copied'
              ? 'Link ready'
              : shareState === 'failed'
                ? 'Could not share'
                : shareState === 'too-large'
                  ? 'Link too large'
                  : shareState === 'working'
                    ? 'Preparing…'
                    : 'Send to caregiver'}
          </button>
        </div>
        <label className="row no-print" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => {
              setIncludePhotos(e.target.checked);
              setShareState('idle');
              setShareNote(null);
            }}
          />
          <span>
            Include photos in this link
            <span className="muted" style={{ display: 'block' }}>
              Off by default. When on, pictures are added to the short link so the caregiver can see
              them — anyone with the link can see them too.
            </span>
          </span>
        </label>
        <p className="hint no-print">
          Send creates a short private link for their phone — guide plus Ask. It expires after 14
          days.
          {shareNote ? ` ${shareNote}` : ''}
        </p>
      </div>

      <SafetyBlock
        blocks={critical}
        acknowledged={acknowledged}
        onAcknowledge={() => {
          window.localStorage.setItem(ackKey, '1');
          setAcknowledged(true);
        }}
      />

      {subjects.length > 1 && (
        <FocusFilter subjects={subjects} focus={focus} onChange={setFocus} />
      )}

      {routine.length > 0 && (
        <section className="card rows no-break" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="rows-head">
            <span className="eyebrow">
              {focused
                ? focused.kind === 'place'
                  ? `${focused.name} — while you are here`
                  : `${focused.name} — a typical day`
                : subjects.every((s) => s.kind === 'place')
                  ? 'While you are here'
                  : 'A typical day'}
            </span>
          </div>
          {routine.map((item) => {
            const who = subjects.find((s) => s.id === item.appliesTo);
            const title = routineItemLabel(item);
            return (
              <div key={item.id} className="routine-item">
                <span className="routine-time">
                  {item.time ?? (item.priority === 'nice' ? 'Nice' : item.priority === 'must' ? 'Must' : '—')}
                </span>
                <span>
                  <strong>{title}</strong>
                  {item.section && <span className="muted"> · {item.section}</span>}
                  {who && focus === 'all' && <span className="muted"> · {who.name}</span>}
                  {item.product && <span className="routine-note">Use {item.product}</span>}
                  {item.notes && <span className="routine-note">{item.notes}</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <section className="stack">
        {rest.map((block) => (
          <article key={block.id} className="card stack-tight no-break">
            <strong>{heading(block)}</strong>
            {block.body && <p className="block-body">{block.body}</p>}
            {block.media.length > 0 && (
              <div className="media-grid">
                {block.media.map((m) => (
                  <MediaThumb key={m.id} media={m} />
                ))}
              </div>
            )}
          </article>
        ))}
        {rest.length === 0 && routine.length === 0 && (
          <p className="muted">Nothing was written down for this one.</p>
        )}
      </section>

      {handover.signOff && (
        <p className="muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          {handover.signOff}
        </p>
      )}

      <div className="row no-print" style={{ marginTop: 'var(--space-6)' }}>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
    </main>
  );
}

function FocusFilter({
  subjects,
  focus,
  onChange,
}: {
  subjects: readonly CareSubject[];
  focus: Focus;
  onChange: (focus: Focus) => void;
}) {
  return (
    <div className="chips no-print" style={{ marginBottom: 'var(--space-4)' }}>
      <button
        type="button"
        className="chip"
        aria-pressed={focus === 'all'}
        onClick={() => onChange('all')}
      >
        Everyone
      </button>
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          className="chip"
          aria-pressed={focus === subject.id}
          onClick={() => onChange(subject.id)}
        >
          {/* The same symbol and colour the subject carries everywhere else, so the
              filter is recognised rather than read. Handed to CSS as a variable so
              the selected state can override it without fighting an inline style. */}
          <span
            className="mark"
            aria-hidden="true"
            style={{ '--mark': `var(${subject.identity.colourToken})` } as React.CSSProperties}
          >
            {subject.identity.symbol}
          </span>
          {subject.name}
        </button>
      ))}
    </div>
  );
}

/** Allergies, medication and emergency instructions.
 *
 *  Two things are true at once: this must be read before anything else, and a wall
 *  of red at the top of every screen stops being read at all. So it opens loud,
 *  asks to be acknowledged once, and then holds its place as a single quiet line
 *  that reopens on tap. The content is never removed, only folded — and printing
 *  always gets the full text regardless of what was tapped on screen.
 */
function SafetyBlock({
  blocks,
  acknowledged,
  onAcknowledge,
}: {
  blocks: readonly GuideBlock[];
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  const [reopened, setReopened] = useState(false);
  if (blocks.length === 0) return null;

  const open = !acknowledged || reopened;

  const body = blocks.map((block) => (
    <div key={block.id} className="stack-tight">
      <strong>{block.heading}</strong>
      <p className="critical-body">{block.body}</p>
    </div>
  ));

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="safety safety-collapsed no-print"
          onClick={() => setReopened(true)}
          aria-expanded={false}
        >
          <span className="safety-dot" aria-hidden="true" />
          <span className="grow">Allergies, medication and emergencies</span>
          <span className="muted">Read · show</span>
        </button>
        {/* Folded on screen is not folded on paper. The printed guide is the copy
            that ends up on the fridge, and it carries the whole thing. */}
        <section className="safety stack print-only">{body}</section>
      </>
    );
  }

  return (
    <section className="safety stack" aria-labelledby="safety-heading">
      <div className="row">
        <span className="safety-dot" aria-hidden="true" />
        <span id="safety-heading" className="eyebrow safety-eyebrow grow">
          Read this first
        </span>
      </div>

      {body}

      {acknowledged ? (
        <button type="button" className="btn btn-quiet no-print" onClick={() => setReopened(false)}>
          Hide again
        </button>
      ) : (
        <button type="button" className="btn btn-secondary no-print" onClick={onAcknowledge}>
          I have read this
        </button>
      )}
    </section>
  );
}
```

## FILE: `design/domela-brand.md`

```md
# Domela — brand pitch

*The household guide*

---

## 1. Objective

**Business objective.** Prove that a household will pay to hand over its knowledge once, and that the person receiving it will actually use it. Everything else is downstream.

**Brand objective.** Own the handover. When someone in London thinks "I need to explain the house to someone else," the word that arrives should be Domela — not a note app, not a chore chart, not a WhatsApp thread.

**The measure of success is not installs.** It is: did the second reader open it, unprompted, more than once. A brand that gets bought but not opened is a brand that churns in six weeks.

---

## 2. The problem

Every household runs on knowledge that lives in one person's head. Where the spare key is. Which cloth is for the pan. That the little one will claim she's allowed screens after dinner, and she isn't.

When you leave, you try to transfer all of it in a text message on the way out of the door. It fails predictably. She forgets, or she guesses, or she calls you in a meeting. So you either micromanage or you come home to a routine you don't recognise.

**The enemy is the long text message.** Name it, everywhere.

---

## 3. Positioning

**Domela is the guide you write once.** Photos of the exact thing, so nothing has to be interpreted. A timeline, so she knows what matters when. And she can ask it questions and get answers in her own language, without asking you.

| Domela is | Domela is not |
|---|---|
| The handover | A chore app |
| One household, one guide | A family organiser |
| A reference she consults | A task list you assign |
| Warm, adult, plain | "Mum life", pastel, cursive |

**The dignity rule.** The second reader is a competent adult doing a job. Every word in the product treats her that way. No completion policing, no reporting back, no surveillance framing. This is the single thing that differentiates Domela from everything adjacent, and it is a brand decision before it is a copy decision.

---

## 4. The name

**Domela.** Built on *dom* — home in Latin (*domus*) and, critically, in Polish, Czech, Croatian and Russian. Your buyer reads it as domestic. Your second reader in London, who is often Polish or Romanian, reads her own word for house.

| Test | Result |
|---|---|
| "You should try Domela." | Stands alone, sounds like a brand |
| Spell from hearing | One stress, one spelling |
| Warmth | Vowel ending, soft consonants |
| Namespace | No company, app or mark found. **Clearance still required — §9** |
| Second reader | Legible across Slavic and Romance languages |

**Why not Domelum.** The `-um` ending reads as Latin motto or prescription, the English eye says DOME-lum while the Latin says do-MEH-lum, and it sits phonetically nearer the industrial *Dom-* brands — Domestos, Dometic, Domel. Domela steps away from all three.

**The line to say after the name, always:** *Domela — the household guide.* It does the explaining so the name doesn't have to.

---

## 5. Voice

| Rule | Example |
|---|---|
| Short declaratives | "The bins go out Tuesday night." |
| You address the writer. The guide addresses the reader. | To you: "Add a photo." To her: "The spare key is here." |
| Photos replace adjectives | Never "the good blue cloth". Show it. |
| No apology, no hedging | Not "if you could just…". "Tuesday night." |
| Never cute | No emoji in product chrome. Emoji in her content is her choice. |

---

## 6. The mark

**The D is the door.** A capital D whose counter is cut through to the baseline, so the letter reads as an open doorway. Not a house, not a roof, not a key — those are the three clichés of the category. Inside the doorway sits a small square, the punctum: the note left for whoever comes in.

| Asset | Spec |
|---|---|
| App icon | Clay tile `#E3D3BC`, corner radius 22% of tile, D in pine `#22332C`, punctum in marigold `#D08A2C` |
| Monochrome | D in pine, no punctum. Use below 24px |
| Reversed | Pine tile, D in chalk `#FBF6EE` |
| Minimum size | 16px. Below that, drop the punctum |
| Clear space | One punctum-width on all sides |

**Do not:** outline the mark, add a gradient, close the doorway, sit the mark on marigold, or place the wordmark inside the tile.

---

## 7. Colour — the "Shutter" palette

The previous system was putty and near-black. It read as quiet editorial, which is not the same as warm. The fix is not more colour, it is a **dark with hue in it**: black is an absence, pine is a decision.

| Token | Hex | Role |
|---|---|---|
| Chalk | `#FBF6EE` | App ground. Lighter and less yellow than putty |
| Sand | `#F1E7D8` | Cards and raised surfaces |
| Clay | `#E3D3BC` | Icon tile, dividers, marketing surfaces. Your old putty, demoted to where it was always strongest |
| Pine | `#22332C` | All primary text and the mark. Replaces `#2c2721` |
| Sage | `#5A6B60` | Secondary text |
| Marigold | `#D08A2C` | Interactive and brand accent. Fills, buttons, the punctum |
| Marigold deep | `#A96A18` | Marigold as small text or icons on a light ground |
| Moss | `#4E8C5B` | Done state only |
| Brick | `#9E2B25` | Safety only, and never colour alone — always with an icon or word |

**Retired:** raspberry `#d9577e` (fights marigold and tips pink-on-beige toward the pastel parenting category), Lisette blue `#445f72` (same value as petrol, read as one colour), petrol `#306369` (pine now carries the green).

### Contrast, checked

| Pair | Ratio | Verdict |
|---|---|---|
| Pine on chalk | ~12.3:1 | Excellent |
| Pine on sand | ~10.7:1 | Excellent |
| Sage on chalk | ~5.2:1 | Passes AA at body size |
| Sage on sand | ~4.6:1 | Passes AA, but don't go below 15px |
| **Pine text on marigold fill** | ~4.6:1 | Passes. **Buttons use pine text, never white** |
| Marigold on chalk | ~2.7:1 | **Fills and large shapes only. Never small text — use marigold deep** |

Your reader is often looking at this one-handed in a dim utility room. These floors are not decorative.

---

## 8. Type

| Role | Face | Spec |
|---|---|---|
| Display | **Fraunces** (recommended) or Newsreader | Minimum 20px |
| UI and body | Figtree | Body **17px**, not 15 |
| Timeline times | Figtree | Tabular numerals on. Times must align to scan |

**On the display face.** Newsreader is handsome but austere, and austerity is half of what made the old system feel taciturn. Fraunces carries more warmth at the same size and holds a Latin-rooted name well. Both are on Google Fonts, so switching costs you one line. Set them side by side at 33px and pick with your eyes — this is the one decision here that is genuinely taste, not analysis.

---

## 9. Before anything ships

- [ ] UKIPO search, classes 9 and 42
- [ ] EUIPO search, classes 9 and 42
- [ ] USPTO search, classes 9 and 42
- [ ] App Store and Google Play exact-match search for "Domela"
- [ ] Companies House name check
- [ ] Domains: `domela.com`, `domela.app`, `domela.co`, plus `getdomela.com` as fallback
- [ ] Google "domela" in French, Polish, Portuguese, Italian, Spanish and Romanian for accidental meanings
- [ ] If clear, **file the UK word mark before launch.** Cheap relative to a rebrand

---

## 10. Next three moves

1. **Run the clearance.** Everything downstream is blocked on it, and I have been wrong before by recommending a name I hadn't checked.
2. **Pick the display face.** Fraunces or Newsreader, side by side, 33px, decide in five minutes.
3. **Start the handover test.** Eight households with a real absence in the next fortnight. One metric: did the second reader open it, unprompted, more than once.

The brand is now far enough along that it is no longer the thing holding you back. The test is.
```

## EXTRACT: print CSS only (`apps/web/app/globals.css`)

```css
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: flex;
  }
  body {
    background: #fff;
  }
  .card,
  .safety {
    box-shadow: none;
  }
  .no-break,
  .safety {
    break-inside: avoid;
  }
}
```

## Ask Claude to redesign

Please propose:

1. **A new colour system** (CSS variables in `design/tokens.css`) that does not feel muddy sage/beige, keeps marigold optional or replaces it, and works light+dark.
2. **Adaptive print/PDF layout** for the caregiver guide: readable on A4/Letter and mobile “Save as PDF”, clear hierarchy (safety → routine → notes), sensible page breaks, no wasted chrome, photos that don’t blow the page.
3. Concrete patched file contents for `design/tokens.css`, the `@media print` section of `globals.css`, and any guide-page markup changes needed.

Constraints:
- Brand name is **Domela** (household caregiver guide).
- Prefer CSS variables; don’t invent a second design system.
- Print must still work via `window.print()` unless you explicitly recommend a real PDF pipeline.
