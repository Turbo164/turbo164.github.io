-- Run this complete script in the Supabase SQL Editor for Turbo164.
-- Creates admin-managed monthly giveaway polls with an optional car photo.
create table if not exists public.community_giveaway_polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(btrim(question)) between 1 and 180),
  image_path text,
  created_by uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists community_giveaway_polls_created_at_idx
  on public.community_giveaway_polls(created_at desc);
create unique index if not exists community_giveaway_polls_one_active_idx
  on public.community_giveaway_polls(is_active) where is_active;

create table if not exists public.community_giveaway_poll_options (
  id bigint generated always as identity primary key,
  poll_id uuid not null references public.community_giveaway_polls(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 100),
  sort_order integer not null default 0,
  unique(id,poll_id)
);

create table if not exists public.community_giveaway_poll_votes (
  poll_id uuid not null references public.community_giveaway_polls(id) on delete cascade,
  option_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(poll_id,user_id),
  constraint community_giveaway_poll_votes_option_same_poll_fk
    foreign key(option_id,poll_id)
    references public.community_giveaway_poll_options(id,poll_id)
    on delete cascade
);

alter table public.community_giveaway_polls enable row level security;
alter table public.community_giveaway_poll_options enable row level security;
alter table public.community_giveaway_poll_votes enable row level security;

drop policy if exists "Giveaway polls are public" on public.community_giveaway_polls;
create policy "Giveaway polls are public" on public.community_giveaway_polls
  for select to anon,authenticated using (true);
drop policy if exists "Admins manage giveaway polls" on public.community_giveaway_polls;
create policy "Admins manage giveaway polls" on public.community_giveaway_polls
  for all to authenticated using (public.is_arbox_photo_admin())
  with check (public.is_arbox_photo_admin() and (created_by=auth.uid() or created_by is not null));

drop policy if exists "Giveaway poll options are public" on public.community_giveaway_poll_options;
create policy "Giveaway poll options are public" on public.community_giveaway_poll_options
  for select to anon,authenticated using (true);
drop policy if exists "Admins manage giveaway poll options" on public.community_giveaway_poll_options;
create policy "Admins manage giveaway poll options" on public.community_giveaway_poll_options
  for all to authenticated using (public.is_arbox_photo_admin())
  with check (public.is_arbox_photo_admin());

drop policy if exists "Users read own giveaway poll vote" on public.community_giveaway_poll_votes;
create policy "Users read own giveaway poll vote" on public.community_giveaway_poll_votes
  for select to authenticated using (user_id=auth.uid());
drop policy if exists "Users vote in active giveaways" on public.community_giveaway_poll_votes;
create policy "Users vote in active giveaways" on public.community_giveaway_poll_votes
  for insert to authenticated with check (
    user_id=auth.uid()
    and exists(select 1 from public.community_giveaway_polls p where p.id=poll_id and p.is_active)
    and exists(select 1 from public.community_giveaway_poll_options o where o.id=option_id and o.poll_id=poll_id)
  );
drop policy if exists "Users change vote in active giveaways" on public.community_giveaway_poll_votes;
create policy "Users change vote in active giveaways" on public.community_giveaway_poll_votes
  for update to authenticated using (user_id=auth.uid())
  with check (
    user_id=auth.uid()
    and exists(select 1 from public.community_giveaway_polls p where p.id=poll_id and p.is_active)
    and exists(select 1 from public.community_giveaway_poll_options o where o.id=option_id and o.poll_id=poll_id)
  );

grant select on public.community_giveaway_polls,public.community_giveaway_poll_options to anon,authenticated;
grant insert,update,delete on public.community_giveaway_polls,public.community_giveaway_poll_options to authenticated;
grant select,insert,update on public.community_giveaway_poll_votes to authenticated;
grant usage,select on sequence public.community_giveaway_poll_options_id_seq to authenticated;

create or replace function public.community_giveaway_poll_results(p_poll_id uuid)
returns table(option_id bigint,vote_count bigint,selected boolean)
language sql stable security definer set search_path=public,pg_temp as $$
  select o.id,count(v.user_id)::bigint,
    coalesce(bool_or(v.user_id=auth.uid()),false)
  from public.community_giveaway_poll_options o
  left join public.community_giveaway_poll_votes v
    on v.option_id=o.id and v.poll_id=o.poll_id
  where o.poll_id=p_poll_id
  group by o.id,o.sort_order
  order by o.sort_order,o.id;
$$;
revoke all on function public.community_giveaway_poll_results(uuid) from public;
grant execute on function public.community_giveaway_poll_results(uuid) to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-giveaway-polls','community-giveaway-polls',true,12582912,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Giveaway poll photos are public" on storage.objects;
create policy "Giveaway poll photos are public" on storage.objects
  for select to anon,authenticated using (bucket_id='community-giveaway-polls');
drop policy if exists "Admins upload giveaway poll photos" on storage.objects;
create policy "Admins upload giveaway poll photos" on storage.objects
  for insert to authenticated with check (
    bucket_id='community-giveaway-polls'
    and (storage.foldername(name))[1]=auth.uid()::text
    and public.is_arbox_photo_admin()
  );
drop policy if exists "Admins delete giveaway poll photos" on storage.objects;
create policy "Admins delete giveaway poll photos" on storage.objects
  for delete to authenticated using (
    bucket_id='community-giveaway-polls'
    and public.is_arbox_photo_admin()
  );
