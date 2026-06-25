begin;

create temp table bb1_results(check_name text, passed boolean, detail text) on commit drop;
grant insert, select on bb1_results to authenticated, anon;

set local role anon;

do $$
begin
  begin
    perform count(*) from public.blood_donor_profiles;
    insert into bb1_results values ('anon_cannot_read_donors', false, 'unexpected read');
  exception when others then
    insert into bb1_results values ('anon_cannot_read_donors', true, sqlstate);
  end;

  begin
    insert into public.blood_requests (blood_group, units_requested, hospital_name, needed_at)
    values ('A+', 1, 'Denied Hospital', now());
    insert into bb1_results values ('anon_cannot_insert_request', false, 'unexpected insert');
  exception when others then
    insert into bb1_results values ('anon_cannot_insert_request', true, sqlstate);
  end;

  begin
    perform public.review_blood_request(gen_random_uuid(), 'approved', null);
    insert into bb1_results values ('anon_cannot_execute_internal_rpc', false, 'unexpected rpc');
  exception when others then
    insert into bb1_results values ('anon_cannot_execute_internal_rpc', true, sqlstate);
  end;
end;
$$;

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.email = 'ordinary@example.invalid';

do $$
declare
  v_visible_count integer;
begin
  begin
    select count(*) into v_visible_count from public.blood_requests;
    insert into bb1_results values ('ordinary_user_cannot_browse_requests', v_visible_count = 0, v_visible_count::text);
  exception when others then
    insert into bb1_results values ('ordinary_user_cannot_browse_requests', true, sqlstate);
  end;

  begin
    perform public.create_blood_match(gen_random_uuid(), gen_random_uuid(), 'denied');
    insert into bb1_results values ('ordinary_user_cannot_create_match', false, 'unexpected rpc');
  exception when others then
    insert into bb1_results values ('ordinary_user_cannot_create_match', true, sqlstate);
  end;

  begin
    perform public.get_authorized_blood_match_contacts(gen_random_uuid());
    insert into bb1_results values ('ordinary_user_cannot_read_contacts', false, 'unexpected rpc');
  exception when others then
    insert into bb1_results values ('ordinary_user_cannot_read_contacts', true, sqlstate);
  end;
end;
$$;

reset role;

insert into bb1_results
select 'anon_has_no_blood_table_grants', count(*) = 0, count(*)::text
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'blood_%'
  and grantee = 'anon';

insert into bb1_results
select 'authenticated_has_no_blood_writes', count(*) = 0, count(*)::text
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'blood_%'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

insert into bb1_results
select 'public_intake_disabled', count(*) = 2, count(*)::text
from public.blood_support_settings
where setting_key in ('public_request_intake_enabled', 'public_donor_interest_enabled')
  and setting_value = 'false'::jsonb
  and is_active = true;

select * from bb1_results order by check_name;

rollback;
