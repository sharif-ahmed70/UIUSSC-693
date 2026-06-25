-- Follow-up onboarding RPC fix.
-- The current volunteer_profiles table has no submitted_at column; updated_at is trigger-maintained.

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
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_auth_email is null or v_auth_email <> lower(btrim(p_email)) then
    raise exception 'Email must match authenticated account' using errcode = '42501';
  end if;

  if p_preferred_department_id is not null and not exists (
    select 1 from public.club_departments
    where id = p_preferred_department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Invalid department' using errcode = '22023';
  end if;

  select * into v_profile
  from public.volunteer_profiles
  where auth_user_id = v_auth_user_id
  for update;

  if found then
    if v_profile.account_status in ('suspended', 'archived') then
      raise exception 'Profile is not eligible for onboarding update' using errcode = '42501';
    end if;

    update public.volunteer_profiles
    set
      full_name = btrim(p_full_name),
      student_id = nullif(btrim(p_student_id), ''),
      email = lower(btrim(p_email)),
      phone = nullif(btrim(p_phone), ''),
      academic_department = nullif(btrim(p_academic_department), ''),
      trimester = nullif(btrim(p_trimester), ''),
      blood_group = nullif(btrim(p_blood_group), ''),
      onboarding_status = 'submitted'
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
      nullif(btrim(p_student_id), ''),
      lower(btrim(p_email)),
      nullif(btrim(p_phone), ''),
      nullif(btrim(p_academic_department), ''),
      nullif(btrim(p_trimester), ''),
      nullif(btrim(p_blood_group), ''),
      'pending',
      'submitted'
    )
    returning * into v_profile;
  end if;

  if p_preferred_department_id is null then
    return query select v_profile.id, null::uuid, v_profile.onboarding_status, null::text;
    return;
  end if;

  select id into v_existing_same_department
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and department_id = p_preferred_department_id
  for update;

  if v_existing_same_department is not null then
    update public.volunteer_department_memberships
    set
      membership_status = case
        when membership_status in ('rejected', 'removed') then 'requested'
        else membership_status
      end,
      department_role = 'executive',
      requested_at = coalesce(requested_at, now()),
      rejection_reason = null,
      removed_at = null,
      removed_by = null,
      removal_reason = null
    where id = v_existing_same_department
    returning * into v_membership;
  else
    insert into public.volunteer_department_memberships (
      volunteer_profile_id,
      department_id,
      department_role,
      membership_status,
      is_primary,
      requested_at
    )
    values (
      v_profile.id,
      p_preferred_department_id,
      'executive',
      'requested',
      not exists (
        select 1 from public.volunteer_department_memberships
        where volunteer_profile_id = v_profile.id
      ),
      now()
    )
    returning * into v_membership;
  end if;

  return query select v_profile.id, v_membership.id, v_profile.onboarding_status, v_membership.membership_status;
end;
$$;

revoke all on function public.submit_volunteer_onboarding(text, text, text, text, text, text, text, uuid) from anon, public;
grant execute on function public.submit_volunteer_onboarding(text, text, text, text, text, text, text, uuid) to authenticated;
