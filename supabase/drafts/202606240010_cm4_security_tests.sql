begin;

create temp table cm4_results(check_name text, passed boolean, detail text) on commit drop;
grant insert, select on cm4_results to authenticated, anon;

set local role anon;

do $$
begin
  begin
    perform count(*) from public.system_permissions;
    insert into cm4_results values ('anon_cannot_read_permissions', false, 'unexpected read');
  exception when others then
    insert into cm4_results values ('anon_cannot_read_permissions', true, sqlstate);
  end;

  begin
    perform public.create_approval_request('members.suspend', 'volunteer_profile', gen_random_uuid(), 'global', null, null, '{}'::jsonb, 'Denied');
    insert into cm4_results values ('anon_cannot_create_approval_request', false, 'unexpected rpc');
  exception when others then
    insert into cm4_results values ('anon_cannot_create_approval_request', true, sqlstate);
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
  select count(*) into v_visible_count from public.approval_requests;
  insert into cm4_results values ('ordinary_user_cannot_browse_approval_requests', v_visible_count = 0, v_visible_count::text);

  begin
    perform public.grant_temporary_access(gen_random_uuid(), 'events.view_internal', 'allow', 'global', null, null, null, null, now(), now() + interval '1 day', 'Denied');
    insert into cm4_results values ('ordinary_user_cannot_grant_temporary_access', false, 'unexpected grant');
  exception when others then
    insert into cm4_results values ('ordinary_user_cannot_grant_temporary_access', true, sqlstate);
  end;

  begin
    perform public.review_approval_request(gen_random_uuid(), 'approved', 'Denied');
    insert into cm4_results values ('ordinary_user_cannot_review_approval_request', false, 'unexpected review');
  exception when others then
    insert into cm4_results values ('ordinary_user_cannot_review_approval_request', true, sqlstate);
  end;
end;
$$;

reset role;

insert into cm4_results
select 'duplicate_head_constraint_exists', count(*) = 1, count(*)::text
from pg_indexes
where schemaname = 'public'
  and indexname = 'volunteer_department_memberships_one_active_head_idx';

insert into cm4_results
select 'duplicate_deputy_constraint_exists', count(*) = 1, count(*)::text
from pg_indexes
where schemaname = 'public'
  and indexname = 'volunteer_department_memberships_one_active_deputy_idx';

insert into cm4_results
select 'anon_has_no_internal_grants', count(*) = 0, count(*)::text
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('system_permissions', 'user_permission_overrides', 'approval_requests', 'staff_invitations')
  and grantee = 'anon';

insert into cm4_results
select 'authenticated_has_no_internal_writes', count(*) = 0, count(*)::text
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('system_permissions', 'user_permission_overrides', 'approval_requests', 'staff_invitations')
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

insert into cm4_results
select 'no_password_or_token_in_invitations', count(*) = 0, count(*)::text
from information_schema.columns
where table_schema = 'public'
  and table_name = 'staff_invitations'
  and column_name ~* '(password|token|cookie|secret)';

insert into cm4_results
select 'blood_public_intake_still_disabled', count(*) = 2, count(*)::text
from public.blood_support_settings
where setting_key in ('public_request_intake_enabled', 'public_donor_interest_enabled')
  and setting_value = 'false'::jsonb
  and is_active = true;

select * from cm4_results order by check_name;

rollback;
