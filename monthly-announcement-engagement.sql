-- Run once in the Supabase SQL Editor after monthly-announcements.sql.
create table if not exists public.community_monthly_announcement_likes (
  month_start date not null references public.community_monthly_announcements(month_start) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (month_start, user_id)
);

create table if not exists public.community_saved_monthly_announcements (
  month_start date not null references public.community_monthly_announcements(month_start) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (month_start, user_id)
);

alter table public.community_monthly_announcement_likes enable row level security;
alter table public.community_saved_monthly_announcements enable row level security;

drop policy if exists "Users read their own monthly announcement likes" on public.community_monthly_announcement_likes;
create policy "Users read their own monthly announcement likes"
  on public.community_monthly_announcement_likes for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users like monthly announcements" on public.community_monthly_announcement_likes;
create policy "Users like monthly announcements"
  on public.community_monthly_announcement_likes for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users remove their monthly announcement likes" on public.community_monthly_announcement_likes;
create policy "Users remove their monthly announcement likes"
  on public.community_monthly_announcement_likes for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read their own saved monthly announcements" on public.community_saved_monthly_announcements;
create policy "Users read their own saved monthly announcements"
  on public.community_saved_monthly_announcements for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users save monthly announcements" on public.community_saved_monthly_announcements;
create policy "Users save monthly announcements"
  on public.community_saved_monthly_announcements for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users remove their saved monthly announcements" on public.community_saved_monthly_announcements;
create policy "Users remove their saved monthly announcements"
  on public.community_saved_monthly_announcements for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.community_monthly_announcement_likes to authenticated;
grant select, insert, delete on public.community_saved_monthly_announcements to authenticated;

create or replace function public.community_monthly_announcement_engagement(p_month_start date)
returns table (like_count bigint, liked boolean, saved boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.community_monthly_announcement_likes l where l.month_start = p_month_start),
    exists (
      select 1 from public.community_monthly_announcement_likes l
      where l.month_start = p_month_start and l.user_id = auth.uid()
    ),
    exists (
      select 1 from public.community_saved_monthly_announcements s
      where s.month_start = p_month_start and s.user_id = auth.uid()
    );
$$;

revoke all on function public.community_monthly_announcement_engagement(date) from public;
grant execute on function public.community_monthly_announcement_engagement(date) to anon, authenticated;
