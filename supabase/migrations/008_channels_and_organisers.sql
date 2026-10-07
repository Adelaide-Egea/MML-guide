-- Barnes night outs and day walks keep separate name lists.
alter table members
  add column if not exists channel text not null default 'evening'
  check (channel in ('evening', 'day'));

-- Extra organiser emails. The site owner in ADMIN_EMAIL always stays allowed.
create table if not exists organisers (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table organisers enable row level security;
