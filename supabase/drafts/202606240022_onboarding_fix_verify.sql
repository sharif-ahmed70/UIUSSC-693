-- Volunteer onboarding generated-column fix verification.
-- Development only. Transaction wrapped; disposable changes are rolled back.

begin;

do $$
declare
  v_generated_count integer;
  v_function_definition text;
  v_has_safe_search_path boolean;
  v_public_execute boolean;
  v_authenticated_execute boolean;
  v_auth_user_id uuid;
  v_auth_email text;
  v_profile_id uuid;
  v_before_memberships integer;
  v_after_memberships integer;
  v_result record;
  v_profile record;
begin
  select count(*) into v_generated_count
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'volunteer_profiles'
    and a.attname in ('student_id_normalized', 'email_normalized', 'phone_normalized')
    and a.attgenerated = 's';

  if v_generated_count <> 3 then
    raise exception 'normalized volunteer profile columns are not all generated stored columns';
  end if;

  select pg_get_functiondef(to_regprocedure('public.submit_volunteer_onboarding(text,text,text,text,text,text,text,uuid)'))
  into v_function_definition;

  if v_function_definition is null then
    raise exception 'submit_volunteer_onboarding function is missing';
  end if;

  select 'search_path=public, auth, pg_temp' = any(coalesce(p.proconfig, array[]::text[]))
  into v_has_safe_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure('public.submit_volunteer_onboarding(text,text,text,text,text,text,text,uuid)');

  if not coalesce(v_has_safe_search_path, false) then
    raise exception 'submit_volunteer_onboarding search_path is not fixed safely';
  end if;

  if v_function_definition ~* '(student_id_normalized|email_normalized|phone_normalized)' then
    raise exception 'submit_volunteer_onboarding still references generated normalized columns';
  end if;

  select has_function_privilege('public', 'public.submit_volunteer_onboarding(text,text,text,text,text,text,text,uuid)', 'execute')
  into v_public_execute;

  if v_public_execute then
    raise exception 'PUBLIC can execute submit_volunteer_onboarding';
  end if;

  select has_function_privilege('authenticated', 'public.submit_volunteer_onboarding(text,text,text,text,text,text,text,uuid)', 'execute')
  into v_authenticated_execute;

  if not v_authenticated_execute then
    raise exception 'authenticated cannot execute submit_volunteer_onboarding';
  end if;

  select vp.id, vp.auth_user_id, vp.email
  into v_profile_id, v_auth_user_id, v_auth_email
  from public.volunteer_profiles vp
  join public.volunteer_club_positions vcp on vcp.volunteer_profile_id = vp.id
  join public.club_positions cp on cp.id = vcp.club_position_id
  where cp.slug = 'president'
    and vcp.status = 'active'
    and vp.account_status <> 'archived'
    and vp.auth_user_id is not null
    and nullif(btrim(vp.email), '') is not null
  limit 1;

  if v_profile_id is null then
    select vp.id, vp.auth_user_id, vp.email
    into v_profile_id, v_auth_user_id, v_auth_email
    from public.volunteer_profiles vp
    join public.volunteer_platform_roles vpr on vpr.volunteer_profile_id = vp.id
    where vpr.role = 'super_admin'
      and vpr.status = 'active'
      and vp.account_status <> 'archived'
      and vp.auth_user_id is not null
      and nullif(btrim(vp.email), '') is not null
    limit 1;
  end if;

  if v_profile_id is null then
    raise exception 'No controlled authenticated profile is available for null-department onboarding verification';
  end if;

  select count(*) into v_before_memberships
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile_id;

  perform set_config('request.jwt.claim.sub', v_auth_user_id::text, true);
  perform set_config('request.jwt.claim.email', lower(v_auth_email), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_auth_user_id::text, 'email', lower(v_auth_email), 'role', 'authenticated')::text, true);

  select * into v_result
  from public.submit_volunteer_onboarding(
    'CM Onboarding Verification',
    'CM-ONBOARDING-VERIFY',
    lower(v_auth_email),
    '+8801700000000',
    'Computer Science and Engineering',
    'Spring 2026',
    '',
    null
  );

  if v_result.volunteer_profile_id <> v_profile_id
    or v_result.department_membership_id is not null
    or v_result.onboarding_status <> 'submitted'
    or v_result.membership_status is not null then
    raise exception 'null-department onboarding result mismatch';
  end if;

  select count(*) into v_after_memberships
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile_id;

  if v_after_memberships <> v_before_memberships then
    raise exception 'null-department onboarding unexpectedly changed department memberships';
  end if;

  select student_id, student_id_normalized, email, email_normalized, phone, phone_normalized, onboarding_status
  into v_profile
  from public.volunteer_profiles
  where id = v_profile_id;

  if v_profile.student_id_normalized <> lower(btrim(v_profile.student_id))
    or v_profile.email_normalized <> lower(btrim(v_profile.email))
    or v_profile.phone_normalized <> regexp_replace(v_profile.phone, '[^0-9+]', '', 'g')
    or v_profile.onboarding_status <> 'submitted' then
    raise exception 'generated normalized values were not produced from source columns';
  end if;
end $$;

select 'onboarding_generated_column_fix_verify_passed' as check_name, true as ok;

rollback;
