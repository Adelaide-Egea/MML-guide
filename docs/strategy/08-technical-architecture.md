# 8. Recommended technical architecture

Deliverable 16.

The brief says: do not change technology for the sake of change. Agreed. The complication is that
there is very little technology to keep — no framework, no build, no components, no tests, no
package manager. So the honest position is not "should we migrate?" but "what should we choose,
given that we are choosing for the first time, and what do we carry over?"

What carries over is **the logic, not the delivery**: the packing engine, the prompt rules, the
export engine, the translation tables, the resilience patterns. Those are portable to anything.

---

## 8.1 The stack

| Layer | Recommendation | Why this, and what it replaces |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Vercel is already the host and already works. TypeScript is the single highest-leverage change available: the allergy bug (B1) — the most serious defect found — is a typo in a property name that a type checker catches at compile time, for free, forever. Server Components let the model-facing code stay on the server by construction. |
| Hosting | **Vercel** | Already in use, already understood, no reason to move. |
| Database | **Postgres via Supabase** | Already in use. Relational is right for households and permissions. Keep it — but design the schema and the policies properly this time. |
| Auth | **Supabase Auth**, email magic link + Apple/Google | Same platform as the database, so RLS can key off `auth.uid()` directly. Magic link suits a mobile-first, low-frequency product where nobody will remember a password. |
| Styling | **Tailwind + CSS custom properties for tokens** | Tokens as CSS variables keep light/dark and per-surface accents as a runtime concern, which is what the design system needs (`05`). |
| Components | **Radix UI primitives**, styled in-house | Buys keyboard handling, focus management and ARIA — precisely the areas where both current apps fail. |
| State | React Server Components + **TanStack Query** for client caches | Server state on the server. Minimal client state. |
| Forms | **React Hook Form + Zod**, one schema shared client and server | One schema validates the form, the API and the database write. |
| Background jobs | **Inngest** or Vercel Cron | Notifications, expiry, purges, digest generation. |
| AI | **One internal gateway module.** Anthropic primary. | Server-owned prompts, per-account budgets, audit log, provider-swappable. |
| Payments | **Stripe** (Checkout + Billing Portal) | Do not build billing UI. |
| Analytics | **PostHog** (EU region) | Product analytics with EU hosting, which matters for the GDPR story. Replaces the publicly readable `events` table. |
| Errors | **Sentry** | Currently zero error visibility. |
| Email | **Resend** | Magic links, guide-ready notifications, receipts. |
| Testing | **Vitest** (unit) + **Playwright** (E2E) + **axe-core** in CI | See 8.6. |
| CI | **GitHub Actions** | Typecheck, lint, unit, E2E, accessibility. Nothing merges red. |
| Monorepo | Not initially. One Next.js app, internal `lib/` packages. | A monorepo is overhead for one app. Extract later if a native app forces it. |

### Explicit non-recommendations

- **Not React Native / not native iOS.** A PWA covers the requirement. Both current apps are already
  installable web apps and the export/share paths use web APIs (`navigator.share`, canvas) that
  already work. Revisit only if App Store distribution becomes a required acquisition channel — which
  is a real possibility for this category and is flagged in the roadmap as a Phase 13 decision point,
  not a Phase 1 one.
- **Not a separate backend service.** Next.js route handlers plus Postgres is sufficient at this
  scale and for a long way past it.
- **Not a vector database, not RAG, not agents.** Nothing in the product needs retrieval over a
  corpus. The AI work is structured extraction and controlled generation over a small, known context.
- **Not microservices, not Kubernetes, not a message queue.** Obviously — but worth writing down so
  the temptation is settled.

---

## 8.2 Data model

The central design decision: **the household is the tenant, not the user.** Every domain row belongs
to a household. Users belong to households through a membership table with a role. This is what makes
"both parents can use it" work, and retrofitting it later is a migration nobody wants.

```
auth.users                      (Supabase Auth)
   │
   └─ profile                   display name, locale, timezone, notification prefs
        │
        └─ household_member     (user_id, household_id, role, joined_at)
                                role: owner | adult | caregiver | viewer
                │
household ──────┤
  id, name, locale, country, subscription_id, created_at
   │
   ├─ person                    ← the core object. A child OR an adult.
   │    id, household_id, given_name, date_of_birth (nullable),
   │    kind (child|adult), accent_index, symbol, wardrobe_pref
   │    │
   │    ├─ person_fact          ← EAV-ish but typed. The extensible profile.
   │    │     id, person_id, category, key, value_text, value_json,
   │    │     severity (info|important|critical), source (parent|ai_suggested),
   │    │     confirmed_at, updated_at
   │    │     e.g. (allergy, peanut, "EpiPen in hall drawer", critical, parent)
   │    │
   │    └─ routine_item         id, person_id, label, time_of_day, note, applies_days
   │
   ├─ caregiver                 id, household_id, name, relationship, locale, phone
   ├─ contact                   id, household_id, name, phone, relationship, is_emergency
   │
   ├─ handover                  ← a generated care guide
   │    id, household_id, caregiver_id, starts_at, ends_at, locale,
   │    status, share_token, share_expires_at, viewed_at, content_json
   │
   ├─ trip                      ← a journey
   │    id, household_id, name, starts_at, ends_at, share_token, share_expires_at
   │    ├─ trip_leg             place, dates, transport[], laundry, overnight, transit, who[]
   │    └─ packing_list         person_id (nullable for shared bags), items_json, checked_json
   │
   ├─ ai_generation             ← audit + cost
   │     id, household_id, surface, model, input_summary, tokens_in, tokens_out,
   │     cost_cents, created_at
   │
   └─ subscription              stripe_customer_id, stripe_subscription_id, plan, status,
                                current_period_end, generation_allowance_used
```

### Why `person_fact` rather than wide columns

Held's child record already has fifteen-plus optional fields (nappy status, nappy size, cream, milk
types, bottle amounts, food stage, nursery, school, likes, screen rules, upset guidance) and every
new question adds a column and a migration. A typed fact table with a fixed vocabulary of
`(category, key)` pairs — validated in application code by a Zod schema, not left free-form — lets
the question set evolve without schema churn, and gives every fact a `severity` and a `source`.

`severity` is load-bearing: it is what lets the renderer put critical facts at the top of a document
and refuse to let the model paraphrase them. `source` is what lets us distinguish a fact the parent
stated from one the model proposed, which is the difference between a trustworthy document and a
liability.

### Authorisation

RLS on every table, keyed on household membership:

```sql
create policy "household members read"
  on person for select
  using (
    exists (
      select 1 from household_member m
      where m.household_id = person.household_id
        and m.user_id = auth.uid()
    )
  );
```

Note what this is not: `using (true)`. Every policy names a subject. The rule for this codebase is
**no RLS policy may contain a bare `true` in a `USING` clause on `SELECT` or `UPDATE`**, and that
should be a CI check, not a convention.

### Share links

Handovers and trips are shared with people who have no account — that is the point of the product.
Share access is therefore **not** RLS-based. Instead:

- A share is a row with a 128-bit random `share_token` and an explicit `share_expires_at`.
- Reads go through a server route that takes the token, does a constant-time lookup, and returns
  only that object's rendered content. The anon Postgres role gets no direct access to these tables
  at all.
- Tokens expire (default 30 days after the event ends, configurable), can be revoked, and record
  when they were first viewed — which is a genuinely useful product feature ("Claire opened the
  guide") as well as a security control.
- Rate-limit token lookups to make enumeration impractical, and log failures.

This replaces the current 5-character code with `USING (true)`.

---

## 8.3 Application structure

```
app/
  (marketing)/            public, statically rendered, indexable
    page.tsx                landing
    handover/page.tsx       surface landing page
    away/page.tsx
    pricing, privacy, terms
  (app)/                  authenticated
    home/                   MML Home
    household/              people, caregivers, contacts
    handover/               list, new, [id]
    away/                   list, new, [id]
    settings/               account, notifications, data export & deletion, billing
  s/[token]/              public share view — the caregiver / partner experience
  api/
    ai/generate/            server-owned prompts, budget, audit
    share/[token]/          tokenised read
    stripe/webhook/
lib/
  household/              domain model, Zod schemas, queries
  packing/                ← ported from Readied's buildLocal(). Pure. Unit-tested.
  handover/               document assembly. Pure. Unit-tested.
  ai/                     gateway, prompts, output validation, budget
  export/                 ← ported paged-canvas PDF/image engine
  i18n/                   ← ported hand-curated UI translation tables
  design/                 tokens
components/
  ui/                     primitives
  patterns/               shared compositions
```

Two structural rules:

1. **`lib/packing` and `lib/handover` are pure functions with no I/O, no React and no network.**
   They take a household snapshot and return a document. That is what makes them testable, and it is
   what makes the deterministic-first architecture enforceable rather than aspirational.
2. **`lib/ai` is the only module that may call a model.** Nothing else imports an SDK.

---

## 8.4 The AI gateway

One module, one entry point:

```ts
generate({
  household,          // scoped snapshot, minimised to the task
  surface,            // 'handover' | 'away'
  task,               // 'extract' | 'prose' | 'translate' | 'weather'
  locale,
})
```

Responsibilities, in order:

1. **Check budget.** Account allowance and household spend cap. Over budget → return the
   deterministic result, do not call the model.
2. **Minimise the payload.** Only the fields the task needs. Tokenise names for tasks that do not
   need them.
3. **Build the prompt server-side.** Never from the request body.
4. **Call, with timeout and one retry** on transient failure only.
5. **Validate the output against a Zod schema.** Reject and fall back rather than render unknown
   shapes. (Readied already does this; make it structural.)
6. **Record to `ai_generation`** — model, tokens, cost, and a summary of which fields were sent.
7. **Return `{ ok, data, degraded }`** so the UI can honestly tell the user when it fell back.

Deterministic fallback is mandatory for every task. If `generate()` cannot be called, the product
still works. That is not a resilience nicety; it is what makes the free tier viable and what makes
an outage a non-event.

---

## 8.5 Cross-cutting concerns

**Notifications.** One preference centre, per-surface topics, quiet hours honoured, and a hard rule:
**no notification exists to drive engagement.** A notification is sent only when there is a
time-sensitive fact the user would want ("Claire opened the guide"; "you're away on Friday and the
guide is from March"). Web Push for installed PWAs, email otherwise. Every notification has an
unsubscribe that works.

**Background jobs.** Share-token expiry and purge; a pre-event check that fires the Home suggestion;
soft-deleted data hard-deleted after 30 days; monthly allowance reset; Stripe reconciliation.

**Observability.** Sentry for errors with source maps and PII scrubbing. Structured logs on every
API route with a request ID. PostHog for funnels. Uptime checks on the app and the AI route. An
alert on AI spend crossing a daily threshold — this is the one that would have caught the open-proxy
problem.

**Error handling.** The current apps get this partly right already and it should be codified: every
async boundary has a defined failure UI; nothing fails silently; every failure offers a route
forward; and the deterministic fallback means "AI unavailable" is a quiet degradation, not an error.

**Security baseline.** CSP with no `unsafe-inline`, Subresource Integrity or self-hosting for any
third-party script, secrets only in environment variables, rate limits on every write route and on
share-token lookups, escaped output everywhere by default (React does this, which is a reason to use
it), dependency scanning in CI, and no RLS policy with a bare `true`.

**GDPR.** Lawful basis documented per processing purpose. Special-category health data about
children identified and minimised. Data export and deletion available in-product, not by email
request. A processor register covering Supabase, Vercel, Anthropic, Stripe, PostHog and Resend, with
the data-residency position for each. Retention: share links expire; households inactive for
24 months are notified and then purged. A DPIA for the AI processing of children's health data —
this is genuinely required, not box-ticking, and it should be written before launch rather than
after.

**Performance budget.** Enforce in CI: LCP under 2.0 s on a mid-range Android over 4G, JS under
150 KB gzipped on the critical path, no render-blocking third-party script, fonts self-hosted with
`font-display: swap`. Held currently ships ~1 MB of PDF libraries in `<head>` for a feature reached
by a minority of users at the end of a long flow; the budget makes that impossible.

**Scalability.** The honest assessment: nothing here is a scale problem for a very long time. The
workload is a few writes per session and an occasional model call. The real cost driver is AI spend
per generation, which is why budgets and caching are in the architecture from day one and horizontal
scaling is not.

---

## 8.6 Testing

Currently zero tests. The proposed minimum, in priority order:

1. **Unit tests on `lib/packing` and `lib/handover`.** These are pure functions encoding the
   business's actual IP. Every dry-spell and transit-bag case from Readied becomes a test. This is
   the highest-value testing in the project and should be written *as the logic is ported*, using
   the current behaviour as the specification.
2. **Contract tests on AI output validation.** Feed recorded malformed model responses through the
   validators and assert graceful degradation.
3. **A safety-critical regression suite.** Explicit tests that an allergy entered by a parent appears
   in the generated document, reaches the model, survives translation, and is never paraphrased.
   Bug B1 gets a permanent test.
4. **Playwright E2E** on the three journeys that matter: sign up → household → first handover;
   partner joins a household; caregiver opens a share link.
5. **axe-core in CI** on every key route, failing the build on violations.
6. **Visual regression** on the generated documents, since a broken PDF is invisible to unit tests.

---

## 8.7 Migration

There is no data migration, because there is no server-side user data other than the `trips` and
`events` tables — and `trips` are ephemeral packing lists for journeys that have mostly already
happened.

What must be handled:

- **Existing `localStorage` users.** Anyone with a saved draft or child profile loses it if the
  domain's storage is cleared. Ship a one-time import: on first load of the new app at the same
  origin, detect the legacy keys, offer "we found your saved details — bring them in?", and migrate
  into the new household. Non-destructive, one tap, and it turns an abandonment risk into a
  pleasant surprise.
- **The old apps stay live** on their current URLs until the new surfaces reach parity, then
  redirect. No hard cutover.
- **The `trips` table** is locked down immediately (see `SECURITY-IMMEDIATE.md`), then given an
  expiry, then retired with the old app.
