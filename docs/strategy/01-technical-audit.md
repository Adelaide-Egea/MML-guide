# 1. Existing technical architecture audit

**Date:** September 2026
**Scope:** `mml-held` repository (this repo), plus the Readied application files and Supabase
configuration supplied separately.
**Method:** full static read of every file. No code was modified, no data was deleted, and no
requests were made against the live Supabase project.

---

## 1.1 What actually exists

The brief describes an "MML ecosystem" with a database, authentication, APIs, routes, components,
a design system and a Home experience. That is the ambition, not the current state. It is important
to be plain about this, because it changes the shape of the work: **there is no application to
refactor. There are two standalone HTML files.**

| | Held (care guides) | Readied (packing lists) | Colour Keeper |
|---|---|---|---|
| Location | this repo | supplied as loose files; deployed separately | **not supplied — see 1.9** |
| Form | one 175 KB `index.html` | one ~150 KB `index.html` | unknown |
| Lines of code | 2,676 (HTML + CSS + JS in one file) | 2,349 (same) | unknown |
| Framework | none — vanilla DOM | none — vanilla DOM | unknown |
| Build step | none | none | unknown |
| Package manager | none (no `package.json`) | none | unknown |
| Backend | one Vercel function, 51 lines | one Vercel function, 45 lines | unknown |
| Database | none — `localStorage` only | Supabase (2 tables) | unknown |
| Authentication | none | none | unknown |
| Tests | none | none | unknown |
| Analytics | none | custom events → Supabase | unknown |
| Payments | none (a fake paywall — see 1.6) | none | unknown |
| Shared code with the other app | none | none | — |
| Shared design tokens | none | none | — |

Full inventory of this repository:

```
index.html          2,676 lines   the entire Held application
api/generate.js        51 lines   Anthropic proxy
example-guide.html    167 lines   orphaned static sample (never linked — see 1.7)
sw.js                  53 lines   service worker (never registered — see 1.7)
manifest.json          17 lines   PWA manifest (never linked — see 1.7)
vercel.json            29 lines   cache-control headers, two of which target dead files
bump.py                83 lines   deploy helper whose main regex no longer matches
```

Git history is 70 commits, all titled "Add files via upload" — the GitHub web uploader. There is no
branching, no review, no CI, and no way to see what changed in any given commit without diffing by
hand. The whole history runs from 30 June to 30 July 2026.

### The honest summary

These are **prototypes that reached production**. That is not an insult — Readied in particular
contains genuinely thoughtful engineering, and both apps demonstrably work. But every structural
property you would need for an ecosystem (accounts, a shared user, a household, a shared component
library, a shared design system, server-side authorisation, tests) is absent, and cannot be
retrofitted into a 2,700-line single file without a rebuild.

---

## 1.2 Held — technical detail

**Architecture.** A single `<div class="phone">` capped at `max-width: 430px` with `body {
overflow: hidden }`. Screens are absolutely-positioned `<section>` elements toggled by a
`.active` class. Navigation is a hand-rolled step machine over a `FLOW` array:

```
intro → format → essentials → children → caregiver → routine → emergency → finish
```

with a nested three-step sub-flow (`c-basics`, `c-care`, `c-personality`) reached from the
children hub. This is a competent state machine for what it is.

**Data model.** Three module-scoped arrays — `children`, `routineItems`, `contacts` — plus loose
DOM reads at submit time. Everything is persisted to `localStorage` under four keys:

| Key | Contents | Written | Read |
|---|---|---|---|
| `held-draft-v1` | the entire in-progress form | on every input (400 ms debounce) | on boot |
| `held-profiles-v1` | saved child profiles for reuse | on generate | on the children screen |
| `held-last-entry` | full submitted form data | on generate | **never** |
| `held-guide-edited` | the edited guide HTML | on every edit keystroke | **never** |

Two of the four keys are write-only. `held-guide-edited` is the worse of the two: the app tells the
user *"Tap any text to correct it. Your changes are saved automatically."* — and the changes are
indeed saved, but nothing ever reads them back. **Reload the app and every manual correction is
silently gone.** The user was told their edits were safe. They are not.

**AI layer.** One synchronous call to `/api/generate` with a ~40-line system prompt demanding a
strict JSON envelope. There is a real quality effort here: the prompt has explicit anti-hallucination
rules ("Negatives stay negative", "NEVER link two separate facts unless the parent linked them"),
UI labels are hand-translated in a lookup table rather than trusted to the model, and safety-critical
structured facts (allergies, milk) are rendered by the app rather than relying on the model to
mention them. That instinct — *don't let the model own safety-critical output* — is correct and
should survive into the rebuild.

**Rendering.** `renderGuideSafely()` wraps the main renderer in a try/catch and falls back to a
plain renderer built purely from the parent's own input if the AI output is malformed or the render
produces an empty document. Good defensive design.

**Export.** The PDF and image exporters are the most sophisticated code in either app. They slice
the guide into page-sized chunks at block boundaries and render each to its own modest canvas,
specifically to stay under Safari's ~16.7M pixel canvas cap. The comments explain exactly why. This
is hard-won knowledge and is worth preserving verbatim.

---

## 1.3 Readied — technical detail

Readied is a **noticeably more mature codebase than Held** and should be treated as the better
technical reference of the two.

What it has that Held does not:

- **A resilience layer.** `SAFE.set()` writes to `localStorage`, reads the value back to verify it
  landed (Safari private mode lies about this), and on quota failure drops the two oldest saved
  trips and retries once before surfacing a visible warning. Failures are never silent.
- **Shape guards.** `normalizeLists()`, `normalizeSchedule()`, `cleanExtras()`, `cleanAdjust()` and
  `cleanPlaces()` treat AI output as untrusted input, coerce types, clamp string lengths and drop
  malformed entries. The renderer only ever sees a valid shape.
- **An error boundary.** `window.onerror` and `onunhandledrejection` render a recovery card with
  "Reload" and "Start a fresh trip" instead of a white screen.
- **Undo.** Destructive actions surface a toast with a working Undo.
- **Consistent output escaping.** `esc()` is applied at nearly every interpolation site.
- **Local-first generation with AI enrichment.** `buildLocal()` computes complete, correct lists
  deterministically; the AI then *adds* weather and parses the parent's free-text notes. If every
  AI call fails, the user still gets a full list. **This is the single best architectural decision
  in either codebase** and should become the house pattern.

**The real intellectual property.** `buildLocal()` and `listForPerson()` encode domain logic that no
competitor has and no model would produce reliably:

- *Dry-spell maths.* Clothing quantity is driven by the longest run of consecutive days without
  laundry — computed **per traveller**, counting only the legs that person is actually on — not by
  trip length. This is the correct model and almost every packing app gets it wrong.
- *Transit-bag grouping.* Unbroken travel stretches are grouped into their own small bag, and a
  stretch is terminated by either a proper stop *or* laundry availability, because washing resets
  what you need to carry.
- *Wardrobe modes.* Separates vs dresses vs both, with quantities adjusted accordingly.
- *Regional substitution.* "In France, Calpol = Doliprane (paracétamol)".
- *A brain-dump guarantee.* If the AI fails, everything the parent typed is still surfaced as a
  "Your notes" list rather than discarded.

Preserve this logic. It is worth more than the UI around it.

**Sync.** Trips are shared by generating a 5-character code (32-char alphabet, ~33.5M combinations),
writing a row to a Supabase `trips` table, and **polling every 4 seconds** for changes. Photos are
deliberately stripped before upload and kept on-device — a good privacy instinct.

---

## 1.4 Security — findings

These are ordered by severity. Two of them concern live production systems holding children's data.

### S1 — CRITICAL. The `trips` table is readable and writable by anyone, and the "security fix" did not fix it.

The `security.html` page told you the problem was solved. It was not. The page states that after
running the fix, *"Reading a trip without knowing its exact code"* would no longer be possible. The
policy it actually installs is:

```sql
create policy "read trip by code"
  on trips for select to anon
  using (true);          -- ← this permits reading EVERY row
```

A Postgres RLS `USING (true)` clause on `SELECT` grants unconditional read access to all rows. The
accompanying comment claims *"Reading requires filtering by an exact code, so the whole table can
never be listed or downloaded"* — that is not what this policy does. The column-level
`revoke select … / grant select (id, code, data, created_at)` that follows restricts *which columns*
are readable, not *which rows*, and `data` — the column containing everything — is explicitly
granted back.

The practical consequence: anyone who has the publishable key (it is in the page source of the
deployed app, which is normal and expected for an anon key) can issue a single request to
`/rest/v1/trips?select=*` and download **every trip ever created, including children's names, ages
and the parent's free-text notes**.

The update policy has the same flaw:

```sql
create policy "update trip by code"
  on trips for update to anon
  using (true) with check (true);   -- ← anyone can overwrite any trip
```

The `events` table is equally open on both read and write, so all analytics are publicly readable
and anyone can inject arbitrary rows.

Compounding this: the built-in "Test security" button only checks that `DELETE` is blocked. It never
tests whether the table can be listed — yet the UI reports **"Secure. Sharing works, and nobody can
delete or list your trips."** on success. The verification confirms the one thing that was fixed and
asserts the thing that was not.

**This is a live personal-data exposure involving children, and under UK GDPR / GDPR it is
plausibly a reportable breach.** It needs correcting before anything else in this plan.

The correct policy shape requires the caller to prove knowledge of the code. Either move reads
behind a server-side function that takes the code as a parameter, or use a Postgres RLS policy keyed
on a request header/JWT claim rather than `USING (true)`. The full remediation is written up in
`docs/strategy/SECURITY-IMMEDIATE.md`. **I can implement and deploy this myself as the first task
after approval — I need Supabase project access to do so.**

### S2 — CRITICAL. Both `/api/generate` endpoints are open, unauthenticated proxies to a paid Anthropic account.

Held's version:

```js
model: 'claude-sonnet-4-6',
max_tokens: req.body.max_tokens || 1600,
system: req.body.system,          // ← caller-controlled
messages: req.body.messages       // ← caller-controlled
```

The system prompt and the entire message array are supplied by the caller. Anyone can POST arbitrary
prompts to this endpoint and have them billed to your Anthropic account. The only defence is a rate
limit held in a module-scoped `Map` — which lives in the memory of a single serverless instance, is
lost on every cold start, and is not shared between concurrently running instances. In practice this
is not a rate limit.

Readied's version is worse: it forwards `req.body` to Anthropic wholesale with **no rate limiting at
all**, so `model` and `max_tokens` are also caller-controlled. A caller can request the most
expensive model at maximum token count in a loop.

**Exposure: uncapped spend on your Anthropic account, plus reputational risk if the endpoint is
found and used to generate abusive content that originates from your domain.**

Both endpoints need, at minimum: a server-owned system prompt and model, a schema-validated request
body, a durable rate limit (Upstash/Vercel KV keyed on IP and account), and an Anthropic spend cap
configured as a backstop.

### S3 — HIGH. Readied falls back to calling Anthropic directly from the browser.

```js
if(!j||j.error||!j.content){
  const r2=await fetch("https://api.anthropic.com/v1/messages", { … });
}
```

If the proxy fails, the browser posts the prompt — which contains children's names, ages and the
parent's notes — straight to `api.anthropic.com` with no API key. It will 401, so nothing is
processed, but the request body still leaves the device to a third party for no benefit. Dead code
with a privacy cost. Delete it.

### S4 — HIGH. Held renders user and model text as HTML without escaping.

`parseInlineBold()` converts `**bold**` to `<strong>` and returns a raw string that is then written
via `innerHTML`. It is applied to routine notes, the important-note lines, AI intro text and AI
section labels and content, none of which are escaped first:

```js
html += `<div class="sched-note">${tag}${item.notes ? ' — ' + parseInlineBold(item.notes) : ''}</div>`;
```

A parent who types `<img src=x onerror=…>` into a routine note gets it executed. On its own this is
self-XSS and low impact. It stops being low impact once guides are shareable between accounts —
which is exactly what the roadmap proposes. There is also a prompt-injection path: parent text
reaches the model, and model output is injected unescaped.

Readied does this correctly with a consistent `esc()`. Held should adopt the same discipline.

### S5 — MEDIUM. Health data about children is stored unencrypted with no deletion path.

Allergies, medication, nappy status and behavioural notes are special-category data under
UK GDPR Article 9, and they concern children. Today they sit in `localStorage` in plain text, are
duplicated across four keys (two of which are never read), and the only way to remove them is the
"Start over" button — which does not clear `held-profiles-v1`. There is no export, no deletion
request path, no retention policy and no privacy notice.

### S6 — MEDIUM. The Supabase project reference and publishable key are in client source.

This is normal and correct *when RLS is sound*. It is listed here only because, given S1, the key is
currently the sole thing standing between the public and the data — and it is printed in the page
source.

### S7 — LOW. Third-party scripts loaded from a CDN with no Subresource Integrity.

`html2pdf.bundle.min.js` and `html2canvas.min.js` load from cdnjs with no `integrity` attribute and
no `crossorigin`. A compromise of that CDN would execute arbitrary script in a page handling
children's medical data. There is also no Content-Security-Policy header on either deployment.

---

## 1.5 Correctness bugs

### B1 — HIGH, safety-relevant. Allergies are not sent to the AI.

`collectChildrenData()` produces objects with an `allergies` field. The prompt builder reads a field
that does not exist:

```js
lines.push(`  Allergies: ${[c.allergens, c.allergyNotes].filter(Boolean).join(' — ') || 'None noted'}`);
```

`c.allergens` and `c.allergyNotes` are both `undefined` on every child, so **the model is told
"Allergies: None noted" for every child, including children with a recorded peanut allergy.** Prompt
rule 3 instructs the model to write a "Food & Allergies" section *"always if allergies exist"* — so
it correctly omits it, having been told none exist.

Verified by replicating the exact data flow for a child with a recorded peanut allergy:

```
parent entered      : "Peanuts"
SENT TO THE MODEL   : "Allergies: None noted"
SHOWN IN THE GUIDE  : "Peanuts"
```

The damage is partly contained because the renderer falls back to `c.allergens || c.allergies` and
prints the allergy in the child's comfort card. So the guide does display the allergy — but the
model's narrative sections are written in ignorance of it, and any AI advice about food is generated
on a false premise. In a document whose entire purpose is safe handover of a child, this is the most
serious functional defect in either codebase.

### B2 — MEDIUM. "A separate guide each" does nothing.

`splitChoice` is set by the UI, persisted to the draft and restored on load, but it is **never read
during generation**. A parent with two children who chooses "A separate guide each — best for
different carers" receives one combined guide. The option is decorative.

### B3 — MEDIUM. Manual guide edits are lost on reload. (See 1.2.)

### B4 — LOW. `ENGLISH_LABELS` has six duplicate key pairs on one line.

`milkMicro` and `allergyMicro` are each assigned six times in a single object literal — French,
Spanish, German, Italian, Portuguese and Dutch values pasted into the English table. Last-wins means
the English values happen to be correct, but only by accident of ordering.

### B5 — LOW. "Start over" on the done screen does not start over.

`restart()` is `location.reload()`, which re-runs `restoreDraft()` and brings everything back.

### B6 — LOW. `bump.py` no longer works as documented.

It rewrites `register('/sw.js')` — a string that does not appear in `index.html`, because the service
worker is never registered. The version-stamping half still works.

---

## 1.6 The paywall does not exist

Held's UI has a "Beta code (generate for free)" field, sends `{ accessCode }` to the API, and has a
handler for HTTP 402 with the message *"Add a code or pay to create this guide."* The server ignores
`accessCode` entirely and cannot return 402. There is no payment integration, no entitlement check
and no metering. Every generation is free and billed to you.

This matters for the roadmap: **there is no monetisation to migrate, so the payments work in Phase 8
is greenfield rather than a refactor.**

---

## 1.7 Dead code and unused assets

Nothing here was deleted. This is the list for a later, separate cleanup.

| Item | Status |
|---|---|
| `sw.js` | never registered — `navigator.serviceWorker` appears nowhere in Held's `index.html`. **Held has no offline capability at all**, despite shipping a service worker and advertising "Turn this into an app". |
| `manifest.json` | never linked — the page uses an inline base64 `data:` manifest instead. The file is dead. |
| `vercel.json` | two of its four header rules target `/sw.js` and `/manifest.json`, both dead. |
| `example-guide.html` | orphaned. Nothing links to it; the in-app sample is generated by `viewExample()` instead. |
| `renderGuideLandscape()` | ~60 lines, never called — `renderGuideSafely()` always calls `renderGuideIndepth()`. The "One-pager" toggle only changes CSS density. |
| `startVoice()` | ~20 lines, no callers. Microphone input is unreachable. |
| `ALL_ROUTINE_TYPES` | declared, never read. |
| `childCount`, `routineCount`, `contactCount` | declared, never read. |
| `held-last-entry`, `held-guide-edited` | written, never read. |

Readied is considerably cleaner; no significant dead code found.

---

## 1.8 Accessibility, performance, responsive behaviour

**Accessibility.** Both apps set `maximum-scale=1.0, user-scalable=no`, which blocks pinch-zoom and
fails WCAG 2.2 SC 1.4.4 (Resize Text). Held has 2 `aria-label`s in 2,676 lines; Readied has 20, which
is better but still thin. Neither app manages focus when screens change, so a screen-reader or
keyboard user is dropped without announcement on every step. Interactive elements are frequently
`<div onclick>` rather than buttons (`.opt`, `.tile`, `.sw`, `.chip` in Held), so they are not
focusable or operable by keyboard. Held's chip controls are multi-select but expose no
`aria-pressed`. No skip links, no live regions for the loading and error states, no visible focus
styles. Colour contrast has not been formally measured and needs to be — see the brand document.

This is a product whose users are frequently stressed, one-handed, and reading in bad light. The
accessibility position is not acceptable for launch.

**Performance.** Held loads `html2pdf.bundle.min.js` and `html2canvas.min.js` — roughly 1 MB
combined — as render-blocking scripts in `<head>`, on every page load, for a feature most users
reach at the very end of a ten-step flow if at all. Readied loads the same libraries lazily via
`loadScript()`, which is correct. Both load Google Fonts render-blocking; Readied at least
`preconnect`s, Held does not. Held inlines three PNG icons as base64 in `<head>`, adding roughly
15 KB of unparseable bytes ahead of first paint. No image is lazy-loaded, nothing is code-split
(there is no build step to split with), and no performance budget or measurement exists.

**Responsive and desktop.** Held is hard-capped at 430 px with `overflow: hidden` on `body`. On a
laptop it renders as a phone-shaped column in the middle of a white void, and the page cannot
scroll. Readied caps at 640 px and behaves better but is still phone-first only. **Neither app has a
landing page, a marketing site, or any desktop experience.** The user journey the brief asks for
("Discovery → Landing page → signup") currently has no first two steps.

**Sync efficiency.** Readied polls Supabase every 4 seconds for the lifetime of the session. With
any real user base this is a significant and entirely avoidable cost and battery drain; Supabase
Realtime exists for precisely this.

---

## 1.9 Colour Keeper — not found

Colour Keeper does not exist in this repository, in any commit in its 70-commit history, in any
branch, or in the files supplied separately. Grep for "colour keeper" / "color keeper" across
everything available returns nothing.

I have therefore **not** audited it, and every statement in these documents about Colour Keeper is
explicitly marked as provisional. If there is a separate repository, deployment, Figma file or
written concept for it, send it and I will produce the same analysis for it. This is the first item
in *Decisions I need to make*.

---

## 1.10 Environment, deployment and operations

**Environment variables.** One, `ANTHROPIC_API_KEY`, on each of the two Vercel projects. The
Supabase URL and publishable key are hardcoded in the client rather than injected at build time —
unavoidable given there is no build step.

**Deployment.** Push to `main` on GitHub triggers a Vercel deploy. There is no staging environment,
no preview review step, no CI, no automated checks, and no rollback procedure beyond Vercel's
instant-rollback UI. `bump.py --deploy` commits and pushes directly to `main`.

**Observability.** None. No error tracking (Sentry or equivalent), no uptime monitoring, no
structured logging, no alerting. If `/api/generate` starts returning 500s you will find out from a
user. Readied's `track()` calls are funnel analytics, not error monitoring, and they write to a
publicly readable table.

**Documentation.** No README, no architecture notes, no runbook, no onboarding doc, no changelog.
The only documentation is inline comments — which, to be fair, are unusually good in places, and
several of them record real production incidents and their causes (the Safari canvas cap, the
"Cow's milk" chip being reported as an allergy, the AI mistranslating "Toutes les enfants"). Those
comments are institutional memory and must be carried into the rebuild rather than lost in it.

---

## 1.11 KEEP / IMPROVE / REBUILD / REMOVE / UNKNOWN

### KEEP — port forward largely as-is

| Asset | Why |
|---|---|
| Readied's `buildLocal()` / `listForPerson()` packing logic | Real, differentiated domain IP. Dry-spell maths, transit-bag grouping, per-person wardrobe. Port as pure, unit-tested functions. |
| The local-first-then-AI-enrich pattern | The correct architecture for this product class. Make it the house rule. |
| Held's anti-hallucination prompt rules | Hard-won. "Negatives stay negative", "never link two facts the parent did not link". |
| Hand-curated UI translation tables | Correct instinct: never let a model translate your chrome. |
| App-rendered safety-critical facts | Allergies and milk rendered from structured data, not from model prose. |
| The paged canvas export engine | Encodes the Safari 16.7M-pixel workaround. Do not rediscover this. |
| Readied's `SAFE` storage wrapper, shape guards, error boundary and Undo | Production-grade resilience thinking. |
| The `EMERGENCY_NUMBERS` and `MILK_TYPES` tables | Small, correct, useful reference data. |
| The inline comments recording past incidents | Institutional memory. |

### IMPROVE — keep the idea, rebuild the implementation

| Asset | What changes |
|---|---|
| The question flows in both apps | The sequencing and copy are good. Rebuild as data-driven schemas rather than hardcoded DOM. |
| Age-banding | Both apps have one and they disagree (Held: <3/3–5/5+; Readied: six bands). Unify into one shared model. |
| Saved child profiles | Right idea, wrong storage. Becomes the shared household data model. |
| Guide/list export and share | Keep the engine, add real links and permissions. |
| Readied's analytics | Keep the event taxonomy; move off a publicly readable table onto a real analytics product. |
| Trip library | Becomes generic saved-object handling across the ecosystem. |

### REBUILD — cannot be carried forward

| Asset | Why |
|---|---|
| Both applications as delivery vehicles | Single-file, no build, no components, no tests, no types. Nothing shared can be extracted from them. |
| Both `/api/generate` endpoints | Open proxies. Must be replaced, not patched. |
| The Supabase schema and RLS policies | Two tables, no users, no households, broken policies. Design properly. |
| Storage and persistence | `localStorage`-only is incompatible with accounts, households and multi-device. |
| Both design systems | Two unrelated palettes, no tokens, no shared components. |
| Navigation and routing | Hand-rolled `.active` toggling; no URLs, so no deep links, no back button, no shareable state. |
| The fake paywall | Delete and build properly. |

### REMOVE — delete, in a later dedicated cleanup

`sw.js` (unregistered), `manifest.json` (unlinked), `example-guide.html` (orphaned),
`renderGuideLandscape()`, `startVoice()`, `ALL_ROUTINE_TYPES`, `childCount`/`routineCount`/
`contactCount`, the `held-last-entry` and `held-guide-edited` writes, the dead `vercel.json` rules,
Readied's direct-to-Anthropic browser fallback, and `bump.py` once there is a real pipeline.

### UNKNOWN — needs input before it can be classified

- **Colour Keeper** in its entirety (1.9).
- Whether Held and Readied are one Vercel account or two, and whether domains are already bought.
- Whether the Supabase project holds real user data today, and how much (determines whether S1 is a
  reportable breach).
- Whether any users exist and in what numbers — Readied has analytics, so this is knowable, and I
  will pull it as soon as I have access.
- Whether "MML" / "My Mental Load" is a registered trading name or trademark anywhere.
- Whether there is an existing privacy policy or terms of service published anywhere.

---

## 1.12 Technical debt, in one paragraph

The debt is not in the code that exists — much of it is careful, and the comments show someone
learning fast from real failures. The debt is **structural**: two applications that share a brand,
a founder, a font stack and a Supabase project, and share literally nothing else. Every future
feature must be built twice. Every fix must be applied twice, by hand, in two 2,500-line files, with
no tests to confirm it worked. That is the cost that compounds, and it is the reason the
recommendation in `08-technical-architecture.md` is a consolidation onto one codebase rather than a
series of incremental repairs.
