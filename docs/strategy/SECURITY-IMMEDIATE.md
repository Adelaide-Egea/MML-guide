# Security — needs action before anything else

Three findings affect live systems. Two involve children's personal data or uncapped spend. They are
not part of the phased roadmap; they should be fixed first, independently of any strategy decision.

Nothing in this document has been executed. I have not touched the Supabase project and have not
issued any request against it — the analysis below is from reading the SQL in `security.html` and
the client code. **I can implement all three fixes myself once I have access to the Supabase project
and the two Vercel projects.**

---

## 1. The `trips` and `events` tables are world-readable

### What is wrong

`security.html` presents itself as a fix and reports success. The policy it installs does not do
what it claims:

```sql
create policy "read trip by code"
  on trips for select to anon
  using (true);
```

In Postgres row-level security, `USING (true)` on a `SELECT` policy means *every row passes the
check*. The comment above it in the script says reading "requires filtering by an exact code" — it
does not. The `revoke select … / grant select (id, code, data, created_at)` lines that follow are
**column** privileges, not row privileges, and they grant back `data`, which holds everything.

`UPDATE` has the same problem (`using (true) with check (true)`), so any caller can overwrite any
trip. `events` is open for both read and insert.

### What that means in practice

The publishable key is in the deployed page source. That is normally fine. Here it is the only
control, so anyone who views source can then request every row of `trips` — which contains
children's names, ages, per-person packing lists and the parent's free-text notes — in one call.

### Why the built-in test said it was secure

The "Test security" button creates a trip, reads it back, and attempts a delete. It reports
**"Secure. Sharing works, and nobody can delete or list your trips."** if the delete fails. It never
tests listing. It verified the one thing that was fixed and asserted the thing that was not.

### The fix

Reading must require proving knowledge of the code, which RLS alone cannot express for an anonymous
caller. Two workable options:

**Option A — server-side read (recommended).** Revoke all anon access to `trips`. Move create, read,
and update behind Vercel functions that hold the service-role key server-side, take the code as a
parameter, and return only the matching row. This also gives you a place to rate-limit joins, which
matters because a 5-character code from a 32-character alphabet is ~33.5M combinations — enumerable
by a determined attacker in a way that a server can detect and a database cannot.

**Option B — security-definer RPC.** Keep RLS deny-all for `anon` and expose a
`get_trip(code text)` function marked `SECURITY DEFINER` that returns at most one row. Less code
than A, but no natural place for rate limiting.

Either way:
- `DELETE` stays denied.
- `UPDATE` must be constrained to the row whose code was presented, not `using (true)`.
- `events` should be insert-only for `anon` with **no** read policy; reading analytics is an
  authenticated/service-role operation.
- Lengthen new share codes to 8 characters and add an expiry (see below).

### Data protection

If the `trips` table holds real families' data — and Readied's own analytics can tell us whether it
does — this is a personal-data exposure involving children under UK GDPR / GDPR. The determination
of whether it is reportable to the ICO/CNIL depends on how long it was open and whether any
unauthorised access occurred. **Supabase logs can answer that.** The sequence should be: fix, then
pull the access logs, then decide on notification with the facts in hand. This is a product-owner
decision, not mine, but I will assemble the evidence.

### Retention

There is currently no expiry on shared trips. A packing list for a trip that ended in July 2026 is
still live. Add a `created_at`-based expiry (90 days is defensible) and a scheduled job to purge.

---

## 2. Both `/api/generate` endpoints are open proxies to your paid Anthropic account

### Held

```js
model: 'claude-sonnet-4-6',
max_tokens: req.body.max_tokens || 1600,
system: req.body.system,        // caller-controlled
messages: req.body.messages     // caller-controlled
```

Anyone can POST any prompt and have it billed to you. The rate limit is a `Map` in module scope: it
lives in one serverless instance's memory, resets on every cold start, and is not shared across
concurrent instances. It is not a rate limit.

### Readied

Worse — it forwards `req.body` wholesale with no rate limiting at all, so `model` and `max_tokens`
are caller-controlled too. A caller can request the most expensive model at maximum tokens in a loop.

### The fix

1. **Server owns the prompt.** The client sends structured data only. The system prompt, model and
   `max_tokens` are constants in the function, never read from the request.
2. **Validate the body** against a schema and reject anything unexpected.
3. **Durable rate limiting** (Vercel KV or Upstash Redis), keyed on IP now and on account once
   accounts exist.
4. **A spend cap in the Anthropic console** as a backstop that does not depend on our code being
   correct.
5. **Remove Readied's browser fallback** that posts the prompt — containing children's names and
   notes — directly to `api.anthropic.com` when the proxy fails. It cannot succeed (no key) and
   sends data off-device for no benefit.
6. Rotate `ANTHROPIC_API_KEY` after the fix, on the assumption the current one has been exposed to
   unmetered use.

Check current Anthropic usage for anomalies while doing this.

---

## 3. Held renders user and model text as HTML without escaping

`parseInlineBold()` returns raw HTML and is applied to routine notes, important-note lines and AI
output, all written via `innerHTML` with no prior escaping:

```js
html += `<div class="sched-note">${tag}${item.notes ? ' — ' + parseInlineBold(item.notes) : ''}</div>`;
```

Today this is self-XSS — you can only attack yourself — so it is not urgent in the way the first two
are. It becomes a genuine vulnerability the moment guides are shared between accounts, which is on
the roadmap. There is also a prompt-injection route in: parent text goes to the model, model output
comes back and is injected unescaped.

Fix: escape first, then apply a strict bold-only transform to the escaped string. Readied already
does the right thing with a consistently applied `esc()`; Held should match it.

---

## Suggested order

1. Lock down `trips` and `events`; verify by attempting a full-table read and confirming it fails.
2. Pull Supabase access logs; establish whether anything was actually read.
3. Close both AI proxies; rotate the Anthropic key; set a spend cap.
4. Fix Held's escaping.
5. Add share-code expiry and lengthen new codes.

Steps 1, 3, 4 and 5 are code and configuration I can do directly. Step 2 produces facts you will
need in order to make the notification decision.
