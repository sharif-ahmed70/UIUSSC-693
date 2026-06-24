-- UIUSSC operator-only bootstrap draft for the first super admin.
-- Never run this file automatically as a migration or seed.
-- Run manually only by the database owner or trusted operator after human approval.
-- Replace the placeholder UUID with an existing Supabase Auth user id.
-- Optional: set expected_verified_email to the exact email confirmed by the operator.

begin;

do $$
declare
  target_auth_user_id uuid := '00000000-0000-0000-0000-000000000000';
  expected_verified_email text := null;
  target_auth_email text;
  target_profile_id uuid;
begin
  if target_auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace target_auth_user_id with an existing Supabase Auth user UUID before running.';
  end if;

  select email
  into target_auth_email
  from auth.users
  where id = target_auth_user_id;

  if target_auth_email is null then
    raise exception 'No Supabase Auth user exists for the supplied UUID.';
  end if;

  if expected_verified_email is not null and lower(btrim(expected_verified_email)) <> lower(btrim(target_auth_email)) then
    raise exception 'Expected email does not match the supplied Auth user.';
  end if;

  select id
  into target_profile_id
  from public.volunteer_profiles
  where auth_user_id = target_auth_user_id
    and account_status = 'approved'
    and onboarding_status = 'approved'
    and archived_at is null;

  if target_profile_id is null then
    raise exception 'No approved active volunteer profile exists for the supplied Auth user UUID.';
  end if;

  if exists (
    select 1
    from public.volunteer_platform_roles
    where volunteer_profile_id = target_profile_id
      and role = 'super_admin'
      and status = 'active'
  ) then
    raise exception 'Target profile already has active super_admin.';
  end if;

  insert into public.volunteer_platform_roles (
    volunteer_profile_id,
    role,
    status,
    assigned_by,
    assigned_at
  )
  values (
    target_profile_id,
    'super_admin',
    'active',
    null,
    now()
  )
  on conflict do nothing;

  insert into public.club_audit_logs (
    actor_profile_id,
    actor_auth_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    target_profile_id,
    target_auth_user_id,
    'bootstrap_super_admin_assigned',
    'volunteer_profile',
    target_profile_id,
    jsonb_build_object('operator_action', true, 'manual_bootstrap', true)
  );
end $$;

commit;
