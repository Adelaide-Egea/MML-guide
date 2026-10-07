# Decisions

Sensible defaults made while building Mums' Night Out.

## Data layer

- **In-memory fallback when Supabase env vars are missing.** The app runs fully (member + admin flows, separation) without a live Supabase project so local demos and the separation test work out of the box. When `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, all reads/writes go through the service-role client instead. Anon has no table access (RLS on, no policies).
- **Poll every 15s for live vote updates** instead of Supabase Realtime channels. Keeps group scoping trivial (server actions only return this group's data) and avoids leaking channel names across groups.
- Seed invite tokens are fixed long URL-safe strings so README / local demos have stable links. Production: regenerate from `/admin` → Links after deploy.

## Auth

- **Admin:** Supabase magic link; session email must equal `ADMIN_EMAIL`. Non-admins get 404 on `/admin/**` (not 401) so the route doesn't advertise itself.
- **Local demo without Supabase:** `/admin/login` accepts the `ADMIN_EMAIL` value and sets an httpOnly admin cookie. Documented as demo-only; production must use magic link.
- **Members:** no accounts. Cookie `mno_member` = `{ group_id, member_id }`, httpOnly, 1 year. Mismatch with the link's group → ignore and ask "Who are you?" again.

## Timezone & dates

- All display and closing times use **Europe/London** via `date-fns-tz`.
- Round `closes_at` is computed in London time when voting opens.
- After `closes_at`, tiles lock from the timestamp alone (no cron).

## Group rules

- French tabs: Shows + Dinner & drinks (`show` + `food`). Budget filter £50 on shows. Evening rounds only (no day walks).
- Barnes tabs: Drinks + Food. Only `flexible_arrival = true`. No preferred tube lines. **Night outs + day walks** (`supports_day_meetups`). Day rounds vote morning/afternoon per date, then skip venue picking.
- Date-first then options: after a night is chosen, hearts are **preferences** (not a live booking guarantee). Options can carry `open_days` + `availability_note`; mums can leave short comments under a venue.
- Multi-evening voting is intentional — tap every night you're free.
- Private URLs are always `/g/{invite_token}` — never `/g/french` or `/g/barnes`.

## Design

- Fonts: Gloock (display), Figtree (body), IBM Plex Mono (numbers/dates).
- **Seasonal palettes** via `data-season` on `<html>` (Europe/London meteorological seasons). Spring blossom, summer evening, autumn glow (default now), winter sparkle — each with light + dark variants and a light CSS motif. Home page has a preview switcher; production always follows the calendar.
- Marquee gold (or seasonal highlight) for New + countdown.
- Logo: conceptual outline mark (three blank head-and-shoulder arcs, table line, stemware, gold sparkles) — not illustrated people. SVG source in `public/logo.svg`; JPG for app icons. Brand mark has a light CSS twinkle.
- Seasonal cheer animation plays ~4s then fades (respects `prefers-reduced-motion`).
- Dev server binds to port **3456** to avoid common conflicts.

## Members

- SQL seed leaves `members` empty. **No fake names** in the live app.
- Mums add their own first name on first visit (`I'm new — add my name`). Cookie `mno_member` remembers them for a year so they tap their name next time.
- Admin can still add/rename/deactivate from `/admin`.

## Supabase

- Live data uses the existing Supabase project the organiser’s API token can access (`Threshold` / `jgqemguvrslzrbedjirq`, eu-west-2). Mums’ Night Out tables (`groups`, `members`, …) sit alongside other apps’ tables; names don’t clash. Prefer a dedicated project later if you want full isolation.
- Auth **Site URL** must be `https://mums-night-out.vercel.app` (not localhost), or magic-link emails open on the phone as `localhost` and fail.

