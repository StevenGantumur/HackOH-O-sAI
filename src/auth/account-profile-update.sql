-- Atomic username + major edit. Invoker security keeps both existing RLS policies active.
create function public.update_my_account_profile(new_username text, new_major text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in first'; end if;
  update public.account_profiles set username = lower(btrim(new_username)) where id = (select auth.uid());
  if not found then raise exception 'Account profile not found'; end if;
  update public.account_directory set major = btrim(coalesce(new_major, '')) where id = (select auth.uid());
  if not found then raise exception 'Account directory entry not found'; end if;
end;
$$;
revoke all on function public.update_my_account_profile(text, text) from public, anon;
grant execute on function public.update_my_account_profile(text, text) to authenticated;
