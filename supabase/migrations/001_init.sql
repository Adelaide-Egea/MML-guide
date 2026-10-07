-- Mums' Night Out — initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).

create extension if not exists "pgcrypto";

create table groups (
  id text primary key,
  name text not null,
  invite_token text unique not null,
  start_time time not null,
  arrival_note text,
  evenings int[] not null default '{2,3,4}',
  lead_days int not null default 11,
  horizon_days int not null default 28,
  vote_hours int not null default 24,
  show_budget int,
  area_label text,
  preferred_lines text[] default '{}'
);

create table members (
  id uuid primary key default gen_random_uuid(),
  group_id text references groups(id) on delete cascade,
  first_name text not null,
  active boolean default true
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  group_id text references groups(id) on delete cascade,
  status text not null check (status in ('voting','pick','decided','done','cancelled')),
  opened_at timestamptz not null default now(),
  closes_at timestamptz not null,
  dates date[] not null,
  chosen_date date,
  chosen_option_id uuid
);

create table date_votes (
  round_id uuid references rounds(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  date date not null,
  primary key (round_id, member_id, date)
);

create table options (
  id uuid primary key default gen_random_uuid(),
  group_id text references groups(id) on delete cascade,
  kind text not null check (kind in ('show','drinks','food','activity')),
  title text not null,
  venue text,
  area text,
  station text,
  lines text[] default '{}',
  price_from numeric,
  runs_from date,
  runs_to date,
  url text,
  note text,
  is_new boolean default false,
  upcoming boolean default false,
  flexible_arrival boolean default true,
  seen boolean default false,
  seen_on date,
  status text not null default 'approved' check (status in ('approved','pending'))
);

create table option_picks (
  round_id uuid references rounds(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  primary key (round_id, member_id, option_id)
);

create table history (
  id uuid primary key default gen_random_uuid(),
  group_id text references groups(id) on delete cascade,
  date date not null,
  option_id uuid references options(id),
  title text not null
);

-- RLS: enable on every table. Anon/authenticated get NO policies → no direct access.
-- All app reads/writes use the service role key via server actions / route handlers.

alter table groups enable row level security;
alter table members enable row level security;
alter table rounds enable row level security;
alter table date_votes enable row level security;
alter table options enable row level security;
alter table option_picks enable row level security;
alter table history enable row level security;

-- Indexes for scoped lookups
create index members_group_id_idx on members(group_id);
create index rounds_group_id_idx on rounds(group_id);
create index options_group_id_idx on options(group_id);
create index history_group_id_idx on history(group_id);
create index groups_invite_token_idx on groups(invite_token);
