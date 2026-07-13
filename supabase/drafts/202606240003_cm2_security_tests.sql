begin;

set local role anon;

select count(*) as anon_active_departments_visible
from public.club_departments;

do $$
begin
  perform count(*) from public.volunteer_profiles;
  raise exception 'anon unexpectedly read volunteer_profiles';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot read volunteer_profiles';
end;
$$;

rollback;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.email = 'cm2-test@example.invalid';

select count(*) as authenticated_fake_user_profile_rows
from public.volunteer_profiles;

select count(*) as authenticated_fake_user_platform_role_rows
from public.volunteer_platform_roles;

rollback;
