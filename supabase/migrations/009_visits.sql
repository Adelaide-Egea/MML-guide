-- Page opens on invite links. Service role only; members never read this.
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references groups (id) on delete cascade,
  channel text not null check (channel in ('evening', 'day', 'both')),
  path text not null,
  visitor_id uuid not null,
  member_id uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists visits_created_at_idx on visits (created_at desc);
create index if not exists visits_group_created_idx on visits (group_id, created_at desc);
create index if not exists visits_visitor_path_idx on visits (visitor_id, path, created_at desc);

alter table visits enable row level security;
