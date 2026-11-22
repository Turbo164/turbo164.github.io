-- Run once in the Supabase SQL Editor after monthly-announcements.sql.
alter table public.community_monthly_announcements
  add column if not exists hashtag text;

alter table public.community_monthly_announcements
  drop constraint if exists community_monthly_announcements_hashtag_format;

alter table public.community_monthly_announcements
  add constraint community_monthly_announcements_hashtag_format
  check (
    hashtag is null
    or (char_length(hashtag) between 3 and 51 and hashtag ~ '^#[^[:space:]]+$')
  );
