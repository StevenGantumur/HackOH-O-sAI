-- Narrow, transactional self-join operations. No caller-supplied user IDs or leader roles.
create function app_private.join_project_as_self(target_project uuid, chosen_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); p public.projects; m public.project_memberships;
begin
  if actor is null then raise exception 'Sign in to join a project' using errcode='42501'; end if;
  if chosen_role not in ('RESEARCHER','DESIGNER','BUILDER','ANALYST','COMMUNICATIONS') or chosen_role is null then
    raise exception 'Choose a working role, not leader or mentor' using errcode='22023';
  end if;
  select * into p from public.projects where id=target_project for update;
  if not found then raise exception 'Project is unavailable' using errcode='42501'; end if;
  if p.owner_id=actor then
    return jsonb_build_object('project_id',p.id,'user_id',actor,'role','LEADER','joined_at',p.created_at);
  end if;
  select * into m from public.project_memberships where project_id=p.id and user_id=actor;
  if found then return to_jsonb(m); end if;
  if p.visibility <> 'public' or p.status <> 'active' then
    raise exception 'This project is not open for joining' using errcode='42501';
  end if;
  insert into public.project_memberships(project_id,user_id,role) values(p.id,actor,chosen_role) returning * into m;
  return to_jsonb(m);
end;
$$;
revoke all on function app_private.join_project_as_self(uuid,text) from public, anon;
grant execute on function app_private.join_project_as_self(uuid,text) to authenticated;
create function public.join_project(project_id uuid, role text)
returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.join_project_as_self(project_id,role);
$$;
revoke all on function public.join_project(uuid,text) from public, anon;
grant execute on function public.join_project(uuid,text) to authenticated;

create function app_private.join_mission_as_self(target_task uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); t public.tasks; p public.projects;
        membership jsonb; contributor jsonb; was_member boolean; already_joined boolean;
begin
  if actor is null then raise exception 'Sign in to join a mission' using errcode='42501'; end if;
  select * into t from public.tasks where id=target_task;
  if not found then raise exception 'Mission is unavailable' using errcode='42501'; end if;
  -- All join operations lock the parent first, then the task: consistent lock order.
  select * into p from public.projects where id=t.project_id for update;
  select * into t from public.tasks where id=target_task for update;
  if t.estimated_minutes is null then raise exception 'This task is not a mission' using errcode='22023'; end if;
  was_member := p.owner_id=actor or exists(select 1 from public.project_memberships where project_id=p.id and user_id=actor);
  if not was_member and (p.visibility <> 'public' or p.status <> 'active') then
    raise exception 'This mission is not open for joining' using errcode='42501';
  end if;
  if exists(select 1 from public.project_memberships where project_id=p.id and user_id=actor and role='MENTOR') then
    raise exception 'Mentors review missions and cannot join as contributors' using errcode='42501';
  end if;
  already_joined := t.leader_id=actor or exists(select 1 from public.task_contributors where task_id=t.id and user_id=actor);
  if not already_joined and (p.status <> 'active' or t.status not in ('todo','in_progress')) then
    raise exception 'This mission is no longer accepting contributors' using errcode='23514';
  end if;
  membership := app_private.join_project_as_self(p.id,t.role);
  if t.leader_id=actor then
    contributor := jsonb_build_object('task_id',t.id,'user_id',actor,'role','LEADER','joined_at',t.created_at);
  else
    insert into public.task_contributors(task_id,user_id,role) values(t.id,actor,t.role)
    on conflict(task_id,user_id) do nothing;
    select to_jsonb(c) into contributor from public.task_contributors c where task_id=t.id and user_id=actor;
  end if;
  if not already_joined and t.owner_id is null then
    update public.tasks set owner_id=actor,status='in_progress',claimed_at=now() where id=t.id returning * into t;
  end if;
  return jsonb_build_object('task',to_jsonb(t),'membership',membership,'contributor',contributor,
    'joined',case when was_member then null else membership end,'already_joined',already_joined);
end;
$$;
revoke all on function app_private.join_mission_as_self(uuid) from public, anon;
grant execute on function app_private.join_mission_as_self(uuid) to authenticated;
create function public.join_mission(task_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.join_mission_as_self(task_id);
$$;
revoke all on function public.join_mission(uuid) from public, anon;
grant execute on function public.join_mission(uuid) to authenticated;
