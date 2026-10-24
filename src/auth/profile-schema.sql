-- Account credentials belong to Supabase Auth. No password or password hash is stored here.
create table public.account_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z][a-z0-9_]{2,23}$'),
  email text not null
);
alter table public.account_profiles enable row level security;
revoke all on public.account_profiles from anon, authenticated;
grant select on public.account_profiles to authenticated;
grant update (username) on public.account_profiles to authenticated;
create policy "Read your own account profile"
  on public.account_profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Update your own username"
  on public.account_profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create schema app_private;
revoke all on schema app_private from public, anon, authenticated;
create function app_private.sync_account_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.account_profiles(id, email, username)
    values (new.id, coalesce(new.email, ''), nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), ''));
  else
    update public.account_profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function app_private.sync_account_profile() from public, anon, authenticated;
create trigger sync_account_profile_after_auth_change
  after insert or update of email on auth.users
  for each row execute function app_private.sync_account_profile();

-- Existing accounts choose a username on their next sign-in; no fake names are invented.
insert into public.account_profiles(id, email)
select id, coalesce(email, '') from auth.users;
