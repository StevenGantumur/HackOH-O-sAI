-- Real account identities coexist with the fictional seed cast. Private email stays separate.
create table public.account_directory (
  id uuid primary key references public.account_profiles(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,23}$'),
  major text not null default '' check (char_length(major) <= 120),
  skills text[] not null default '{}' check (cardinality(skills) <= 20),
  goals text[] not null default '{}' check (cardinality(goals) <= 12),
  created_at timestamptz not null default now()
);
alter table public.account_directory enable row level security;
revoke all on public.account_directory from anon, authenticated;
grant select on public.account_directory to authenticated;
grant update (major, skills, goals) on public.account_directory to authenticated;
create policy "Signed-in users can find account usernames"
  on public.account_directory for select to authenticated using (true);
create policy "Only the owner can edit public profile details"
  on public.account_directory for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create function app_private.sync_account_directory()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.username is null then
    if exists (select 1 from public.account_directory where id = new.id) then
      raise exception 'A completed account needs a username';
    end if;
    return new;
  end if;
  insert into public.account_directory(id, username) values (new.id, new.username)
  on conflict (id) do update set username = excluded.username;
  return new;
end;
$$;
revoke all on function app_private.sync_account_directory() from public, anon, authenticated;
create trigger sync_account_directory_after_profile_change
  after insert or update of username on public.account_profiles
  for each row execute function app_private.sync_account_directory();

insert into public.account_directory(id, username)
select id, username from public.account_profiles where username is not null;

-- Keep every existing message and its participant UUIDs. Only the referenced profile changes.
alter table public.direct_messages drop constraint direct_messages_author_id_fkey;
alter table public.direct_messages drop constraint direct_messages_recipient_id_fkey;
alter table public.direct_messages add constraint direct_messages_author_id_fkey
  foreign key (author_id) references public.account_profiles(id);
alter table public.direct_messages add constraint direct_messages_recipient_id_fkey
  foreign key (recipient_id) references public.account_profiles(id);

-- No new sample-persona claims. Retain the legacy table and its rows for compatibility/history.
revoke insert (id, demo_user_id, display_name) on public.teamup_accounts from authenticated;
