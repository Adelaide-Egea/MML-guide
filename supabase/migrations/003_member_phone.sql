-- Optional phone so mums outside WhatsApp can get date/time/place updates

alter table members
  add column if not exists phone text;
