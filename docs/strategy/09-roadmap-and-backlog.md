# 9. Rebuild roadmap and prioritised backlog

Deliverables 17 and 18.

No calendar estimates are given. Instead each phase states what must change, how invasive it is, and
what it depends on. Phases are sequential where dependencies force it and parallel where they do not.

Two conventions throughout:

- **Autonomous** — I do it without asking. This is the default and should cover the large majority of
  the work.
- **Approval** — a product, brand, legal or spend decision that is yours. Kept as short as possible;
  everything on these lines is collected in `10-decisions-required.md`.

---

## PHASE −1 — Security remediation

Runs before and independently of everything else. Not gated on any strategy approval.

**Objective.** Close two live exposures: children's data readable by anyone, and two uncapped
Anthropic proxies.

**Work.** Replace the `trips` RLS policies with server-mediated tokenised reads; deny `anon` direct
access; make `events` insert-only. Rewrite both `/api/generate` handlers to own the prompt and model
server-side, validate the body, and rate-limit durably. Rotate `ANTHROPIC_API_KEY` and set a spend
cap. Remove Readied's direct-to-Anthropic browser fallback. Fix Held's unescaped `innerHTML`. Add
share-code expiry and lengthen new codes. Remove `user-scalable=no` from both apps.

**Tests.** A test that asserts an unauthenticated full-table read of `trips` fails. A test that the
AI route rejects a caller-supplied `model` or `system`. Regression test for the escaping fix.

**Acceptance.** `GET /rest/v1/trips?select=*` with the publishable key returns nothing. Sharing and
joining still work end to end. `POST /api/generate` with an arbitrary system prompt is rejected.
Anthropic spend cap is live.

**Dependencies.** Supabase project access and Vercel project access. I have neither. **This is the
only thing blocking this phase.**

**Risks.** Breaking live sharing for anyone mid-trip — mitigated by testing the join path before and
after, and by keeping the old read path alive behind a flag for 48 hours.

**Approval:** whether to notify the ICO/CNIL, once I have pulled the Supabase access logs and we know
whether anything was actually read. Everything else here is autonomous.

---

## PHASE 0 — Product, brand and naming strategy

**Objective.** Settle the decisions in `10` so that nothing downstream is built twice.

**Work.** This document set, plus: the Colour Keeper analysis once supplied; formal trademark
screening on the two or three shortlisted names in UKIPO, EUIPO and USPTO classes 9 and 42; domain
acquisition; a written positioning statement and messaging framework in English and French.

**Autonomous.** All research, all analysis, all documentation, all recommendations, domain purchase
once a name is chosen and a budget is given.
**Approval.** The name decisions, the masterbrand decision, the Colour Keeper input, and instructing
a trademark attorney (I can prepare the brief and the shortlist; filing needs you).

**Acceptance.** Names chosen, domains held, no live conflict found in a professional search.

**Risk.** A name fails clearance late and Phase 4+ has to be re-labelled. Mitigated by not putting
product names into code, routes or database identifiers until clearance is done — surfaces are
referenced internally as `handover` and `away` regardless of their marketing names.

---

## PHASE 1 — Architecture and foundations

**Objective.** A production-quality skeleton that everything else is built on. No user-facing
features.

**Frontend.** Next.js App Router + TypeScript + Tailwind. Token layer implemented as CSS custom
properties (`05`). Component foundations on Radix. Light and dark. Self-hosted fonts.
**Backend.** Supabase project (new, clean), typed client, environment configuration, Sentry, PostHog
EU, Resend.
**Database.** Migration tooling. The `household` / `person` / `household_member` core from `08`, with
RLS from the first migration rather than added later.
**Tests.** Vitest, Playwright, axe-core, all wired into GitHub Actions. Nothing merges red.
**Integrations.** Vercel preview deployments per PR; a staging environment.

**Acceptance.** A signed-out visitor sees a landing page. CI runs typecheck, lint, unit, E2E and
accessibility on every PR. Lighthouse performance ≥ 90 on mobile. A deliberate RLS-bypass test fails
as expected.

**Dependencies.** None beyond repo and hosting access.
**Risks.** Over-building the foundation. Mitigated by a hard rule: nothing goes in `lib/` in this
phase that is not needed by Phase 2.

**Autonomous:** all of it.

---

## PHASE 2 — Account and household model

**Objective.** One account, one household, two parents, real data on a server.

**Features.** Sign up and sign in by magic link plus Apple and Google. Create a household. Invite a
second adult by link. Add people (children and adults) with name, date of birth, accent colour and
symbol. Caregivers and emergency contacts. Account settings including data export and account
deletion.

**UX.** The single most important design work in this phase is **household setup that does not feel
like data entry**. One person, minimum fields, value immediately after. Everything else is added
later, in context, at the moment it is needed.

**Backend.** Auth, membership and roles, invitation tokens, RLS on every table, export as a
downloadable archive, deletion with a 30-day soft window then hard purge.
**Database.** `household`, `household_member`, `person`, `person_fact`, `caregiver`, `contact`.
**AI.** None.
**Tests.** Full RLS matrix — every role against every table, positive and negative. E2E for signup →
household → invite → second user joins.

**Acceptance.** Two users share one household and both see the same children. A user in household A
cannot read household B by any route, proven by test. Export produces a complete archive. Deletion
actually deletes.

**Dependencies.** Phase 1.
**Risks.** Getting the household model wrong is the single most expensive mistake available, because
everything is keyed on it. Mitigated by modelling caregiver and viewer roles now even though nothing
uses them until Phase 5.

**Autonomous:** all of it. **Approval:** none.

---

## PHASE 3 — MML Home

**Objective.** A calm, finishable Home.

**Features.** Greeting; "Coming up" (read-only); "Start something" (the surfaces). The "One thing"
slot ships **empty** in this phase and is filled in Phase 7 when there is something true to say.

**UX.** The empty state is the design. Get it right before anything is added.
**Frontend.** Server-rendered, minimal client JS.
**Backend.** One aggregation query.
**AI.** None yet — deliberately.

**Acceptance.** Home renders in under 1 second on a mid-range Android over 4G. With no data it reads
as intentional, not broken. It is fully readable in one screen.

**Dependencies.** Phase 2.
**Risks.** Feature creep — the pull toward widgets will be strong. The constraint "Home must be
finishable" is the defence and should be treated as a hard requirement.

**Autonomous:** all of it. **Approval:** sign-off on the Home concept, since it defines the product's
character more than any other screen.

---

## PHASE 4 — Surface architecture

**Objective.** The shared machinery both surfaces need, built once.

**Features.** The question-step engine driven by data rather than hardcoded DOM. Saved-object
handling (a list of your guides, a list of your trips). The share-link system with tokens, expiry,
revocation and view tracking. The public share view at `/s/[token]` — the caregiver and partner
experience. The document renderer targeting screen, print, PDF and image from one component
(porting the paged-canvas engine).

**Backend.** Token issue and revoke, tokenised read route, rate limiting, share analytics.
**Database.** Share tokens on shareable objects.
**Tests.** Token expiry, revocation, enumeration resistance, and a visual-regression suite on
generated documents.

**Acceptance.** A share link opens for someone with no account, on a cold phone, and looks right.
An expired link fails gracefully with a useful message. PDF export produces no blank pages on iOS
Safari.

**Dependencies.** Phase 2.
**Risks.** The PDF/canvas work is the known-hard part. Mitigated by porting the existing engine
rather than rewriting, and by testing on real iOS early.

**Autonomous:** all of it.

---

## PHASE 5 — First priority surface: Handover

**Recommendation: Handover goes first.** It has the stronger differentiation, the stronger emotional
proposition, the translation wedge, and the second user (the caregiver) who is the biggest
unexploited asset in the portfolio. Away is the better *code*; Handover is the better *product*.

**Objective.** Produce a care guide from an existing household profile in under 90 seconds.

**Features.** Guide creation as an action over the household, not a form: who is coming, when, how
long, what is different this time. Progressive profile enrichment — questions are asked once and
remembered, and only new or stale facts are asked about again. Critical-fact handling with `severity`.
Guide generation with the deterministic document assembled first and AI prose layered on. Multi-language
output. Share by link, plus PDF and image export. Caregiver acknowledgement ("Claire opened this") and
a single reply channel back to the parent.

**UX.** The core insight: a returning user with a complete profile should reach a finished guide in
three taps. Bug B2's "separate guide each" is implemented properly this time or dropped entirely.
**AI.** Prose, translation, free-text extraction into structured facts as an editable proposal.
Never allergies, never quantities, never advice.
**Tests.** The safety-critical suite: an allergy entered by a parent must appear in the document,
reach the model, survive translation, and never be paraphrased. B1 gets a permanent regression test.

**Acceptance.** A returning user creates a guide in under 90 seconds. A caregiver with no account
opens the link on a cold phone and can read and search it. A French-language guide is reviewed by a
native speaker and passes. Every allergy test passes. The deterministic fallback produces a complete,
usable guide with the AI disabled.

**Dependencies.** Phases 2 and 4.
**Risks.** Translation quality on safety-critical lines. Mitigated by showing critical lines in both
languages, a visible machine-translation notice, and native review before launch.

**Autonomous:** all of it. **Approval:** the surface name; sign-off on the caregiver reply feature,
which is a real scope addition.

---

## PHASE 6 — Second surface: Away

**Objective.** Port the packing engine onto the household model.

**Features.** Trip creation using household people rather than re-entered travellers. Legs with
transport, laundry, overnight and transit. The ported deterministic packing engine. Two-person live
ticking. Return-journey mode. Trip reuse ("like last summer, everyone a year older").

**Backend.** `trip`, `trip_leg`, `packing_list`. Replace 4-second polling with Supabase Realtime.
**AI.** Seasonal weather; free-text note extraction. **Drop the places/restaurant recommendations** —
different product, least reliable output, invites unfavourable comparison.
**Tests.** Unit tests for every dry-spell, laundry-reset and transit-bag case, written from the
current implementation's behaviour as the specification. Realtime convergence tests for two clients.

**Acceptance.** Packing output matches the current app's for a battery of recorded scenarios, except
where a current behaviour is a known bug. Two devices stay in sync without polling. A trip built for
a household with a 2-year-old requires almost no re-entry of that child's details.

**Dependencies.** Phases 2, 4, 5.
**Risks.** Losing accuracy while porting. Mitigated by writing the tests from the existing behaviour
before changing anything.

**Autonomous:** all of it. **Approval:** the surface name; confirmation that dropping places
recommendations is acceptable.

---

## PHASE 7 — AI layer and cross-surface intelligence

**Objective.** The "One thing" on Home becomes real, and the AI gateway is fully governed.

**Features.** The Home suggestion engine with a strict one-item rule and honest dismissal. Cross-
surface awareness ("you're away and someone else has the children"). Stale-guide detection. The
gateway's budget enforcement, audit log and per-account allowances. A user-visible "what was sent"
view.

**Tests.** Suggestion precision measured against a labelled set — a wrong suggestion is worse than no
suggestion, and this needs to be measured rather than assumed. Budget-exhaustion falls back to
deterministic output.

**Acceptance.** Home never shows more than one suggestion. Dismissal is permanent for that event.
Suggestion precision above an agreed threshold in testing before it ships to anyone.

**Dependencies.** Phases 3, 5, 6.
**Risks.** A wrong suggestion damages trust disproportionately. Mitigated by shipping the engine to
internal use first, measuring, and only then enabling it for users.

**Autonomous:** all of it. **Approval:** the precision threshold at which it ships.

---

## PHASE 8 — Monetisation

Depends on the pricing decision in `07`. See that document for the model recommendation.

**Features.** Stripe Checkout and Billing Portal, plan entitlement checks, the free allowance,
upgrade prompts placed at the moment of value rather than the moment of arrival, receipts, VAT
handling for UK and EU.

**Backend.** Subscription state, webhook handling with idempotency, entitlement middleware, allowance
metering tied to the AI gateway's budget system from Phase 7.
**Tests.** Full webhook lifecycle including failed payment, cancellation and reactivation.
Entitlement bypass attempts.

**Acceptance.** A user can subscribe, be billed, change plan and cancel without contacting anyone.
Nothing on the never-paywall list is ever gated. Failed payments degrade gracefully rather than
locking a parent out of a guide they need tonight.

**Dependencies.** Phases 5 and 6 — do not price a product before it is worth paying for.
**Risks.** Paywalling the wrong moment kills the brand promise. Mitigated by the "never paywalled"
list in `07` being treated as immutable.

**Autonomous:** the entire implementation. **Approval:** the price points, the plan structure, and
the contents of the free tier.

---

## PHASE 9 — Analytics and retention

**Features.** Full funnel instrumentation in PostHog. Activation, retention and conversion dashboards.
A weekly founder digest. Lifecycle email — welcome, first-value nudge, dormant-household re-engagement
— all obeying the voice rule and none of them manufacturing urgency.
**Acceptance.** Every step of the journey in `11` is measurable. Drop-off is visible per step.
**Autonomous:** all of it. **Approval:** the content and cadence of lifecycle email, because it is
brand-facing.

---

## PHASE 10 — Notifications and automation

**Features.** Web Push for installed PWAs, email fallback, one preference centre, quiet hours,
per-topic control. Scheduled jobs: share expiry, purges, pre-event checks, allowance resets.
**The hard rule:** no notification exists to drive engagement.
**Acceptance.** Every notification is traceable to a time-sensitive fact. Unsubscribe works
everywhere, first time.
**Autonomous:** all of it. **Approval:** the notification catalogue — which events are allowed to
interrupt someone.

---

## PHASE 11 — QA, security, performance, compliance

**Features.** Full accessibility audit including manual VoiceOver on the three critical journeys.
Penetration testing of share links, RLS and the AI route. Performance budget enforced in CI. Load
testing. GDPR completion: privacy notice, cookie policy, processor register, retention policy,
in-product export and deletion, and a **DPIA covering AI processing of children's health data** —
which is genuinely required for this product, not optional.
**Acceptance.** Zero critical or serious axe violations. WCAG 2.2 AA on all key journeys. LCP under
2.0 s on mid-range Android over 4G. No high or critical penetration findings. DPIA signed off.
**Autonomous:** all engineering and all documentation drafting. **Approval:** DPIA sign-off, and
engaging an external penetration tester if you want one (recommended, given children's health data).

---

## PHASE 12 — Launch

**Features.** Marketing site in English and French. App Store presence via PWA install, or a native
wrapper if that decision is taken. Onboarding polish. Support channel. Status page.
**Acceptance.** A cold visitor can understand the product, sign up, and reach first value without
help.
**Approval:** launch date, pricing go-live, launch channels.

---

## PHASE 13 — Post-launch iteration

Weekly review of activation, retention and conversion against the Phase 9 dashboards. Decide from
evidence rather than opinion: whether a third surface is warranted; whether native apps are needed
for acquisition; whether Germany is worth a third language (`03` §3.5 argues the structural gap there
is as large as France's, but it is a stricter regulatory read). **Colour Keeper's fate is decided
here, from data, unless it turns out to be a design-system feature rather than a product — in which
case it lands in Phase 1.**

*Note:* whether France leads the launch is no longer a Phase 13 question. The market research
concluded it should, and it is now **D6** in `11-decisions-required.md` — it changes which language
gets the content and copy investment first, from Phase 12 onward.

---

## Prioritised backlog

### P0 — must exist at launch

| | Item | Phase |
|---|---|---|
| 1 | Lock down `trips` and `events`; verify with a failing read test | −1 |
| 2 | Close both open AI proxies; rotate key; set spend cap | −1 |
| 3 | Fix Held's unescaped HTML rendering | −1 |
| 4 | Remove `user-scalable=no` from both apps | −1 |
| 5 | Fix the allergy data bug (B1) — in the rebuild, with a permanent regression test | 5 |
| 6 | Next.js + TypeScript foundation with CI, tests and accessibility gates | 1 |
| 7 | Account, household, membership, RLS on every table | 2 |
| 8 | Person and `person_fact` model | 2 |
| 9 | Data export and account deletion in-product | 2 |
| 10 | Design tokens, light and dark, contrast-verified | 1 |
| 11 | Component foundations with real focus management | 1 |
| 12 | Home, finishable, honest empty state | 3 |
| 13 | Share links with tokens, expiry and revocation | 4 |
| 14 | Public share view for people with no account | 4 |
| 15 | Document renderer: screen, print, PDF, image | 4 |
| 16 | Handover surface end to end | 5 |
| 17 | Multi-language guide output with native review | 5 |
| 18 | AI gateway with server-owned prompts, budgets and audit log | 5 |
| 19 | Deterministic fallback for every AI path | 5 |
| 20 | Safety-critical regression suite | 5 |
| 21 | Away surface with the ported packing engine | 6 |
| 22 | Unit tests on the packing engine | 6 |
| 23 | Landing page and marketing site, English and French | 12 |
| 24 | Privacy notice, terms, processor register, DPIA | 11 |
| 25 | Sentry, PostHog, uptime monitoring, AI spend alerting | 1, 9 |
| 26 | `localStorage` migration for existing users | 4 |

### P1 — important, close behind

Two-person live ticking via Realtime; caregiver acknowledgement and reply; trip reuse; progressive
profile enrichment; the Home "One thing" engine; Stripe and the subscription; the never-paywalled
list enforced in code; lifecycle email; notification preference centre; full accessibility audit and
manual VoiceOver pass; performance budget in CI; visual regression on documents; French copy review
by a native speaker; share-view analytics.

### P2 — later

Cross-surface intelligence beyond the first suggestion; a third surface; native app wrappers;
caregiver-side accounts; household roles beyond adult and caregiver; guide templates by caregiver
type; offline support done properly (currently claimed and absent); calendar export (`.ics` only —
never calendar ingestion); referral mechanics; a partner/nanny-agency channel.

### P3 — future opportunity, unvalidated

School and nursery handover packs — the German *Notfallkarte Kita* is a better content specification
than anything the English-language competitors have built, and is worth stealing from; medical and
emergency profile export in a standard format; multi-household support for separated parents — a real
and under-served need that may be larger than it looks, and the segment WeFam is already serving in
French; B2B licensing to nanny agencies or au pair platforms; anything Colour Keeper turns out to be.

*Removed from this list:* "a `cahier de liaison` equivalent for the French market". The research
established that the *cahier de liaison* and *cahier de transmission* both run **inward** — school or
childminder reporting to the parent. Building one would be entering the crowded, well-funded B2B
category (Kidizz, Poppin's, Famly) rather than the empty parent-outbound one. The *cahier* is
valuable to us as a **frame for the pitch**, not as a product to build: *le cahier de transmission,
mais dans l'autre sens*.

### Explicitly not doing

Email, calendar or WhatsApp ingestion. A shared family calendar. Chore assignment and tracking.
Gamification, streaks, scores or completion percentages. A general-purpose AI chat interface.
Anything that requires the household to maintain it to stay useful.
