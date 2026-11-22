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
