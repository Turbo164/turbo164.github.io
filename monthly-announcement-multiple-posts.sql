-- Upgrade monthly announcements to support several posts in the same month.
-- Run after monthly-announcement-engagement.sql.
begin;

create table if not exists public.community_monthly_announcement_items (
  id uuid primary key default gen_random_uuid(),
  month_start date not null check (extract(day from month_start) = 1),
  legacy_source_month date unique,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 5000),
  hashtag text check (hashtag is null or (char_length(hashtag) between 3 and 51 and hashtag ~ '^#[^[:space:]]+$')),
  photo_path text,
  video_path text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_monthly_announcement_items enable row level security;
drop policy if exists "Monthly announcement items are public" on public.community_monthly_announcement_items;
create policy "Monthly announcement items are public"
  on public.community_monthly_announcement_items for select to anon, authenticated using (true);
drop policy if exists "Admins manage monthly announcement items" on public.community_monthly_announcement_items;
create policy "Admins manage monthly announcement items"
  on public.community_monthly_announcement_items for all to authenticated
  using (public.is_arbox_photo_admin())
  with check (public.is_arbox_photo_admin() and (updated_by is null or updated_by = auth.uid()));
grant select on public.community_monthly_announcement_items to anon, authenticated;
grant insert, update, delete on public.community_monthly_announcement_items to authenticated;

insert into public.community_monthly_announcement_items
  (month_start, legacy_source_month, title, body, hashtag, photo_path, video_path, updated_by, created_at, updated_at)
select month_start, month_start, title, body, hashtag, photo_path, video_path, updated_by, created_at, updated_at
from public.community_monthly_announcements
on conflict (legacy_source_month) do nothing;

alter table public.community_monthly_announcement_likes add column if not exists announcement_id uuid;
update public.community_monthly_announcement_likes l
set announcement_id = a.id
from public.community_monthly_announcement_items a
where a.legacy_source_month = l.month_start and l.announcement_id is null;
alter table public.community_monthly_announcement_likes alter column announcement_id set not null;
alter table public.community_monthly_announcement_likes
  drop constraint if exists community_monthly_announcement_likes_month_start_fkey;
alter table public.community_monthly_announcement_likes
  drop constraint if exists community_monthly_announcement_likes_pkey;
alter table public.community_monthly_announcement_likes
  add constraint community_monthly_announcement_likes_announcement_id_fkey
  foreign key (announcement_id) references public.community_monthly_announcement_items(id) on delete cascade;
alter table public.community_monthly_announcement_likes
  drop column if exists month_start;
alter table public.community_monthly_announcement_likes
  add constraint community_monthly_announcement_likes_pkey primary key (announcement_id, user_id);

alter table public.community_saved_monthly_announcements add column if not exists announcement_id uuid;
update public.community_saved_monthly_announcements s
set announcement_id = a.id
from public.community_monthly_announcement_items a
where a.legacy_source_month = s.month_start and s.announcement_id is null;
alter table public.community_saved_monthly_announcements alter column announcement_id set not null;
alter table public.community_saved_monthly_announcements
  drop constraint if exists community_saved_monthly_announcements_month_start_fkey;
alter table public.community_saved_monthly_announcements
  drop constraint if exists community_saved_monthly_announcements_pkey;
alter table public.community_saved_monthly_announcements
  add constraint community_saved_monthly_announcements_announcement_id_fkey
  foreign key (announcement_id) references public.community_monthly_announcement_items(id) on delete cascade;
alter table public.community_saved_monthly_announcements
  drop column if exists month_start;
alter table public.community_saved_monthly_announcements
  add constraint community_saved_monthly_announcements_pkey primary key (announcement_id, user_id);

drop function if exists public.community_monthly_announcement_engagement(date);
create or replace function public.community_monthly_announcement_engagement(p_announcement_id uuid)
returns table (like_count bigint, liked boolean, saved boolean)
language sql stable security definer set search_path = ''
as $$
  select
    (select count(*) from public.community_monthly_announcement_likes l where l.announcement_id = p_announcement_id),
    exists (select 1 from public.community_monthly_announcement_likes l where l.announcement_id = p_announcement_id and l.user_id = auth.uid()),
    exists (select 1 from public.community_saved_monthly_announcements s where s.announcement_id = p_announcement_id and s.user_id = auth.uid());
$$;
revoke all on function public.community_monthly_announcement_engagement(uuid) from public;
grant execute on function public.community_monthly_announcement_engagement(uuid) to anon, authenticated;

commit;
