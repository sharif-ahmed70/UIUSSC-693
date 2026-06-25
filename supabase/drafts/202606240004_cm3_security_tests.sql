begin;

set local role anon;

do $$
begin
  perform count(*) from public.membership_applications;
  raise exception 'anon unexpectedly read membership_applications';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot read membership_applications';
end;
$$;

do $$
begin
  perform count(*) from public.volunteer_profiles;
  raise exception 'anon unexpectedly read volunteer_profiles';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot read volunteer_profiles';
end;
$$;

do $$
begin
  perform public.approve_volunteer_profile(gen_random_uuid(), 'test');
  raise exception 'anon unexpectedly called admin RPC';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot call admin RPC';
end;
$$;

rollback;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.email = 'cm3-test@example.invalid';

select public.can_manage_volunteers() as fake_user_can_manage_volunteers;
select public.can_manage_platform_roles() as fake_user_can_manage_platform_roles;
select count(*) as fake_user_membership_applications_visible
from public.membership_applications;
select count(*) as fake_user_volunteer_profiles_visible
from public.volunteer_profiles;
select count(*) as fake_user_audit_logs_visible
from public.club_audit_logs;

rollback;
