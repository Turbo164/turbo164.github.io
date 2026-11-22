-- Run once in the Supabase SQL Editor to show the exact registered account count.
-- This function returns only the total; it does not expose account details.
create or replace function public.turbo164_public_user_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from auth.users;
$$;

revoke all on function public.turbo164_public_user_count() from public;
grant execute on function public.turbo164_public_user_count() to anon, authenticated;

-- Return only a pseudonymous joiner name and join time, never email or auth metadata.
create or replace function public.turbo164_recent_joiners()
returns table(display_name text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(nullif(profile.display_name, ''), 'Collector ' || left(users.id::text, 6))::text,
    users.created_at
  from auth.users as users
  left join public.community_profiles as profile on profile.user_id = users.id
  where users.created_at >= now() - interval '3 days'
  order by users.created_at desc
  limit 25;
$$;

revoke all on function public.turbo164_recent_joiners() from public;
grant execute on function public.turbo164_recent_joiners() to anon, authenticated;
