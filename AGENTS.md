# Notes for coding agents (Cursor, Claude)

The owner is not a developer, works from her phone and pays per use. Keep changes small, open a
pull request (never push to `main`), and explain what changed in plain English.

## What this is
Domela, the household guide (free). Parents write the routines for a child, pet or place once,
with photos, and send a caregiver one link. Live at www.domela.app. Sister product: Domela Baby Prep
(paid, repo `Adelaide-Egea/domela-baby-prep`), which shares this brand.

## Map
- `apps/web` — Next.js app. Pages in `apps/web/app`, components in `apps/web/components`.
- `packages/core/src` — the logic (guides, routines, answering). `chrome.ts` holds UI strings in
  several languages; add new parent-only strings as optional fields with an English fallback.
- `apps/web/app/api/answer/route.ts` — Ask. Answers only from the guide; safety fields never sent.
- `design/tokens.css` — the colour tokens ("Linen"). `design/domela-brand.md` — brand rules.
- Ignore `archive/`, `handoff/` and the long `DOMELA-UI-AND-PDF-FOR-CLAUDE.md` unless asked.

## Rules
1. Privacy: household content stays on the device. Only caregiver links (14 days) and Ask leave it.
   Never add accounts, trackers or uploads without the owner saying yes. Update `/privacy` with any change.
2. Brand: linen paper, pine ink `#2a3a33`, honey `#d39a4a` fills with ink text (never white on honey),
   Figtree + Fraunces, the D-door mark (`components/Mark.tsx`). `npm run test:contrast` must pass.
3. Nothing internal goes in `apps/web/public` — everything there is downloadable by anyone.
4. UK English, plain words, short sentences. Not medical advice.

## Before opening a PR
`npm test` and `npm run build` must pass.
