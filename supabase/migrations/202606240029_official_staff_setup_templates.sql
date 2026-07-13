-- Update guided staff setup to official UIUSSC templates.
-- Core leadership gets club-wide access. Department titles link to departments
-- through volunteer_department_memberships instead of treating departments as positions.

create or replace function public.setup_staff_access(
  p_profile_id uuid,
  p_template_key text,
  p_department_id uuid default null,
  p_reason text default 'Staff setup completed through guided administration'
)
returns table(
  profile_id uuid,
  account_status text,
  onboarding_status text,
  official_position text,
  website_access text,
  department_name text,
  department_role text,
  profile_was_approved boolean,
  position_was_assigned boolean,
  platform_role_was_assigned boolean,
  department_role_was_assigned boolean
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_profile public.volunteer_profiles%rowtype;
  v_position_slug text;
  v_position public.club_positions%rowtype;
  v_platform_role text;
  v_department_role text;
  v_department_slug text;
  v_requires_department boolean := false;
  v_department public.club_departments%rowtype;
  v_membership public.volunteer_department_memberships%rowtype;
  v_previous_membership public.volunteer_department_memberships%rowtype;
  v_existing_membership_id uuid;
  v_is_primary boolean := true;
  v_reason text := coalesce(nullif(btrim(p_reason), ''), 'Staff setup completed through guided administration');
  v_previous_account_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.can_manage_volunteers() then
    raise exception 'Not authorized to manage volunteers' using errcode = '42501';
  end if;

  if p_profile_id = v_actor then
    raise exception 'Self-escalation is not allowed in guided staff setup' using errcode = '42501';
  end if;

  case p_template_key
    when 'president' then
      v_position_slug := 'president';
      v_platform_role := 'club_admin';
    when 'vice-president' then
      v_position_slug := 'vice-president';
      v_platform_role := 'club_admin';
    when 'assistant-vice-president' then
      v_position_slug := 'assistant-vice-president';
      v_platform_role := 'club_admin';
    when 'general-secretary' then
      v_position_slug := 'general-secretary';
      v_platform_role := 'club_admin';
    when 'treasurer' then
      v_position_slug := 'treasurer';
      v_platform_role := 'club_admin';
    when 'head-blood' then
      v_position_slug := 'head-blood';
      v_department_slug := 'blood';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'head-volunteer' then
      v_position_slug := 'head-volunteer';
      v_department_slug := 'volunteer-management';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'deputy-volunteer' then
      v_position_slug := 'deputy-volunteer';
      v_department_slug := 'volunteer-management';
      v_department_role := 'deputy_head';
      v_requires_department := true;
    when 'head-marketing' then
      v_position_slug := 'head-marketing';
      v_department_slug := 'marketing';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'deputy-marketing' then
      v_position_slug := 'deputy-marketing';
      v_department_slug := 'marketing';
      v_department_role := 'deputy_head';
      v_requires_department := true;
    when 'head-logistics' then
      v_position_slug := 'head-logistics';
      v_department_slug := 'logistics';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'deputy-logistics' then
      v_position_slug := 'deputy-logistics';
      v_department_slug := 'logistics';
      v_department_role := 'deputy_head';
      v_requires_department := true;
    when 'head-event-management' then
      v_position_slug := 'head-event-management';
      v_department_slug := 'event-management';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'deputy-event-management' then
      v_position_slug := 'deputy-event-management';
      v_department_slug := 'event-management';
      v_department_role := 'deputy_head';
      v_requires_department := true;
    when 'head-graphics' then
      v_position_slug := 'head-graphics';
      v_department_slug := 'graphics-creative';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'head-public-relations' then
      v_position_slug := 'head-public-relations';
      v_department_slug := 'public-relations';
      v_department_role := 'department_head';
      v_requires_department := true;
    when 'deputy-public-relations' then
      v_position_slug := 'deputy-public-relations';
      v_department_slug := 'public-relations';
      v_department_role := 'deputy_head';
      v_requires_department := true;
    when 'executive-member-blood' then
      v_position_slug := 'executive-member-blood';
      v_department_slug := 'blood';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-volunteer-management' then
      v_position_slug := 'executive-member-volunteer-management';
      v_department_slug := 'volunteer-management';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-marketing' then
      v_position_slug := 'executive-member-marketing';
      v_department_slug := 'marketing';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-logistics' then
      v_position_slug := 'executive-member-logistics';
      v_department_slug := 'logistics';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-event-management' then
      v_position_slug := 'executive-member-event-management';
      v_department_slug := 'event-management';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-graphics-creative' then
      v_position_slug := 'executive-member-graphics-creative';
      v_department_slug := 'graphics-creative';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-public-relations' then
      v_position_slug := 'executive-member-public-relations';
      v_department_slug := 'public-relations';
      v_department_role := 'executive';
      v_requires_department := true;
    when 'executive-member-general-support' then
      v_position_slug := 'executive-member-general-support';
    else
      raise exception 'Unsupported staff setup template' using errcode = '22023';
  end case;

  if v_platform_role = 'super_admin' then
    raise exception 'Super Admin cannot be assigned through guided staff setup' using errcode = '42501';
  end if;

  if v_platform_role is not null and not public.can_manage_platform_roles() then
    raise exception 'Not authorized to assign website access' using errcode = '42501';
  end if;

  select * into v_profile
  from public.volunteer_profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'Volunteer profile not found' using errcode = 'P0002';
  end if;

  if v_profile.archived_at is not null or v_profile.account_status = 'archived' then
    raise exception 'Archived profile cannot be configured' using errcode = '22023';
  end if;

  if v_profile.account_status in ('suspended') then
    raise exception 'Suspended profile cannot be configured' using errcode = '22023';
  end if;

  if v_requires_department then
    if v_department_slug is not null then
      select * into v_department
      from public.club_departments
      where slug = v_department_slug
        and status = 'active'
        and archived_at is null;
    elsif p_department_id is not null then
      select * into v_department
      from public.club_departments
      where id = p_department_id
        and status = 'active'
        and archived_at is null;
    else
      raise exception 'Department is required for this staff setup template' using errcode = '22023';
    end if;

    if not found then
      raise exception 'Department must be active' using errcode = '22023';
    end if;
  end if;

  if v_position_slug is not null then
    select * into v_position
    from public.club_positions
    where slug = v_position_slug
      and status = 'active'
      and archived_at is null;

    if not found then
      raise exception 'Official position is not active' using errcode = '22023';
    end if;
  end if;

  profile_was_approved := false;
  position_was_assigned := false;
  platform_role_was_assigned := false;
  department_role_was_assigned := false;

  if v_profile.account_status <> 'approved' or v_profile.onboarding_status <> 'approved' then
    if v_profile.onboarding_status not in ('submitted', 'under_review', 'approved') then
      raise exception 'Profile is not ready for approval' using errcode = '22023';
    end if;

    v_previous_account_status := v_profile.account_status;

    update public.volunteer_profiles
    set
      account_status = 'approved',
      onboarding_status = 'approved',
      approved_at = now(),
      approved_by = v_actor,
      rejected_at = null,
      rejected_by = null,
      rejection_reason = null,
      suspended_at = null,
      suspended_by = null,
      suspension_reason = null,
      joined_at = coalesce(joined_at, now())
    where id = p_profile_id
    returning * into v_profile;

    insert into public.volunteer_status_history (volunteer_profile_id, previous_status, new_status, changed_by, reason)
    values (p_profile_id, v_previous_account_status, 'approved', v_actor, v_reason);

    profile_was_approved := true;
  end if;

  if v_position.id is not null and not exists (
    select 1 from public.volunteer_club_positions
    where volunteer_profile_id = p_profile_id
      and club_position_id = v_position.id
      and status = 'active'
  ) then
    select not exists (
      select 1 from public.volunteer_club_positions
      where volunteer_profile_id = p_profile_id
        and status = 'active'
        and is_primary = true
    ) into v_is_primary;

    if v_is_primary then
      update public.volunteer_club_positions
      set is_primary = false
      where volunteer_profile_id = p_profile_id
        and status = 'active';
    end if;

    insert into public.volunteer_club_positions (
      volunteer_profile_id,
      club_position_id,
      status,
      is_primary,
      term_start,
      assigned_by,
      reason
    )
    values (
      p_profile_id,
      v_position.id,
      'active',
      v_is_primary,
      current_date,
      v_actor,
      v_reason
    );

    position_was_assigned := true;
  end if;

  if v_platform_role is not null and not exists (
    select 1 from public.volunteer_platform_roles
    where volunteer_profile_id = p_profile_id
      and role = v_platform_role
      and status = 'active'
  ) then
    insert into public.volunteer_platform_roles (volunteer_profile_id, role, status, assigned_by)
    values (p_profile_id, v_platform_role, 'active', v_actor);

    platform_role_was_assigned := true;
  end if;

  if v_department_role is not null then
    select id into v_existing_membership_id
    from public.volunteer_department_memberships
    where volunteer_profile_id = p_profile_id
      and department_id = v_department.id
    for update;

    if v_existing_membership_id is null then
      insert into public.volunteer_department_memberships (
        volunteer_profile_id,
        department_id,
        department_role,
        membership_status,
        is_primary,
        requested_at,
        approved_at,
        approved_by
      )
      values (
        p_profile_id,
        v_department.id,
        v_department_role,
        'approved',
        not exists (select 1 from public.volunteer_department_memberships where volunteer_profile_id = p_profile_id),
        now(),
        now(),
        v_actor
      )
      returning * into v_membership;

      insert into public.department_membership_history (department_membership_id, previous_status, new_status, previous_role, new_role, changed_by, reason)
      values (v_membership.id, null, 'approved', null, v_department_role, v_actor, v_reason);
      department_role_was_assigned := true;
    else
      select * into v_previous_membership
      from public.volunteer_department_memberships
      where id = v_existing_membership_id;

      update public.volunteer_department_memberships
      set
        department_role = v_department_role,
        membership_status = 'approved',
        approved_at = coalesce(approved_at, now()),
        approved_by = coalesce(approved_by, v_actor),
        rejected_at = null,
        rejected_by = null,
        rejection_reason = null,
        suspended_at = null,
        suspended_by = null,
        suspension_reason = null,
        removed_at = null,
        removed_by = null,
        removal_reason = null
      where id = v_existing_membership_id
      returning * into v_membership;

      if v_previous_membership.membership_status is distinct from v_membership.membership_status
        or v_previous_membership.department_role is distinct from v_membership.department_role then
        insert into public.department_membership_history (department_membership_id, previous_status, new_status, previous_role, new_role, changed_by, reason)
        values (v_membership.id, v_previous_membership.membership_status, v_membership.membership_status, v_previous_membership.department_role, v_membership.department_role, v_actor, v_reason);
      end if;

      department_role_was_assigned := true;
    end if;
  end if;

  perform public.write_club_audit_log(
    'staff_setup.complete',
    'volunteer_profile',
    p_profile_id,
    case when v_department.id is null then null else v_department.id end,
    jsonb_build_object(
      'template', p_template_key,
      'official_position', v_position_slug,
      'website_access', v_platform_role,
      'department_slug', v_department_slug,
      'department_role', v_department_role,
      'profile_approved', profile_was_approved,
      'position_assigned', position_was_assigned,
      'platform_role_assigned', platform_role_was_assigned,
      'department_role_assigned', department_role_was_assigned
    )
  );

  return query select
    p_profile_id,
    v_profile.account_status,
    v_profile.onboarding_status,
    v_position_slug,
    v_platform_role,
    case when v_department.id is null then null else v_department.name end,
    v_department_role,
    profile_was_approved,
    position_was_assigned,
    platform_role_was_assigned,
    department_role_was_assigned;
end;
$$;

revoke all on function public.setup_staff_access(uuid, text, uuid, text) from anon, public;
grant execute on function public.setup_staff_access(uuid, text, uuid, text) to authenticated;
