-- One-off house events (craft evening at Adelaide's). Barnes-only in the app.
-- RLS on, no anon policies. The service role writes through server actions.

create table if not exists home_events (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references groups(id) on delete cascade,
  title text not null default 'Craft evening at Adelaide''s',
  start_time time not null default '20:00',
  note text default 'Little babies are very welcome!',
  dates date[] not null,
  opened_at timestamptz not null default now(),
  closes_at timestamptz not null,
  chosen_date date,
  status text not null default 'open' check (status in ('open','archived')),
  constraint home_events_barnes_only check (group_id = 'barnes')
);

create unique index if not exists home_events_one_open_per_group
  on home_events (group_id)
  where status = 'open';

create table if not exists home_event_responses (
  event_id uuid not null references home_events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  dates date[] not null default '{}',
  bringing text[] not null default '{}',
  note text check (char_length(note) <= 300),
  updated_at timestamptz default now(),
  primary key (event_id, member_id)
);

alter table home_events enable row level security;
alter table home_event_responses enable row level security;
