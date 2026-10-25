-- Administrator-run integration test. Fixtures and all writes roll back.
begin;
create temporary table demo_fixture as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() outsider,
 gen_random_uuid() ca,gen_random_uuid() ca2,gen_random_uuid() cb,gen_random_uuid() op,null::uuid room;
grant select,update on demo_fixture to authenticated;
insert into auth.users(id,aud,role,email,email_confirmed_at,is_anonymous,raw_user_meta_data)
 select a,'authenticated','authenticated','demo-a@example.invalid',now(),false,jsonb_build_object('username','demo_a_'||substr(a::text,1,8)) from demo_fixture
 union all select b,'authenticated','authenticated','demo-b@example.invalid',now(),false,jsonb_build_object('username','demo_b_'||substr(b::text,1,8)) from demo_fixture
 union all select outsider,'authenticated','authenticated','demo-c@example.invalid',now(),false,jsonb_build_object('username','demo_c_'||substr(outsider::text,1,8)) from demo_fixture;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from demo_fixture),true);
update demo_fixture set room=(public.join_demo(b,ca)->>'session_id')::uuid;
do $$ declare f record; state jsonb; begin
 select * into f from demo_fixture;
 perform public.join_demo(f.b,f.ca2);
 state:=public.sync_demo(f.room,f.ca,0);
 if (state->>'both_active')::boolean then raise exception 'Two tabs of one account counted as two users'; end if;
 begin
  perform public.write_demo_event(f.room,f.ca,f.op,'{"kind":"edit","patch":{"nodes":[],"deleted":[]}}');
  raise exception 'Write allowed with missing partner';
 exception when insufficient_privilege then null; end;
 begin
  update public.demo_presence set user_id=f.b where session_id=f.room;
  raise exception 'Presence identity was editable';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from demo_fixture),true);
do $$ declare f record; joined jsonb; state jsonb; begin
 select * into f from demo_fixture;
 joined:=public.join_demo(f.a,f.cb);
 if (joined->>'session_id')::uuid<>f.room then raise exception 'Participants did not join same room'; end if;
 state:=public.sync_demo(f.room,f.cb,0);
 if not (state->>'both_active')::boolean then raise exception 'Both joined users were not active'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select a::text from demo_fixture),true);
do $$ declare f record; receipt jsonb; begin
 select * into f from demo_fixture;
 receipt:=public.write_demo_event(f.room,f.ca,f.op,'{"kind":"edit","patch":{"nodes":[{"id":"1:test","clock":1,"after":"","value":"A"}],"deleted":[]}}');
 if (receipt->>'revision')::int<>1 then raise exception 'First revision incorrect'; end if;
 perform public.write_demo_event(f.room,f.ca,f.op,'{"kind":"edit","patch":{"nodes":[],"deleted":[]}}');
 if (select count(*) from public.demo_document_events where session_id=f.room)<>1 then raise exception 'Retried operation duplicated'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from demo_fixture),true);
do $$ declare f record; state jsonb; begin
 select * into f from demo_fixture;
 state:=public.sync_demo(f.room,f.cb,0);
 if jsonb_array_length(state->'events')<>1 then raise exception 'Partner did not receive edit'; end if;
 state:=public.sync_demo(f.room,f.cb,1);
 if jsonb_array_length(state->'events')<>0 then raise exception 'Cursor replayed confirmed edit'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select outsider::text from demo_fixture),true);
do $$ declare f record; begin
 select * into f from demo_fixture;
 if exists(select 1 from public.demo_sessions where id=f.room) or exists(select 1 from public.demo_document_events where session_id=f.room) then raise exception 'Outsider read private demo'; end if;
 begin
  perform public.sync_demo(f.room,gen_random_uuid(),0);
  raise exception 'Outsider accessed room RPC';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.demo_presence set last_seen=clock_timestamp()-interval '30 seconds' where user_id=(select b from demo_fixture);
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from demo_fixture),true);
do $$ declare f record; state jsonb; begin
 select * into f from demo_fixture;
 state:=public.sync_demo(f.room,f.ca,1);
 if (state->>'both_active')::boolean then raise exception 'Expired partner counted active'; end if;
 begin
  perform public.write_demo_event(f.room,f.ca,gen_random_uuid(),'{"kind":"problem","problem":{"id":"phone-words","clock":1,"replica":"test"}}');
  raise exception 'Editing allowed after partner expired';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from demo_fixture),true);
do $$ declare f record; state jsonb; begin
 select * into f from demo_fixture;
 state:=public.sync_demo(f.room,f.cb,0);
 if not (state->>'both_active')::boolean or jsonb_array_length(state->'events')<>1 then raise exception 'Reconnect failed to recover state'; end if;
 perform public.leave_demo(f.room,f.cb);
end $$;
select set_config('request.jwt.claim.sub',(select a::text from demo_fixture),true);
do $$ declare f record; state jsonb; begin
 select * into f from demo_fixture;
 state:=public.sync_demo(f.room,f.ca,0);
 if (state->>'both_active')::boolean then raise exception 'Departed partner counted active'; end if;
 if has_function_privilege('anon','public.join_demo(uuid,uuid)','execute') then raise exception 'Anonymous demo access'; end if;
end $$;
reset role;
rollback;
select 'demo integration checks passed; fixtures rolled back' as result;
