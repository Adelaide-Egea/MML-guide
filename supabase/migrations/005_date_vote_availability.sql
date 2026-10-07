-- Ternary date votes: yes / if_needed / cant
-- Existing rows meant "free" → default to yes.

alter table date_votes
  add column if not exists availability text not null default 'yes'
  check (availability in ('yes', 'if_needed', 'cant'));
