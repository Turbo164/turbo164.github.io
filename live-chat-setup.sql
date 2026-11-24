-- Run this complete script in the Supabase SQL Editor for Turbo164.
-- Safe to rerun: it creates or upgrades chat, media, reaction, and moderation objects.
create table if not exists public.community_live_chat_messages (
  id bigint generated always as identity primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table public.community_live_chat_messages add column if not exists media_path text;
alter table public.community_live_chat_messages add column if not exists media_type text;
alter table public.community_live_chat_messages alter column body set default '';
alter table public.community_live_chat_messages drop constraint if exists community_live_chat_messages_body_check;
alter table public.community_live_chat_messages drop constraint if exists community_live_chat_messages_body_valid_check;
alter table public.community_live_chat_messages add constraint community_live_chat_messages_body_valid_check
  check (char_length(btrim(body)) <= 500 and (char_length(btrim(body)) between 1 and 500 or (char_length(btrim(body)) = 0 and media_path is not null)));
alter table public.community_live_chat_messages drop constraint if exists community_live_chat_messages_media_valid_check;
alter table public.community_live_chat_messages add constraint community_live_chat_messages_media_valid_check
  check ((media_path is null and media_type is null) or (media_path is not null and media_type in ('image','video')));
alter table public.community_live_chat_messages enable row level security;

create table if not exists public.community_live_chat_settings (
  id boolean primary key default true check (id),
  chat_paused boolean not null default false,
  reactions_paused boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.community_live_chat_settings(id) values (true) on conflict (id) do nothing;
alter table public.community_live_chat_settings enable row level security;

create table if not exists public.community_live_chat_blocks (
  blocked_user_id uuid primary key references auth.users(id) on delete cascade,
  blocked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.community_live_chat_blocks enable row level security;

create table if not exists public.community_live_chat_reactions (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.community_live_chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('👍','❤️','😂','😮','🔥')),
  created_at timestamptz not null default now(),
  unique(message_id,user_id,reaction)
);
alter table public.community_live_chat_reactions enable row level security;
alter table public.community_live_chat_reactions replica identity full;

drop policy if exists "Live chat messages are public" on public.community_live_chat_messages;
create policy "Live chat messages are public" on public.community_live_chat_messages
  for select to anon,authenticated using (true);
drop policy if exists "Signed-in users send live chat messages" on public.community_live_chat_messages;
create policy "Signed-in users send live chat messages" on public.community_live_chat_messages
  for insert to authenticated with check (
    author_id=auth.uid()
    and not exists (select 1 from public.community_live_chat_blocks b where b.blocked_user_id=auth.uid())
    and not coalesce((select s.chat_paused from public.community_live_chat_settings s where s.id=true),false)
    and char_length(btrim(body)) <= 500
    and (char_length(btrim(body)) between 1 and 500 or (char_length(btrim(body))=0 and media_path is not null))
  );
drop policy if exists "Chat admins delete live chat messages" on public.community_live_chat_messages;
create policy "Chat admins delete live chat messages" on public.community_live_chat_messages
  for delete to authenticated using (public.is_arbox_photo_admin());

drop policy if exists "Live chat settings are public" on public.community_live_chat_settings;
create policy "Live chat settings are public" on public.community_live_chat_settings
  for select to anon,authenticated using (true);
drop policy if exists "Admins manage live chat settings" on public.community_live_chat_settings;
create policy "Admins manage live chat settings" on public.community_live_chat_settings
  for update to authenticated using (public.is_arbox_photo_admin()) with check (public.is_arbox_photo_admin());

drop policy if exists "Admins read live chat blocks and users read own block" on public.community_live_chat_blocks;
create policy "Admins read live chat blocks and users read own block" on public.community_live_chat_blocks
  for select to authenticated using (public.is_arbox_photo_admin() or blocked_user_id=auth.uid());
drop policy if exists "Admins add live chat blocks" on public.community_live_chat_blocks;
create policy "Admins add live chat blocks" on public.community_live_chat_blocks
  for insert to authenticated with check (public.is_arbox_photo_admin());
drop policy if exists "Admins remove live chat blocks" on public.community_live_chat_blocks;
create policy "Admins remove live chat blocks" on public.community_live_chat_blocks
  for delete to authenticated using (public.is_arbox_photo_admin());

drop policy if exists "Live chat reactions are public" on public.community_live_chat_reactions;
create policy "Live chat reactions are public" on public.community_live_chat_reactions
  for select to anon,authenticated using (true);
drop policy if exists "Signed-in users add live chat reactions" on public.community_live_chat_reactions;
create policy "Signed-in users add live chat reactions" on public.community_live_chat_reactions
  for insert to authenticated with check (
    user_id=auth.uid()
    and not exists (select 1 from public.community_live_chat_blocks b where b.blocked_user_id=auth.uid())
    and not coalesce((select s.reactions_paused from public.community_live_chat_settings s where s.id=true),false)
  );
drop policy if exists "Users remove own live chat reactions" on public.community_live_chat_reactions;
create policy "Users remove own live chat reactions" on public.community_live_chat_reactions
  for delete to authenticated using (user_id=auth.uid());

grant select on public.community_live_chat_messages,public.community_live_chat_settings,public.community_live_chat_reactions to anon,authenticated;
grant insert,delete on public.community_live_chat_messages to authenticated;
grant update on public.community_live_chat_settings to authenticated;
grant select,insert,delete on public.community_live_chat_blocks to authenticated;
grant select,insert,delete on public.community_live_chat_reactions to authenticated;
grant usage,select on sequence public.community_live_chat_messages_id_seq to authenticated;
grant usage,select on sequence public.community_live_chat_reactions_id_seq to authenticated;

create or replace function public.turbo164_limit_live_chat_rate()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.author_id::text));
  if exists(select 1 from public.community_live_chat_messages where author_id=new.author_id and created_at>now()-interval '2 seconds') then
    raise exception 'Please wait a moment before sending another message.';
  end if;
  return new;
end;
$$;
drop trigger if exists turbo164_live_chat_rate_limit on public.community_live_chat_messages;
create trigger turbo164_live_chat_rate_limit before insert on public.community_live_chat_messages
  for each row execute function public.turbo164_limit_live_chat_rate();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('community-live-chat','community-live-chat',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Live chat media is public" on storage.objects;
create policy "Live chat media is public" on storage.objects for select to anon,authenticated
  using (bucket_id='community-live-chat');
drop policy if exists "Signed-in users upload own live chat media" on storage.objects;
create policy "Signed-in users upload own live chat media" on storage.objects for insert to authenticated
  with check (
    bucket_id='community-live-chat'
    and (storage.foldername(name))[1]=auth.uid()::text
    and not exists(select 1 from public.community_live_chat_blocks b where b.blocked_user_id=auth.uid())
    and not coalesce((select s.chat_paused from public.community_live_chat_settings s where s.id=true),false)
  );
drop policy if exists "Admins delete live chat media" on storage.objects;
create policy "Admins delete live chat media" on storage.objects for delete to authenticated
  using (bucket_id='community-live-chat' and public.is_arbox_photo_admin());

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_live_chat_messages') then
    alter publication supabase_realtime add table public.community_live_chat_messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_live_chat_reactions') then
    alter publication supabase_realtime add table public.community_live_chat_reactions;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_live_chat_settings') then
    alter publication supabase_realtime add table public.community_live_chat_settings;
  end if;
end
$$;
