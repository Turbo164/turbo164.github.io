-- Turbo164 daily login point claims.
-- One signed-in user can claim one point per calendar day in Asia/Bangkok.
create table if not exists public.community_daily_login_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null,
  points smallint not null default 1 check (points = 1),
  claimed_at timestamptz not null default now(),
  primary key (user_id,claim_date)
);

alter table public.community_daily_login_claims enable row level security;

drop policy if exists "Users read own daily login claims" on public.community_daily_login_claims;
create policy "Users read own daily login claims"
  on public.community_daily_login_claims for select to authenticated
  using (user_id = auth.uid());

grant select on public.community_daily_login_claims to authenticated;
revoke insert, update, delete on public.community_daily_login_claims from anon, authenticated;

create or replace function public.community_daily_login_status()
returns table(month_start date,claimed_today boolean,points_this_month integer)
language sql
stable
security definer
set search_path = ''
as $$
  with clock as (
    select (now() at time zone 'Asia/Bangkok')::date as today
  )
  select
    date_trunc('month',clock.today::timestamp)::date,
    exists (
      select 1
      from public.community_daily_login_claims as claims
      where claims.user_id = (select auth.uid())
        and claims.claim_date = clock.today
    ),
    (
      select count(*)::integer
      from public.community_daily_login_claims as claims
      where claims.user_id = (select auth.uid())
        and claims.claim_date >= date_trunc('month',clock.today::timestamp)::date
        and claims.claim_date < (date_trunc('month',clock.today::timestamp) + interval '1 month')::date
    )
  from clock;
$$;

create or replace function public.community_claim_daily_login_point()
returns table(points_awarded integer,claimed_today boolean,points_this_month integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_today date := (now() at time zone 'Asia/Bangkok')::date;
  v_awarded integer := 0;
begin
  if v_user is null then
    raise exception 'Sign in to claim a daily point.';
  end if;

  insert into public.community_daily_login_claims(user_id,claim_date)
  values (v_user,v_today)
  on conflict (user_id,claim_date) do nothing;

  get diagnostics v_awarded = row_count;

  return query
  select
    v_awarded,
    exists (
      select 1 from public.community_daily_login_claims as claims
      where claims.user_id = v_user and claims.claim_date = v_today
    ),
    (
      select count(*)::integer
      from public.community_daily_login_claims as claims
      where claims.user_id = v_user
        and claims.claim_date >= date_trunc('month',v_today::timestamp)::date
        and claims.claim_date < (date_trunc('month',v_today::timestamp) + interval '1 month')::date
    );
end;
$$;

revoke all on function public.community_daily_login_status() from public;
revoke all on function public.community_claim_daily_login_point() from public;
grant execute on function public.community_daily_login_status() to authenticated;
grant execute on function public.community_claim_daily_login_point() to authenticated;
