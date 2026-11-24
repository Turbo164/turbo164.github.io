-- Run once in the Supabase SQL Editor for Turbo164.
-- Public visitors may read the room. Signed-in community members may post.
create table if not exists public.community_live_chat_messages (
  id bigint generated always as identity primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.community_live_chat_messages enable row level security;

drop policy if exists "Live chat messages are public" on public.community_live_chat_messages;
create policy "Live chat messages are public"
  on public.community_live_chat_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "Signed-in users send live chat messages" on public.community_live_chat_messages;
create policy "Signed-in users send live chat messages"
  on public.community_live_chat_messages for insert
  to authenticated
  with check (author_id = auth.uid() and char_length(btrim(body)) between 1 and 500);

drop policy if exists "Chat admins delete live chat messages" on public.community_live_chat_messages;
create policy "Chat admins delete live chat messages"
  on public.community_live_chat_messages for delete
  to authenticated
  using (public.is_arbox_photo_admin());

grant select on public.community_live_chat_messages to anon, authenticated;
grant insert, delete on public.community_live_chat_messages to authenticated;
grant usage, select on sequence public.community_live_chat_messages_id_seq to authenticated;

create or replace function public.turbo164_limit_live_chat_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.community_live_chat_messages
    where author_id = new.author_id
      and created_at > now() - interval '2 seconds'
  ) then
    raise exception 'Please wait a moment before sending another message.';
  end if;
  return new;
end;
$$;

drop trigger if exists turbo164_live_chat_rate_limit on public.community_live_chat_messages;
create trigger turbo164_live_chat_rate_limit
  before insert on public.community_live_chat_messages
  for each row execute function public.turbo164_limit_live_chat_rate();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_live_chat_messages'
  ) then
    alter publication supabase_realtime add table public.community_live_chat_messages;
  end if;
end
$$;
