# Supabase

These migrations are written but **not applied** — applying them needs project
access, which is D8 in `docs/strategy/11-decisions-required.md`.

## Order of operations when access lands

1. **Take a backup** of the `trips` and `events` tables before anything else.
2. Apply `migrations/0001_lock_down_trips.sql`.
3. Run the verification block at the bottom of that file **as the `anon` role**.
   `select count(*) from public.trips` must return `0`. If it returns rows, the
   migration did not take and the table is still exposed.
4. Pull the Supabase access logs for the `trips` table and establish whether it was
   ever read by anything other than the app. That evidence is what D7 (the
   ICO/CNIL notification decision) turns on.
5. Delete `security.html` and `setup.html` from the Readied deployment. Both hand a
   visitor working SQL against your project, and `security.html` in particular
   asserts that the table is secure when it is not.

## Why the previous fix did not work

`security.html` installed policies of the form:

```sql
create policy "..." on trips for select using (true);
```

Under row-level security, `using (true)` means *every row matches*, so this grants
unconditional read access to the `anon` role — the opposite of what the page said it
was doing. The page's built-in test only attempted a `delete`, saw it fail, and
reported success. A `select` was never attempted, so the exposure was invisible.

The lesson worth carrying into the rebuild: **a security test must assert the thing
you are afraid of, not an adjacent thing that happens to be blocked.**

## Readied's `events` table

`setup.html` creates an `events` table with the same open-policy pattern for
analytics. It needs the same treatment, but I have not written that migration yet
because the table's actual shape in the live project is unverified — the SQL in
`setup.html` may not match what is deployed. First thing to check once access
lands.
