-- Closes the exposure described in docs/strategy/SECURITY-IMMEDIATE.md.
--
-- The `trips` table is currently readable by anyone holding the publishable key,
-- which is printed in the deployed page source. It contains children's names, ages
-- and parents' notes. The security.html page shipped previously claimed to have
-- fixed this; the policy it installed granted `select ... using (true)`, and the
-- test on that page only ever checked `delete`, so the hole was never detected.
--
-- The app has no accounts, so there is no user to scope rows to. The only thing a
-- client legitimately knows is the identifier of the trip it just created. This
-- migration therefore does two things:
--
--   1. Removes every blanket policy, so the anon role can no longer list the table.
--   2. Replaces open reads with a lookup by an unguessable share token, exposed
--      through a security-definer function rather than through table access.
--
-- After this runs, `select * from trips` as anon returns zero rows. A client can
-- only fetch a trip it holds the token for.

begin;

-- ── 1. Remove the existing blanket policies ──────────────────────────────────
-- Named policies are dropped defensively; unknown ones are swept up by the loop.

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'trips'
  loop
    execute format('drop policy if exists %I on public.trips', policy_name);
  end loop;
end $$;

alter table public.trips enable row level security;
alter table public.trips force row level security;

-- ── 2. Share tokens ──────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

alter table public.trips
  add column if not exists share_token text;

update public.trips
   set share_token = encode(gen_random_bytes(24), 'hex')
 where share_token is null;

alter table public.trips
  alter column share_token set default encode(gen_random_bytes(24), 'hex'),
  alter column share_token set not null;

create unique index if not exists trips_share_token_key on public.trips (share_token);

-- ── 3. Policies ──────────────────────────────────────────────────────────────
--
-- Insert stays open because the app has no accounts and must keep working. Read,
-- update and delete are closed entirely at the table level; reads go through the
-- function below instead. Insert is additionally guarded by the rate limit on the
-- API route and should be revisited when accounts land in Phase 2.

create policy trips_insert_anon
  on public.trips
  for insert
  to anon
  with check (true);

-- Deliberately no select, update or delete policy for anon. Absence of a policy
-- under RLS means no rows, which is the desired outcome.

-- ── 4. Token-scoped read ─────────────────────────────────────────────────────

create or replace function public.trip_by_token(token text)
returns setof public.trips
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select * from public.trips where share_token = token limit 1;
$$;

revoke all on function public.trip_by_token(text) from public;
grant execute on function public.trip_by_token(text) to anon, authenticated;

commit;

-- ── Verification ─────────────────────────────────────────────────────────────
-- Run these as the anon role. The first must return zero rows; the second must
-- return exactly one. The previous fix was accepted without the first check,
-- which is why it did not work.
--
--   set role anon;
--   select count(*) from public.trips;                    -- expect 0
--   select count(*) from public.trip_by_token('<token>'); -- expect 1
--   reset role;
