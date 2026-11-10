-- Follow-up to 0001_lock_down_trips.sql.
--
-- After restore we found two siblings of the original hole:
--   1. public.events still had `select ... using (true)` for anon
--      (setup.html installed the same open-policy pattern for analytics).
--   2. An empty legacy public."Trips" table with RLS off and full grants
--      to anon. Zero rows, but the advisor correctly flagged it.
--
-- Inserts into events stay open so the app's analytics keep working.
-- Reading analytics is a service-role / authenticated concern.

begin;

-- ── events: insert-only for anon ─────────────────────────────────────────────

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'events' and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.events', policy_name);
  end loop;
end $$;

alter table public.events enable row level security;
alter table public.events force row level security;

-- ── legacy "Trips": deny everything at the privilege layer ───────────────────

alter table public."Trips" enable row level security;
alter table public."Trips" force row level security;
revoke all on table public."Trips" from anon, authenticated;

commit;

-- Verification as anon:
--   select count(*) from public.events;   -- expect 0
--   select count(*) from public."Trips";   -- expect permission denied or 0
