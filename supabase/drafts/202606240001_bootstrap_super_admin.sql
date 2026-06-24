-- UIUSSC operator-only bootstrap draft for the first super admin.
-- Never run this file automatically as a migration or seed.
-- Run manually only by the database owner or trusted operator after human approval.
-- Replace the placeholder UUID with an existing Supabase Auth user id.

begin;

do $$
declare
  target_auth_user_id uuid := '00000000-0000-0000-0000-000000000000';
  target_profile_id uuid;
begin
  if target_auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace target_auth_user_id with an existing Supabase Auth user UUID before running.';
  end if;

  select id
  into target_profile_id
  from public.volunteer_profiles
  where auth_user_id = target_auth_user_id;

  if target_profile_id is null then
    raise exception 'No volunteer profile exists for the supplied Auth user UUID.';
  end if;

  update public.volunteer_profiles
  set
    account_status = 'approved',
    onboarding_status = 'approved',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
  where id = target_profile_id;

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
