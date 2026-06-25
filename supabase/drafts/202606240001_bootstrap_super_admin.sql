-- UIUSSC operator-only bootstrap draft for the first super admin.
-- Never run this file automatically as a migration or seed.
-- Run manually only by the database owner or trusted operator after human approval.
-- Replace placeholders with one real existing Supabase Auth user id and exact email.
-- Optional: set expected_profile_id after operator review.
-- preferred_department_slug should normally remain null for Core Panel executives.

begin;

do $$
declare
  target_auth_user_id uuid := '00000000-0000-0000-0000-000000000000';
  expected_verified_email text := 'replace-with-exact-admin-email@example.edu';
  expected_profile_id uuid := null;
  club_position_slug text := 'general-secretary';
  preferred_department_slug text := null;
  target_auth_email text;
  selected_profile public.volunteer_profiles%rowtype;
  selected_position public.club_positions%rowtype;
  selected_position_assignment public.volunteer_club_positions%rowtype;
  selected_department public.club_departments%rowtype;
  selected_membership public.volunteer_department_memberships%rowtype;
begin
  if target_auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace target_auth_user_id with an existing Supabase Auth user UUID before running.';
  end if;

  if expected_verified_email is null or expected_verified_email = 'replace-with-exact-admin-email@example.edu' then
    raise exception 'Set expected_verified_email to the exact verified email before running.';
  end if;

  select email
  into target_auth_email
  from auth.users
  where id = target_auth_user_id
    and deleted_at is null;

  if target_auth_email is null then
    raise exception 'No active Supabase Auth user exists for the supplied UUID.';
  end if;

  if lower(btrim(expected_verified_email)) <> lower(btrim(target_auth_email)) then
    raise exception 'Expected email does not match the supplied Auth user.';
  end if;

  select *
  into selected_profile
  from public.volunteer_profiles
  where auth_user_id = target_auth_user_id
    and (expected_profile_id is null or id = expected_profile_id)
  for update;

  if selected_profile.id is null then
    raise exception 'No volunteer profile exists for the supplied Auth user UUID and optional profile id.';
  end if;

  if selected_profile.auth_user_id <> target_auth_user_id then
    raise exception 'Selected profile does not belong to the supplied Auth user.';
  end if;

  if selected_profile.archived_at is not null or selected_profile.account_status = 'archived' then
    raise exception 'Archived profiles cannot be bootstrapped.';
  end if;

  if selected_profile.account_status in ('rejected', 'suspended') or selected_profile.onboarding_status = 'rejected' then
    raise exception 'Rejected or suspended profiles require a separate explicit operator decision before bootstrap.';
  end if;

  if selected_profile.onboarding_status not in ('submitted', 'under_review', 'approved') then
    raise exception 'Profile must have completed onboarding before bootstrap.';
  end if;

  if exists (
    select 1
    from public.volunteer_platform_roles
    where role = 'super_admin'
      and status = 'active'
  ) then
    raise exception 'An active super_admin already exists. This first-admin bootstrap is no longer valid.';
  end if;

  if exists (
    select 1
    from public.volunteer_platform_roles
    where volunteer_profile_id = selected_profile.id
      and role = 'super_admin'
      and status = 'active'
  ) then
    raise exception 'Target profile already has active super_admin.';
  end if;

  select *
  into selected_position
  from public.club_positions
  where slug = lower(btrim(club_position_slug))
    and status = 'active'
    and archived_at is null;

  if selected_position.id is null then
    raise exception 'Selected club position slug does not reference an active position.';
  end if;

  update public.volunteer_profiles
  set
    account_status = 'approved',
    onboarding_status = 'approved',
    approved_at = coalesce(approved_at, now()),
    approved_by = null,
    rejected_at = null,
    rejected_by = null,
    rejection_reason = null,
    suspended_at = null,
    suspended_by = null,
    suspension_reason = null,
    joined_at = coalesce(joined_at, now())
  where id = selected_profile.id;

  insert into public.volunteer_status_history (
    volunteer_profile_id,
    previous_status,
    new_status,
    changed_by,
    reason
  )
  values (
    selected_profile.id,
    selected_profile.account_status,
    'approved',
    null,
    'operator bootstrap for first super_admin'
  );

  if preferred_department_slug is not null then
    select *
    into selected_department
    from public.club_departments
    where slug = lower(btrim(preferred_department_slug))
      and status = 'active'
      and archived_at is null;

    if selected_department.id is null then
      raise exception 'Preferred department slug does not reference an active department.';
    end if;

    select *
    into selected_membership
    from public.volunteer_department_memberships
    where volunteer_profile_id = selected_profile.id
      and department_id = selected_department.id
      and membership_status in ('requested', 'under_review', 'approved')
    for update;

    if selected_membership.id is null then
      raise exception 'No active department request exists for the preferred department slug.';
    end if;

    update public.volunteer_department_memberships
    set
      membership_status = 'approved',
      department_role = 'department_head',
      is_primary = true,
      approved_at = coalesce(approved_at, now()),
      approved_by = null,
      rejected_at = null,
      rejected_by = null,
      rejection_reason = null,
      suspended_at = null,
      suspended_by = null,
      suspension_reason = null,
      removed_at = null,
      removed_by = null,
      removal_reason = null
    where id = selected_membership.id;

    update public.volunteer_department_memberships
    set is_primary = false
    where volunteer_profile_id = selected_profile.id
      and id <> selected_membership.id
      and membership_status = 'approved';

    update public.volunteer_profiles
    set primary_department_id = selected_department.id
    where id = selected_profile.id;

    insert into public.department_membership_history (
      department_membership_id,
      previous_status,
      new_status,
      previous_role,
      new_role,
      changed_by,
      reason
    )
    values (
      selected_membership.id,
      selected_membership.membership_status,
      'approved',
      selected_membership.department_role,
      'department_head',
      null,
      'operator bootstrap for first super_admin'
    );
  end if;

  if exists (
    select 1
    from public.volunteer_club_positions
    where volunteer_profile_id = selected_profile.id
      and club_position_id = selected_position.id
      and status = 'active'
  ) then
    raise exception 'Target profile already has this active club position.';
  end if;

  update public.volunteer_club_positions
  set is_primary = false
  where volunteer_profile_id = selected_profile.id
    and status = 'active';

  insert into public.volunteer_club_positions (
    volunteer_profile_id,
    club_position_id,
    status,
    is_primary,
    term_start,
    assigned_by,
    assigned_at,
    reason
  )
  values (
    selected_profile.id,
    selected_position.id,
    'active',
    true,
    current_date,
    null,
    now(),
    'operator bootstrap for first super_admin'
  )
  returning * into selected_position_assignment;

  insert into public.volunteer_platform_roles (
    volunteer_profile_id,
    role,
    status,
    assigned_by,
    assigned_at
  )
  values (
    selected_profile.id,
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
    selected_profile.id,
    target_auth_user_id,
    'bootstrap_super_admin_assigned',
    'volunteer_profile',
    selected_profile.id,
    jsonb_build_object(
      'operator_action', true,
      'manual_bootstrap', true,
      'club_position_slug', selected_position.slug,
      'preferred_department_slug_supplied', preferred_department_slug is not null
    )
  );

  insert into public.club_audit_logs (
    actor_profile_id,
    actor_auth_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    selected_profile.id,
    target_auth_user_id,
    'bootstrap_club_position_assigned',
    'volunteer_profile',
    selected_profile.id,
    jsonb_build_object(
      'operator_action', true,
      'manual_bootstrap', true,
      'club_position_slug', selected_position.slug,
      'assignment_id', selected_position_assignment.id
    )
  );
end $$;

select
  vp.id as volunteer_profile_id,
  vp.account_status,
  vp.onboarding_status,
  cp.name as primary_club_position,
  count(vpr.id) filter (where vpr.role = 'super_admin' and vpr.status = 'active') as active_super_admin_roles
from public.volunteer_profiles vp
left join public.volunteer_platform_roles vpr on vpr.volunteer_profile_id = vp.id
left join public.volunteer_club_positions vcp on vcp.volunteer_profile_id = vp.id and vcp.status = 'active' and vcp.is_primary = true
left join public.club_positions cp on cp.id = vcp.club_position_id
where vp.auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid
group by vp.id, vp.account_status, vp.onboarding_status, cp.name;

commit;
