-- Day meetups (Barnes walks) + option availability

alter table groups
  add column if not exists supports_day_meetups boolean not null default false;

update groups set supports_day_meetups = true where id = 'barnes';

alter table rounds
  add column if not exists kind text not null default 'evening'
    check (kind in ('evening', 'day'));

alter table options
  add column if not exists open_days int[], -- null = open any day; 0=Sun … 6=Sat
  add column if not exists availability_note text;

-- Morning / afternoon free marks for day meetup rounds
create table if not exists slot_votes (
  round_id uuid references rounds(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('morning', 'afternoon')),
  primary key (round_id, member_id, date, slot)
);

alter table slot_votes enable row level security;

-- Optional short comments on a venue/show (e.g. "Closed Tuesdays")
create table if not exists option_comments (
  id uuid primary key default gen_random_uuid(),
  group_id text references groups(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table option_comments enable row level security;

create index if not exists option_comments_option_id_idx on option_comments(option_id);
create index if not exists slot_votes_round_id_idx on slot_votes(round_id);
