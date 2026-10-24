-- Team-approved direct messaging, isolated from project-channel messages.
create table public.teamup_accounts (
  id uuid primary key references auth.users(id),
  demo_user_id text not null unique check (demo_user_id ~ '^u-[a-z0-9-]+$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.teamup_accounts enable row level security;
revoke all on public.teamup_accounts from anon, authenticated;
grant select on public.teamup_accounts to authenticated;
grant insert (id, demo_user_id, display_name) on public.teamup_accounts to authenticated;
create policy "Authenticated users can see sample messaging names"
  on public.teamup_accounts for select to authenticated using (true);
create policy "Users can link only their own account"
  on public.teamup_accounts for insert to authenticated
  with check ((select auth.uid()) = id);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.teamup_accounts(id),
  recipient_id uuid not null references public.teamup_accounts(id),
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint distinct_message_participants check (author_id <> recipient_id)
);
create index direct_messages_author_time on public.direct_messages(author_id, created_at desc, id);
create index direct_messages_recipient_time on public.direct_messages(recipient_id, created_at desc, id);
alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from anon, authenticated;
grant select on public.direct_messages to authenticated;
grant insert (author_id, recipient_id, content) on public.direct_messages to authenticated;
create policy "Only message participants can read"
  on public.direct_messages for select to authenticated
  using ((select auth.uid()) = author_id or (select auth.uid()) = recipient_id);
create policy "Only the authenticated author can send"
  on public.direct_messages for insert to authenticated
  with check ((select auth.uid()) = author_id and author_id <> recipient_id);
