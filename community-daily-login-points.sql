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


-- Keep daily check-ins in the same monthly contributor score as posts and approved uploads.
-- The existing archive table stores the combined score in its points column.

create or replace function public.community_top_contributors()
returns table(contributor_rank integer, username text, posts_shared bigint, car_uploads bigint, points bigint)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
begin
  perform public.community_archive_completed_contributor_months();
  return query
  with settings as (
    select
      date_trunc('month',timezone('Asia/Bangkok',now()))
        at time zone 'Asia/Bangkok' as month_start,
      date_trunc('month',timezone('Asia/Bangkok',now()))::date as month_start_date
  ), post_counts as (
    select p.author_id as user_id, count(*)::bigint as total
    from public.community_posts p, settings cfg
    where p.created_at >= cfg.month_start
    group by p.author_id
  ), car_counts as (
    select s.user_id, count(*)::bigint as total
    from public.arbox_model_submissions s, settings cfg
    where s.status='approved' and s.approved_at >= cfg.month_start
    group by s.user_id
  ), login_counts as (
    select claims.user_id, count(*)::bigint as total
    from public.community_daily_login_claims claims, settings cfg
    where claims.claim_date >= cfg.month_start_date
      and claims.claim_date < (cfg.month_start_date + interval '1 month')::date
    group by claims.user_id
  ), contributors as (
    select user_id from post_counts
    union
    select user_id from car_counts
    union
    select user_id from login_counts
  ), scores as (
    select c.user_id,
           coalesce(pc.total,0)::bigint as posts_shared,
           coalesce(cc.total,0)::bigint as car_uploads,
           (coalesce(pc.total,0)+coalesce(cc.total,0)+coalesce(lc.total,0))::bigint as points,
           case when cp.show_username then btrim(cp.username) else 'Anonymous contributor' end as username
    from contributors c
    left join post_counts pc on pc.user_id=c.user_id
    left join car_counts cc on cc.user_id=c.user_id
    left join login_counts lc on lc.user_id=c.user_id
    left join public.community_appearance cp on cp.user_id=c.user_id
  ), ranked as (
    select row_number() over(
             order by s.points desc,s.car_uploads desc,s.posts_shared desc,s.user_id asc
           )::integer as contributor_rank,
           s.username,s.posts_shared,s.car_uploads,s.points
    from scores s
  )
  select r.contributor_rank,r.username,r.posts_shared,r.car_uploads,r.points
  from ranked r
  where r.contributor_rank<=5
  order by r.contributor_rank;
end;
$function$;

create or replace function public.community_my_contribution_points()
returns table(month_start date, posts_shared bigint, car_uploads bigint, points bigint)
language sql
stable
security definer
set search_path to ''
as $function$
  with month as (
    select date_trunc('month',timezone('Asia/Bangkok',now())) as start_local
  ), totals as (
    select start_local::date as month_start,
      (select count(*) from public.community_posts p
       where p.author_id=auth.uid()
         and p.created_at >= start_local at time zone 'Asia/Bangkok') as posts_shared,
      (select count(*) from public.arbox_model_submissions s
       where s.user_id=auth.uid() and s.status='approved'
         and s.approved_at >= start_local at time zone 'Asia/Bangkok') as car_uploads,
      (select count(*) from public.community_daily_login_claims claims
       where claims.user_id=auth.uid()
         and claims.claim_date >= start_local::date
         and claims.claim_date < (start_local::date + interval '1 month')::date) as login_points
    from month where auth.uid() is not null
  )
  select t.month_start,t.posts_shared,t.car_uploads,
         (t.posts_shared+t.car_uploads+t.login_points)::bigint as points
  from totals t;
$function$;

create or replace function public.community_archive_completed_contributor_months()
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  this_month date := date_trunc('month',timezone('Asia/Bangkok',now()))::date;
begin
  with events as (
    select p.author_id as user_id,
           date_trunc('month',timezone('Asia/Bangkok',p.created_at))::date as month_start,
           1::bigint as post_count,0::bigint as car_count,0::bigint as login_count
    from public.community_posts p
    where date_trunc('month',timezone('Asia/Bangkok',p.created_at))::date < this_month
    union all
    select s.user_id,
           date_trunc('month',timezone('Asia/Bangkok',s.approved_at))::date as month_start,
           0::bigint as post_count,1::bigint as car_count,0::bigint as login_count
    from public.arbox_model_submissions s
    where s.status='approved' and s.approved_at is not null
      and date_trunc('month',timezone('Asia/Bangkok',s.approved_at))::date < this_month
    union all
    select claims.user_id,
           date_trunc('month',claims.claim_date::timestamp)::date as month_start,
           0::bigint as post_count,0::bigint as car_count,claims.points::bigint as login_count
    from public.community_daily_login_claims claims
    where claims.claim_date < this_month
  ), unarchived_events as (
    select e.* from events e
    where not exists (
      select 1 from public.community_monthly_contributor_archive a
      where a.month_start=e.month_start
    )
  ), scores as (
    select e.month_start,e.user_id,
           sum(e.post_count)::bigint as posts_shared,
           sum(e.car_count)::bigint as car_uploads,
           sum(e.post_count+e.car_count+e.login_count)::bigint as points,
           case when cp.show_username then btrim(cp.username) else 'Anonymous contributor' end as username
    from unarchived_events e
    left join public.community_appearance cp on cp.user_id=e.user_id
    group by e.month_start,e.user_id,cp.show_username,cp.username
  ), ranked as (
    select s.*,
           row_number() over(
             partition by s.month_start
             order by s.points desc,s.car_uploads desc,s.posts_shared desc,s.user_id asc
           )::integer as contributor_rank
    from scores s
  )
  insert into public.community_monthly_contributor_archive
    (month_start,contributor_rank,username,posts_shared,car_uploads,points)
  select r.month_start,r.contributor_rank,r.username,r.posts_shared,r.car_uploads,r.points
  from ranked r
  where r.contributor_rank<=5
  on conflict (month_start,contributor_rank) do nothing;
end;
$function$;
