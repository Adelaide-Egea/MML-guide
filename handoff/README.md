# Domela — key files for Vercel / visual pass

These are the files that changed for:
1. **Linen palette** (`design/tokens.css`) — warm paper, honey accent, white photo mounts
2. **Hotel-card caregiver view** (`apps/web/app/c/page.tsx` + hotel styles in `globals.css` / `print.css`)
3. **Sample household** — Chez Martin is an example. **Start your own** calls `addHousehold('')` which removes the sample from the list (`apps/web/lib/store.ts` + `apps/web/app/page.tsx`)
4. **Home lists** — Who is here / Guides / Away are one `card rows` list, not stacked cards

## Deploy
- Preview (this branch): see the agent message for the live Vercel URL
- Production `domela.app` only updates after this PR merges to `main`
- Old URLs like `*-kn5i8mw.vercel.app` will **not** show these changes

## Quick check after deploy
1. Open home → sample banner says example, not a household
2. Tap **Start your own** → Martin disappears; blank household remains
3. Open a caregiver link `/c#…` → hotel desk card (greeting, safety, timeline), not a form dump
