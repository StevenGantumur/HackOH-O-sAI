-- Projects and collaborative missions. Account identity comes from account_profiles.
-- Leaders are canonical scalar fields; team views include them without duplicate membership rows.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.account_profiles(id),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 20000),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  needed_roles text[] not null default '{}' check (needed_roles <@ array['RESEARCHER','DESIGNER','BUILDER','ANALYST','COMMUNICATIONS','MENTOR']::text[]),
  needed_skills text[] not null default '{}' check (cardinality(needed_skills) <= 30),
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  starts_at timestamptz,
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or deadline is null or starts_at <= deadline)
);
create index projects_owner_idx on public.projects(owner_id);
create index projects_discovery_idx on public.projects(visibility, status, created_at desc);

create table public.project_memberships (
  project_id uuid not null references public.projects(id),
  user_id uuid not null references public.account_profiles(id),
  role text not null check (role in ('RESEARCHER','DESIGNER','BUILDER','ANALYST','COMMUNICATIONS','MENTOR')),
  joined_at timestamptz not null default now(),
  primary key(project_id, user_id)
);
create index project_memberships_user_idx on public.project_memberships(user_id, project_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  leader_id uuid not null default auth.uid() references public.account_profiles(id),
  owner_id uuid references public.account_profiles(id),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 20000),
  role text not null check (role in ('RESEARCHER','DESIGNER','BUILDER','ANALYST','COMMUNICATIONS')),
  deadline timestamptz,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  estimated_minutes integer check (estimated_minutes between 5 and 480),
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  required_skills text[] not null default '{}' check (cardinality(required_skills) <= 8),
  deliverable_instructions text check (char_length(deliverable_instructions) <= 10000),
  review_criteria text[] not null default '{}' check (cardinality(review_criteria) <= 6),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (estimated_minutes is null or (difficulty is not null and coalesce(char_length(btrim(deliverable_instructions)), 0) > 0)),
  check (claimed_at is null or owner_id is not null)
);
create index tasks_project_status_idx on public.tasks(project_id, status, deadline);
create index tasks_leader_idx on public.tasks(leader_id);
create index tasks_owner_idx on public.tasks(owner_id);
create index tasks_mission_discovery_idx on public.tasks(estimated_minutes, difficulty) where estimated_minutes is not null;

create table public.task_contributors (
  task_id uuid not null references public.tasks(id),
  user_id uuid not null references public.account_profiles(id),
  role text not null check (role in ('RESEARCHER','DESIGNER','BUILDER','ANALYST','COMMUNICATIONS')),
  joined_at timestamptz not null default now(),
  primary key(task_id, user_id)
);
create index task_contributors_user_idx on public.task_contributors(user_id, task_id);

-- Private helpers avoid recursive membership policies. They only inspect the calling user's access.
create function app_private.is_project_leader(project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.projects where id = project and owner_id = (select auth.uid())
  );
$$;
create function app_private.is_project_member(project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    exists(select 1 from public.projects where id = project and owner_id = (select auth.uid()))
    or exists(select 1 from public.project_memberships where project_id = project and user_id = (select auth.uid()))
  );
$$;
create function app_private.can_view_project(project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.projects p where p.id = project and (
      p.owner_id = (select auth.uid())
      or (p.visibility = 'public' and p.status <> 'draft')
      or exists(select 1 from public.project_memberships m where m.project_id = p.id and m.user_id = (select auth.uid()))
    )
  );
$$;
create function app_private.can_manage_task(task uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task and ((select auth.uid()) = p.owner_id or (select auth.uid()) = t.leader_id)
  );
$$;
revoke all on function app_private.is_project_leader(uuid), app_private.is_project_member(uuid), app_private.can_view_project(uuid), app_private.can_manage_task(uuid) from public, anon;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_project_leader(uuid), app_private.is_project_member(uuid), app_private.can_view_project(uuid), app_private.can_manage_task(uuid) to authenticated;

-- Structural integrity checks also run for privileged writes, not just browser requests.
create function app_private.validate_project_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.projects where id = new.project_id and owner_id = new.user_id) then
    raise exception 'The project leader is already an implicit member';
  end if;
  return new;
end;
$$;
create trigger validate_project_membership before insert or update on public.project_memberships
  for each row execute function app_private.validate_project_membership();

create function app_private.validate_task_team()
returns trigger language plpgsql security definer set search_path = '' as $$
declare project uuid; participant uuid; task_leader uuid;
begin
  if TG_TABLE_NAME = 'tasks' then
    project := new.project_id;
    task_leader := new.leader_id;
    if not exists(select 1 from public.projects where id = project and owner_id = task_leader)
       and not exists(select 1 from public.project_memberships where project_id = project and user_id = task_leader and role <> 'MENTOR') then
      raise exception 'The mission leader must be a working member of its project';
    end if;
    participant := new.owner_id;
  else
    select t.project_id into project from public.tasks t where t.id = new.task_id;
    participant := new.user_id;
  end if;
  if participant is not null and
     not exists(select 1 from public.projects where id = project and owner_id = participant) and
     not exists(select 1 from public.project_memberships where project_id = project and user_id = participant and role <> 'MENTOR') then
    raise exception 'Contributors must be working members of the same project';
  end if;
  return new;
end;
$$;
create trigger validate_task_team before insert or update on public.tasks
  for each row execute function app_private.validate_task_team();
create trigger validate_task_contributor before insert or update on public.task_contributors
  for each row execute function app_private.validate_task_team();

create function app_private.touch_project_task()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger touch_project before update on public.projects for each row execute function app_private.touch_project_task();
create trigger touch_task before update on public.tasks for each row execute function app_private.touch_project_task();

-- A claimed owner is also a contributor. The leader is included by the team view.
create function app_private.include_task_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null and new.owner_id <> new.leader_id then
    insert into public.task_contributors(task_id, user_id, role) values(new.id, new.owner_id, new.role)
    on conflict(task_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger include_task_owner after insert or update of owner_id, leader_id on public.tasks
  for each row execute function app_private.include_task_owner();
revoke all on function app_private.validate_project_membership(), app_private.validate_task_team(), app_private.touch_project_task(), app_private.include_task_owner() from public, anon, authenticated;

alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.tasks enable row level security;
alter table public.task_contributors enable row level security;
revoke all on public.projects, public.project_memberships, public.tasks, public.task_contributors from anon, authenticated;
grant select on public.projects, public.project_memberships, public.tasks, public.task_contributors to authenticated;
grant insert (title, description, tags, needed_roles, needed_skills, status, visibility, starts_at, deadline) on public.projects to authenticated;
grant update (title, description, tags, needed_roles, needed_skills, status, visibility, starts_at, deadline) on public.projects to authenticated;
grant insert (project_id, user_id, role) on public.project_memberships to authenticated;
grant insert (project_id, leader_id, owner_id, title, description, role, deadline, estimated_minutes, difficulty, required_skills, deliverable_instructions, review_criteria) on public.tasks to authenticated;
grant update (leader_id, title, description, role, deadline, estimated_minutes, difficulty, required_skills, deliverable_instructions, review_criteria) on public.tasks to authenticated;
grant insert (task_id, user_id, role) on public.task_contributors to authenticated;

create policy "Discover visible projects" on public.projects for select to authenticated
  using (owner_id = (select auth.uid()) or app_private.can_view_project(id));
create policy "Create projects as yourself" on public.projects for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Only the project leader edits project details" on public.projects for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "View visible project teams" on public.project_memberships for select to authenticated using (app_private.can_view_project(project_id));
create policy "Project leader adds members" on public.project_memberships for insert to authenticated with check (app_private.is_project_leader(project_id));
create policy "View visible project tasks" on public.tasks for select to authenticated using (app_private.can_view_project(project_id));
create policy "Project leader creates tasks" on public.tasks for insert to authenticated with check (app_private.is_project_leader(project_id));
create policy "Project leader edits task details" on public.tasks for update to authenticated
  using (app_private.is_project_leader(project_id)) with check (app_private.is_project_leader(project_id));
create policy "View visible task teams" on public.task_contributors for select to authenticated
  using (exists(select 1 from public.tasks t where t.id = task_id and app_private.can_view_project(t.project_id)));
create policy "Project or mission leader adds contributors" on public.task_contributors for insert to authenticated
  with check (app_private.can_manage_task(task_id));

create view public.missions with (security_invoker = true) as
  select * from public.tasks where estimated_minutes is not null;
create view public.project_team with (security_invoker = true) as
  select id as project_id, owner_id as user_id, 'LEADER'::text as role, created_at as joined_at from public.projects
  union all
  select m.project_id, m.user_id, m.role, m.joined_at from public.project_memberships m
  join public.projects p on p.id = m.project_id where m.user_id <> p.owner_id;
create view public.mission_team with (security_invoker = true) as
  select id as task_id, leader_id as user_id, 'LEADER'::text as role, created_at as joined_at from public.missions
  union all
  select c.task_id, c.user_id, c.role, c.joined_at from public.task_contributors c
  join public.missions m on m.id = c.task_id where c.user_id <> m.leader_id;
revoke all on public.missions, public.project_team, public.mission_team from anon, authenticated;
grant select on public.missions, public.project_team, public.mission_team to authenticated;
