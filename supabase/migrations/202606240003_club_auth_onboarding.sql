-- UIUSSC Phase CM-2: secure staff auth onboarding support
-- Version: 202606240003

-- Allow authenticated users to read only their own active platform roles.
grant select (
  id,
  volunteer_profile_id,
  role,
  status,
  assigned_at,
  created_at,
  updated_at
) on public.volunteer_platform_roles to authenticated;

drop policy if exists "Authenticated users can read own active platform roles" on public.volunteer_platform_roles;
create policy "Authenticated users can read own active platform roles"
on public.volunteer_platform_roles
for select
to authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.volunteer_profiles
    where volunteer_profiles.id = volunteer_platform_roles.volunteer_profile_id
      and volunteer_profiles.auth_user_id = auth.uid()
      and volunteer_profiles.archived_at is null
  )
);

create or replace function public.submit_volunteer_onboarding(
  p_full_name text,
  p_student_id text,
  p_email text,
  p_phone text,
  p_academic_department text,
  p_trimester text,
  p_blood_group text,
  p_preferred_department_id uuid
)
returns table (
  volunteer_profile_id uuid,
  department_membership_id uuid,
  onboarding_status text,
  membership_status text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_auth_email text := lower(nullif(btrim(auth.jwt() ->> 'email'), ''));
  v_profile public.volunteer_profiles%rowtype;
  v_membership public.volunteer_department_memberships%rowtype;
  v_existing_same_department uuid;
begin
  if v_auth_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if v_auth_email is null or lower(btrim(p_email)) <> v_auth_email then
    raise exception 'Email must match authenticated account' using errcode = '22023';
  end if;

  if nullif(btrim(p_full_name), '') is null
    or nullif(btrim(p_student_id), '') is null
    or nullif(btrim(p_phone), '') is null
    or nullif(btrim(p_academic_department), '') is null
    or nullif(btrim(p_trimester), '') is null then
    raise exception 'Missing required onboarding fields' using errcode = '22023';
  end if;

  if p_blood_group is not null and nullif(btrim(p_blood_group), '') is not null
    and p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then
    raise exception 'Invalid blood group' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.club_departments
    where id = p_preferred_department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Invalid department request' using errcode = '22023';
  end if;

  select *
  into v_profile
  from public.volunteer_profiles
  where auth_user_id = v_auth_user_id
  for update;

  if found then
    if v_profile.account_status not in ('pending', 'approved') or v_profile.archived_at is not null then
      raise exception 'Profile is not eligible for onboarding updates' using errcode = '42501';
    end if;

    if v_profile.onboarding_status not in ('profile_incomplete', 'submitted', 'under_review', 'approved') then
      raise exception 'Onboarding state cannot be changed by this action' using errcode = '42501';
    end if;

    update public.volunteer_profiles
    set
      full_name = btrim(p_full_name),
      student_id = upper(regexp_replace(btrim(p_student_id), '\s+', '', 'g')),
      email = v_auth_email,
      phone = btrim(p_phone),
      academic_department = btrim(p_academic_department),
      trimester = btrim(p_trimester),
      blood_group = nullif(btrim(p_blood_group), ''),
      onboarding_status = case
        when onboarding_status = 'approved' then onboarding_status
        else 'submitted'
      end
    where id = v_profile.id
    returning * into v_profile;
  else
    insert into public.volunteer_profiles (
      auth_user_id,
      full_name,
      student_id,
      email,
      phone,
      academic_department,
      trimester,
      blood_group,
      account_status,
      onboarding_status
    )
    values (
      v_auth_user_id,
      btrim(p_full_name),
      upper(regexp_replace(btrim(p_student_id), '\s+', '', 'g')),
      v_auth_email,
      btrim(p_phone),
      btrim(p_academic_department),
      btrim(p_trimester),
      nullif(btrim(p_blood_group), ''),
      'pending',
      'submitted'
    )
    returning * into v_profile;
  end if;

  select id
  into v_existing_same_department
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and department_id = p_preferred_department_id
  limit 1;

  select *
  into v_membership
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and is_primary = true
    and membership_status in ('requested', 'under_review', 'approved')
  for update;

  if found then
    if v_membership.membership_status = 'approved' then
      -- Preserve trusted approved membership state.
      null;
    elsif v_existing_same_department is not null and v_existing_same_department <> v_membership.id then
      raise exception 'Duplicate department membership request' using errcode = '23505';
    else
      update public.volunteer_department_memberships
      set
        department_id = p_preferred_department_id,
        department_role = 'volunteer',
        membership_status = 'requested',
        requested_at = now(),
        approved_at = null,
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
      where id = v_membership.id
      returning * into v_membership;
    end if;
  else
    if v_existing_same_department is not null then
      raise exception 'Duplicate department membership request' using errcode = '23505';
    end if;

    insert into public.volunteer_department_memberships (
      volunteer_profile_id,
      department_id,
      department_role,
      membership_status,
      is_primary
    )
    values (
      v_profile.id,
      p_preferred_department_id,
      'volunteer',
      'requested',
      true
    )
    returning * into v_membership;
  end if;

  return query
  select
    v_profile.id,
    v_membership.id,
    v_profile.onboarding_status,
    v_membership.membership_status;
end;
$$;

revoke all on function public.submit_volunteer_onboarding(text, text, text, text, text, text, text, uuid) from public;
grant execute on function public.submit_volunteer_onboarding(text, text, text, text, text, text, text, uuid) to authenticated;
