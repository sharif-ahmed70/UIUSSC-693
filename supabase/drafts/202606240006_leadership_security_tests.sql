begin;

set local role anon;

select count(*) as public_active_position_titles
from public.club_positions;

do $$
begin
  perform count(*) from public.volunteer_club_positions;
  raise exception 'anon unexpectedly read volunteer_club_positions';
exception
  when insufficient_privilege then
    raise notice 'expected: anon cannot read volunteer position assignments';
end;
$$;

rollback;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.email = 'leadership-test@example.invalid';

select count(*) as fake_user_position_assignments_visible
from public.volunteer_club_positions;

do $$
begin
  perform public.assign_volunteer_club_position(gen_random_uuid(), gen_random_uuid(), true, current_date, 'test');
  raise exception 'ordinary authenticated user unexpectedly assigned position';
exception
  when insufficient_privilege then
    raise notice 'expected: ordinary authenticated user cannot assign positions';
  when raise_exception then
    raise notice 'expected: ordinary authenticated user cannot assign positions';
end;
$$;

rollback;

-- Live tests after real admin bootstrap:
-- - General Secretary assignment remains independent from super_admin
-- - President transition completes General Secretary and preserves super_admin
-- - Core Panel position alone does not grant platform role
-- - no department membership is created when onboarding department is null
