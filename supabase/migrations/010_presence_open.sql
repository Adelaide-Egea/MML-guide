-- After the poll closes, organisers can reopen just the chosen date for late names.

alter table rounds
  add column if not exists presence_open boolean not null default false;
