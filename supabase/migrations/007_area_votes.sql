-- Evening polls: which areas people would like to meet in.
create table if not exists area_votes (
  round_id uuid references rounds(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  area text not null,
  primary key (round_id, member_id, area)
);

alter table area_votes enable row level security;

create index if not exists area_votes_round_id_idx on area_votes(round_id);
