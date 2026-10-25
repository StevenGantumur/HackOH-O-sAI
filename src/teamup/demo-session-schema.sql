-- Approved Team Up room, server-timed presence, and append-only text operations.
create table public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.account_profiles(id) on delete cascade,
  participant_b uuid not null references public.account_profiles(id) on delete cascade,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  check (participant_a < participant_b), unique(participant_a,participant_b)
);
create index demo_sessions_participant_b_idx on public.demo_sessions(participant_b);
create table public.demo_presence (
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  connection_id uuid not null,
  user_id uuid not null references public.account_profiles(id) on delete cascade,
  last_seen timestamptz not null default clock_timestamp(),
  primary key(session_id,connection_id)
);
create index demo_presence_user_idx on public.demo_presence(user_id);
create table public.demo_document_events (
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  revision bigint not null,
  operation_id uuid not null,
  author_id uuid not null references public.account_profiles(id) on delete cascade,
  payload jsonb not null check(jsonb_typeof(payload)='object'),
  created_at timestamptz not null default clock_timestamp(),
  primary key(session_id,revision), unique(session_id,operation_id)
);
create index demo_document_events_author_idx on public.demo_document_events(author_id);
alter table public.demo_sessions enable row level security;
alter table public.demo_presence enable row level security;
alter table public.demo_document_events enable row level security;
revoke all on public.demo_sessions,public.demo_presence,public.demo_document_events from public,anon,authenticated;
grant select on public.demo_sessions,public.demo_presence,public.demo_document_events to authenticated;
create policy demo_session_participants on public.demo_sessions for select to authenticated
  using ((select auth.uid()) in (participant_a,participant_b));
create policy demo_presence_participants on public.demo_presence for select to authenticated
  using (session_id in (select id from public.demo_sessions));
create policy demo_events_participants on public.demo_document_events for select to authenticated
  using (session_id in (select id from public.demo_sessions));

-- Privileged writes are narrowly scoped to the authenticated participant.
-- Public wrappers remain invoker functions; the definer is not REST-exposed.
create function app_private.demo_action(
  action text, partner uuid, room uuid, connection uuid,
  after_revision bigint, operation uuid, body jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); s public.demo_sessions; existing bigint;
  events jsonb; both_active boolean; connection_active boolean;
begin
  if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null and not is_anonymous) then
    raise exception 'Sign in with a confirmed account to join a demo' using errcode='42501';
  end if;
  if connection is null then raise exception 'Missing connection' using errcode='22023'; end if;
  if action='join' then
    if partner is null or partner=actor or not exists(select 1 from public.account_directory where id=partner) then
      raise exception 'Choose another registered account' using errcode='22023';
    end if;
    insert into public.demo_sessions(participant_a,participant_b)
      values(least(actor,partner),greatest(actor,partner))
      on conflict(participant_a,participant_b) do update set participant_a=excluded.participant_a returning * into s;
  else
    select * into s from public.demo_sessions where id=room;
    if not found or actor not in (s.participant_a,s.participant_b) then
      raise exception 'Demo unavailable' using errcode='42501';
    end if;
  end if;
  if action='join' then
    insert into public.demo_presence(session_id,connection_id,user_id,last_seen) values(s.id,connection,actor,clock_timestamp())
      on conflict(session_id,connection_id) do update set last_seen=excluded.last_seen where demo_presence.user_id=actor;
    if not found then raise exception 'Connection belongs to another account' using errcode='42501'; end if;
    return jsonb_build_object('session_id',s.id);
  end if;
  if not exists(select 1 from public.demo_presence where session_id=s.id and connection_id=connection and user_id=actor) then
    raise exception 'Join this demo first' using errcode='42501';
  end if;
  if action='leave' then
    update public.demo_presence set last_seen='epoch' where session_id=s.id and connection_id=connection and user_id=actor;
    return jsonb_build_object('left',true);
  end if;
  if action='sync' then
    update public.demo_presence set last_seen=clock_timestamp() where session_id=s.id and connection_id=connection and user_id=actor;
  elsif action <> 'write' then
    raise exception 'Invalid demo operation' using errcode='22023';
  end if;
  -- Lock before checking write eligibility, including time spent waiting on peers.
  if action='write' then select * into s from public.demo_sessions where id=s.id for update; end if;
  select count(distinct user_id)=2 into both_active from public.demo_presence
    where session_id=s.id and user_id in(s.participant_a,s.participant_b) and last_seen>clock_timestamp()-interval '20 seconds';
  select exists(select 1 from public.demo_presence where session_id=s.id and connection_id=connection and user_id=actor
    and last_seen>clock_timestamp()-interval '20 seconds') into connection_active;
  if action='write' then
    -- Serialize room revisions so polling cannot skip a transaction committed late.
    select revision into existing from public.demo_document_events where session_id=s.id and operation_id=operation;
    if found then return jsonb_build_object('revision',existing); end if;
    if not both_active or not connection_active then raise exception 'Both participants must be active to edit' using errcode='42501'; end if;
    if operation is null or body is null or jsonb_typeof(body)<>'object' or octet_length(body::text)>2000000
      or coalesce(body->>'kind','') not in ('edit','problem') then
      raise exception 'Invalid document edit' using errcode='22023';
    end if;
    if body->>'kind'='edit' and (jsonb_typeof(body->'patch'->'nodes') is distinct from 'array'
      or jsonb_typeof(body->'patch'->'deleted') is distinct from 'array') then
      raise exception 'Invalid text patch' using errcode='22023';
    end if;
    if body->>'kind'='problem' and coalesce(body->'problem'->>'id','') not in ('phone-words','word-guesses','arithmetic-checks') then
      raise exception 'Unknown practice problem' using errcode='22023';
    end if;
    update public.demo_sessions set revision=revision+1 where id=s.id returning revision into existing;
    insert into public.demo_document_events(session_id,revision,operation_id,author_id,payload) values(s.id,existing,operation,actor,body);
    return jsonb_build_object('revision',existing);
  end if;
  if after_revision is null or after_revision<0 then raise exception 'Invalid document cursor' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(e) order by e.revision),'[]'::jsonb) into events
    from (select revision,operation_id,payload from public.demo_document_events where session_id=s.id and revision>after_revision order by revision limit 100) e;
  return jsonb_build_object('session_id',s.id,'both_active',both_active,'events',events);
end;
$$;
revoke all on function app_private.demo_action(text,uuid,uuid,uuid,bigint,uuid,jsonb) from public,anon;
grant execute on function app_private.demo_action(text,uuid,uuid,uuid,bigint,uuid,jsonb) to authenticated;

create function public.join_demo(partner_id uuid, connection_id uuid) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.demo_action('join',partner_id,null,connection_id,0,null,null);
$$;
create function public.sync_demo(session_id uuid, connection_id uuid, after_revision bigint default 0) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.demo_action('sync',null,session_id,connection_id,after_revision,null,null);
$$;
create function public.write_demo_event(session_id uuid, connection_id uuid, operation_id uuid, payload jsonb) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.demo_action('write',null,session_id,connection_id,0,operation_id,payload);
$$;
create function public.leave_demo(session_id uuid, connection_id uuid) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.demo_action('leave',null,session_id,connection_id,0,null,null);
$$;
revoke all on function public.join_demo(uuid,uuid),public.sync_demo(uuid,uuid,bigint),public.write_demo_event(uuid,uuid,uuid,jsonb),public.leave_demo(uuid,uuid) from public,anon;
grant execute on function public.join_demo(uuid,uuid),public.sync_demo(uuid,uuid,bigint),public.write_demo_event(uuid,uuid,uuid,jsonb),public.leave_demo(uuid,uuid) to authenticated;
