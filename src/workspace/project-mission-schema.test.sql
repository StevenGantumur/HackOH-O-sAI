-- Run as the Supabase SQL administrator. Every fixture and test write is rolled back.
begin;
create temporary table project_fixture as
select gen_random_uuid() a, gen_random_uuid() b, gen_random_uuid() c, gen_random_uuid() d, gen_random_uuid() e,
       null::uuid project_id, null::uuid public_project_id, null::uuid mission_id;
grant select, update on project_fixture to authenticated;
insert into auth.users(id,aud,role,email,raw_user_meta_data)
select a,'authenticated','authenticated','schema-a@example.invalid',jsonb_build_object('username','schema_a_' || substr(a::text,1,8)) from project_fixture
union all select b,'authenticated','authenticated','schema-b@example.invalid',jsonb_build_object('username','schema_b_' || substr(b::text,1,8)) from project_fixture
union all select c,'authenticated','authenticated','schema-c@example.invalid',jsonb_build_object('username','schema_c_' || substr(c::text,1,8)) from project_fixture
union all select d,'authenticated','authenticated','schema-d@example.invalid',jsonb_build_object('username','schema_d_' || substr(d::text,1,8)) from project_fixture
union all select e,'authenticated','authenticated','schema-e@example.invalid',jsonb_build_object('username','schema_e_' || substr(e::text,1,8)) from project_fixture;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from project_fixture),true);
with created as (
 insert into public.projects(title,description,visibility,needed_roles,needed_skills)
 values('Scheduling tool','A fictional nonprofit needs volunteer scheduling.','private',array['BUILDER','ANALYST'],array['JavaScript']) returning id
) update project_fixture set project_id=(select id from created);
with created as (
 insert into public.projects(title,description) values('Public sample','Visible to signed-in users.') returning id
) update project_fixture set public_project_id=(select id from created);
insert into public.project_memberships(project_id,user_id,role)
select project_id,b,'BUILDER' from project_fixture union all select project_id,c,'ANALYST' from project_fixture union all select project_id,e,'DESIGNER' from project_fixture;
with created as (
 insert into public.tasks(project_id,leader_id,owner_id,title,description,role,estimated_minutes,difficulty,deliverable_instructions,review_criteria)
 select project_id,b,c,'Resolve overlapping shifts','Find staffing conflicts and propose a fix.','ANALYST',30,'beginner','Submit a schedule and short explanation.',array['No double bookings','Explain assumptions'] from project_fixture returning id
) update project_fixture set mission_id=(select id from created);
insert into public.tasks(project_id,title,role) select project_id,'Regular project task','BUILDER' from project_fixture;
do $$ declare rejected boolean; begin
 if (select count(*) from public.project_team where project_id=(select project_id from project_fixture) and role='LEADER') <> 1 then raise exception 'Project leader count failed'; end if;
 if (select count(*) from public.missions where project_id=(select project_id from project_fixture)) <> 1 then raise exception 'Mission/task separation failed'; end if;
 if not exists(select 1 from public.task_contributors where task_id=(select mission_id from project_fixture) and user_id=(select c from project_fixture)) then raise exception 'Claimed owner missing from team'; end if;
 begin
  insert into public.project_memberships(project_id,user_id,role) select project_id,d,'LEADER' from project_fixture;
  raise exception 'Second project leader was allowed';
 exception when check_violation then null; end;
 rejected:=false;
 begin
  insert into public.tasks(project_id,leader_id,title,role) select project_id,d,'Outside leader','BUILDER' from project_fixture;
 exception when raise_exception then rejected:=true; end;
 if not rejected then raise exception 'Mission leader outside project was allowed'; end if;
 begin
  insert into public.tasks(project_id,title,role,estimated_minutes,difficulty) select project_id,'Missing deliverable','BUILDER',30,'beginner' from project_fixture;
  raise exception 'Mission without deliverable was allowed';
 exception when check_violation then null; end;
 begin
  update public.tasks set status='done' where id=(select mission_id from project_fixture);
  raise exception 'Unreviewed completion was allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from project_fixture),true);
insert into public.task_contributors(task_id,user_id,role) select mission_id,a,'RESEARCHER' from project_fixture;
do $$ begin
 if (select count(*) from public.mission_team where task_id=(select mission_id from project_fixture)) <> 3 then raise exception 'Collaborative mission team failed'; end if;
 if (select count(*) from public.mission_team where task_id=(select mission_id from project_fixture) and role='LEADER') <> 1 then raise exception 'Mission leader count failed'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select c::text from project_fixture),true);
do $$ begin
 begin
  insert into public.task_contributors(task_id,user_id,role) select mission_id,e,'DESIGNER' from project_fixture;
  raise exception 'Ordinary member managed mission team';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select d::text from project_fixture),true);
do $$ begin
 if exists(select 1 from public.projects where id=(select project_id from project_fixture)) then raise exception 'Private project leak'; end if;
 if exists(select 1 from public.missions where id=(select mission_id from project_fixture)) then raise exception 'Private mission leak'; end if;
 if not exists(select 1 from public.projects where id=(select public_project_id from project_fixture)) then raise exception 'Public discovery failed'; end if;
 begin
  insert into public.project_memberships(project_id,user_id,role) select project_id,d,'BUILDER' from project_fixture;
  raise exception 'Outsider self-joined private project';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform id from public.projects;
  raise exception 'Anonymous project access was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: projects, multi-person missions, exactly one leader, parent-project membership, public/private visibility, role permissions, and protected completion; all fixtures rolled back' as verification;
