-- Run once in the Supabase SQL Editor for Turbo164.
create table if not exists public.community_monthly_announcements (
  month_start date primary key,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 5000),
  hashtag text check (hashtag is null or (char_length(hashtag) between 3 and 51 and hashtag ~ '^#[^[:space:]]+
  photo_path text,
  video_path text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_monthly_announcements_month_start_first_day
    check (extract(day from month_start) = 1)
);

alter table public.community_monthly_announcements enable row level security;

drop policy if exists "Monthly announcements are public" on public.community_monthly_announcements;
create policy "Monthly announcements are public"
  on public.community_monthly_announcements for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage monthly announcements" on public.community_monthly_announcements;
create policy "Admins manage monthly announcements"
  on public.community_monthly_announcements for all
  to authenticated
  using (public.is_arbox_photo_admin())
  with check (
    public.is_arbox_photo_admin()
    and (updated_by is null or updated_by = auth.uid())
  );

grant select on public.community_monthly_announcements to anon, authenticated;
grant insert, update, delete on public.community_monthly_announcements to authenticated;
)),
  photo_path text,
  video_path text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_monthly_announcements_month_start_first_day
    check (extract(day from month_start) = 1)
);

alter table public.community_monthly_announcements enable row level security;

drop policy if exists "Monthly announcements are public" on public.community_monthly_announcements;
create policy "Monthly announcements are public"
  on public.community_monthly_announcements for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage monthly announcements" on public.community_monthly_announcements;
create policy "Admins manage monthly announcements"
  on public.community_monthly_announcements for all
  to authenticated
  using (public.is_arbox_photo_admin())
  with check (
    public.is_arbox_photo_admin()
    and (updated_by is null or updated_by = auth.uid())
  );

grant select on public.community_monthly_announcements to anon, authenticated;
grant insert, update, delete on public.community_monthly_announcements to authenticated;
