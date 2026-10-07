-- One-line subtitle shown under the group name. Editable per group, no code change.

alter table groups
  add column if not exists subtitle text;

update groups
set subtitle = 'Evenings from 7pm'
where id = 'french' and (subtitle is null or subtitle = '');

update groups
set subtitle = 'Evenings from 8pm · Day walks'
where id = 'barnes' and (subtitle is null or subtitle = '');
