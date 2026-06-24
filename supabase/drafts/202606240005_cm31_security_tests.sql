-- CM-3.1 security tests are intentionally non-destructive unless run by a
-- trusted operator with explicit disposable accounts.

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
  perform public.assign_platform_role(gen_random_uuid(), 'super_admin', 'test');
  raise exception 'anon unexpectedly called assign_platform_role';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot call admin RPCs';
end;
$$;

rollback;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.email = 'cm31-test@example.invalid';

select public.can_manage_volunteers() as ordinary_user_can_manage_volunteers;
select public.can_manage_platform_roles() as ordinary_user_can_manage_platform_roles;
select count(*) as ordinary_user_admin_applications_visible
from public.membership_applications;
select count(*) as ordinary_user_admin_profiles_visible
from public.volunteer_profiles;
select count(*) as ordinary_user_audit_logs_visible
from public.club_audit_logs;

rollback;

-- Live tests to run only after an explicit disposable account exists:
-- - final-super-admin protection
-- - suspended-admin denial
-- - role escalation denial
-- - cross-department denial
-- - history creation
-- - audit creation
