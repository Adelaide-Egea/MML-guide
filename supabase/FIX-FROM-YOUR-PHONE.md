# Closing the Supabase hole without a computer

You need to do one thing, from your phone, that takes about two minutes. I do
everything else.

## Where this stands

**Done (2026-09-07).** The project was restored and the hole closed in one
`--apply` run. Post-migration, `anon` can read **0** rows from `trips` and
`events`. A leftover empty `"Trips"` table was also locked down. Revoke the
personal access token when you are finished with this session.

Previously the project (`jgqemguvrslzrbedjirq`) was paused, so nothing was being
leaked while it was down — luck rather than a fix. The sequence mattered: restore
and migrate in one run so there was no live-and-exposed window.
`supabase/apply.mjs` refuses to report success unless the exposure check returns
zero.

## What you do

1. On your phone, open **[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)**
   and sign in.
2. Tap **Generate new token**. Name it `cursor-agent`. Copy the value — it starts
   with `sbp_` and is shown only once.
3. Open **[cursor.com/dashboard](https://cursor.com/dashboard)** → **Cloud Agents** →
   **Secrets**, and add:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_ACCESS_TOKEN` | the `sbp_...` token you just copied |

4. Tell me it is done.

That is the whole job. The token is scoped to your Supabase account, so revoke it at
the same URL when we are finished — I will remind you.

## What I do with it

Running `node supabase/apply.mjs --check` first, which changes nothing and reports:

- whether the project is paused or running,
- how many rows are in `trips`,
- how many of those rows the `anon` role can actually read.

That last number is the one that matters, and it is the number the previous fix
never measured. Then `--apply`:

1. Restores the project and waits for it to come up healthy.
2. Dumps `trips` and `events` to a timestamped JSON file before touching anything.
3. Applies `migrations/0001_lock_down_trips.sql` — drops every blanket policy,
   forces row-level security, adds an unguessable share token per trip, and moves
   reads behind a security-definer function.
4. **Re-runs the exposure check** and exits non-zero if `anon` can still read the
   table. A migration that ran without error is not evidence that the hole is shut.
5. Pulls Supabase's own security advisor and lists anything still at error level.

## Two things worth doing at the same time

**Rotate the Anthropic key.** It sat behind an unauthenticated proxy that accepted a
caller-supplied system prompt, so it should be treated as leaked regardless of
whether anyone found it. On your phone: **console.anthropic.com** → API keys →
create a new one, delete the old one, and set a monthly spend cap while you are
there. Then add the new value to Cursor Secrets as `ANTHROPIC_API_KEY` and I will
redeploy.

**Take down two pages.** `security.html` and `setup.html` on the Readied deployment
both hand a visitor working SQL against the project, and `security.html` asserts the
table is secure when it is not. They should be deleted rather than fixed.

## After it is closed

The remaining open question is whether the exposure needs reporting to the ICO or
the CNIL, which turns on whether the table was ever actually read by anything other
than the app. That is decision D7 in `docs/strategy/11-decisions-required.md`, and
the access logs — which the same token can reach — are the evidence it depends on.
I will pull them in the same session and give you a straight answer.
