-- Allow evening + day rounds at once; walk planning details on day rounds

alter table rounds
  add column if not exists meeting_point text,
  add column if not exists pushchair_friendly boolean,
  add column if not exists coffee_stop text;
