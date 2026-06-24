-- UIUSSC Phase CM-3: secure administration and verification foundation
-- Version: 202606240004

-- ==================================================
-- 1. Membership application status history
-- ==================================================

create table if not exists public.membership_application_status_history (
  id uuid primary key default gen_random_uuid(),
  membership_application_id uuid not null references public.membership_applications(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint membership_application_status_history_status_check check (
    (previous_status is null or previous_status in ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn'))
    and new_status in ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn')
  )
);

create index if not exists membership_application_status_history_application_idx
on public.membership_application_status_history (membership_application_id, changed_at desc);

alter table public.membership_application_status_history enable row level security;

revoke all on table public.membership_application_status_history from anon, authenticated;

grant select (
  id,
  membership_application_id,
  previous_status,
  new_status,
  changed_by,
  reason,
  changed_at
) on public.membership_application_status_history to authenticated;

-- ==================================================
-- 2. Authorization helpers
-- ==================================================

create or replace function public.current_volunteer_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select vp.id
  from public.volunteer_profiles vp
  where vp.auth_user_id = auth.uid()
    and vp.account_status = 'approved'
    and vp.onboarding_status = 'approved'
    and vp.archived_at is null
  limit 1
$$;

create or replace function public.is_active_approved_volunteer()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_volunteer_profile_id() is not null
$$;

create or replace function public.has_active_platform_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_platform_roles vpr
    join public.volunteer_profiles vp on vp.id = vpr.volunteer_profile_id
    where vp.auth_user_id = auth.uid()
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and vpr.role = role_name
      and vpr.status = 'active'
  )
$$;

create or replace function public.has_any_active_platform_role(role_names text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_platform_roles vpr
    join public.volunteer_profiles vp on vp.id = vpr.volunteer_profile_id
    where vp.auth_user_id = auth.uid()
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and vpr.role = any(role_names)
      and vpr.status = 'active'
  )
$$;

create or replace function public.has_active_department_role(target_department_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_department_memberships vdm
    join public.volunteer_profiles vp on vp.id = vdm.volunteer_profile_id
    join public.club_departments cd on cd.id = vdm.department_id
    where vp.auth_user_id = auth.uid()
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and vdm.department_id = target_department_id
      and vdm.department_role = any(allowed_roles)
      and vdm.membership_status = 'approved'
      and cd.status = 'active'
      and cd.archived_at is null
  )
$$;

create or replace function public.can_review_membership_applications()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin', 'membership_admin'])
$$;

create or replace function public.can_manage_volunteers()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin', 'membership_admin'])
$$;

create or replace function public.can_manage_departments()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin', 'department_admin'])
$$;

create or replace function public.can_manage_platform_roles()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
$$;

create or replace function public.can_view_audit_logs()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin', 'membership_admin'])
$$;

revoke all on function public.current_volunteer_profile_id() from public;
revoke all on function public.is_active_approved_volunteer() from public;
revoke all on function public.has_active_platform_role(text) from public;
revoke all on function public.has_any_active_platform_role(text[]) from public;
revoke all on function public.has_active_department_role(uuid, text[]) from public;
revoke all on function public.can_review_membership_applications() from public;
revoke all on function public.can_manage_volunteers() from public;
revoke all on function public.can_manage_departments() from public;
revoke all on function public.can_manage_platform_roles() from public;
revoke all on function public.can_view_audit_logs() from public;

grant execute on function public.current_volunteer_profile_id() to authenticated;
grant execute on function public.is_active_approved_volunteer() to authenticated;
grant execute on function public.has_active_platform_role(text) to authenticated;
grant execute on function public.has_any_active_platform_role(text[]) to authenticated;
grant execute on function public.has_active_department_role(uuid, text[]) to authenticated;
grant execute on function public.can_review_membership_applications() to authenticated;
grant execute on function public.can_manage_volunteers() to authenticated;
grant execute on function public.can_manage_departments() to authenticated;
grant execute on function public.can_manage_platform_roles() to authenticated;
grant execute on function public.can_view_audit_logs() to authenticated;

-- ==================================================
-- 3. Admin read grants and RLS policies
-- ==================================================

grant select (
  id,
  full_name,
  student_id,
  email,
  phone,
  department,
  trimester,
  blood_group,
  interested_department,
  skills,
  motivation,
  status,
  admin_notes,
  reviewed_at,
  submitted_at,
  updated_at
) on public.membership_applications to authenticated;

grant select (
  id,
  name,
  slug,
  short_description,
  status,
  display_order,
  archived_at,
  created_at,
  updated_at
) on public.club_departments to authenticated;

grant select (
  approved_by,
  rejected_by,
  suspended_by
) on public.volunteer_profiles to authenticated;

grant select (
  approved_by,
  rejected_by,
  suspended_by,
  removed_by
) on public.volunteer_department_memberships to authenticated;

grant select (
  assigned_by,
  revoked_by,
  revoked_at,
  revocation_reason
) on public.volunteer_platform_roles to authenticated;

grant select (
  changed_by
) on public.volunteer_status_history to authenticated;

grant select (
  changed_by
) on public.department_membership_history to authenticated;

grant select (
  id,
  actor_profile_id,
  actor_auth_user_id,
  action,
  entity_type,
  entity_id,
  department_id,
  metadata,
  created_at
) on public.club_audit_logs to authenticated;

drop policy if exists "Admins can read membership applications" on public.membership_applications;
create policy "Admins can read membership applications"
on public.membership_applications
for select
to authenticated
using (public.can_review_membership_applications());

drop policy if exists "Admins can read all club departments" on public.club_departments;
create policy "Admins can read all club departments"
on public.club_departments
for select
to authenticated
using (public.can_manage_departments() or public.can_manage_volunteers());

drop policy if exists "Admins can read volunteer profiles" on public.volunteer_profiles;
create policy "Admins can read volunteer profiles"
on public.volunteer_profiles
for select
to authenticated
using (public.can_manage_volunteers());

drop policy if exists "Admins can read department memberships" on public.volunteer_department_memberships;
create policy "Admins can read department memberships"
on public.volunteer_department_memberships
for select
to authenticated
using (
  public.can_manage_volunteers()
  or public.has_active_department_role(department_id, array['department_head'])
);

drop policy if exists "Admins can read platform roles" on public.volunteer_platform_roles;
create policy "Admins can read platform roles"
on public.volunteer_platform_roles
for select
to authenticated
using (
  public.has_any_active_platform_role(array['super_admin', 'club_admin'])
  or exists (
    select 1
    from public.volunteer_profiles vp
    where vp.id = volunteer_platform_roles.volunteer_profile_id
      and vp.auth_user_id = auth.uid()
  )
);

drop policy if exists "Admins can read volunteer status history" on public.volunteer_status_history;
create policy "Admins can read volunteer status history"
on public.volunteer_status_history
for select
to authenticated
using (public.can_manage_volunteers());

drop policy if exists "Admins can read department membership history" on public.department_membership_history;
create policy "Admins can read department membership history"
on public.department_membership_history
for select
to authenticated
using (public.can_manage_volunteers());

drop policy if exists "Admins can read membership application history" on public.membership_application_status_history;
create policy "Admins can read membership application history"
on public.membership_application_status_history
for select
to authenticated
using (public.can_review_membership_applications());

drop policy if exists "Admins can read audit logs" on public.club_audit_logs;
create policy "Admins can read audit logs"
on public.club_audit_logs
for select
to authenticated
using (public.can_view_audit_logs());

-- ==================================================
-- 4. Internal audit helper
-- ==================================================

create or replace function public.write_club_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_department_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_profile_id uuid := public.current_volunteer_profile_id();
  v_log_id uuid;
begin
  insert into public.club_audit_logs (
    actor_profile_id,
    actor_auth_user_id,
    action,
    entity_type,
    entity_id,
    department_id,
    metadata
  )
  values (
    v_actor_profile_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_department_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all on function public.write_club_audit_log(text, text, uuid, uuid, jsonb) from public;

-- ==================================================
-- 5. Controlled admin RPCs
-- ==================================================

create or replace function public.review_membership_application(
  p_application_id uuid,
  p_status text,
  p_reason text default null,
  p_admin_notes text default null
)
returns table(application_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_application public.membership_applications%rowtype;
begin
  if v_actor is null or not public.can_review_membership_applications() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn') then
    raise exception 'Invalid membership application status' using errcode = '22023';
  end if;

  if p_status = 'rejected' and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_application
  from public.membership_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Membership application not found' using errcode = 'P0002';
  end if;

  update public.membership_applications
  set
    status = p_status,
    admin_notes = nullif(btrim(coalesce(p_admin_notes, admin_notes, '')), ''),
    reviewed_at = case when p_status = 'pending' then reviewed_at else now() end
  where id = p_application_id;

  insert into public.membership_application_status_history (
    membership_application_id,
    previous_status,
    new_status,
    changed_by,
    reason
  )
  values (
    p_application_id,
    v_application.status,
    p_status,
    v_actor,
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  perform public.write_club_audit_log(
    'membership_application.review',
    'membership_application',
    p_application_id,
    null,
    jsonb_build_object('previous_status', v_application.status, 'new_status', p_status)
  );

  return query select p_application_id, p_status;
end;
$$;

create or replace function public.approve_volunteer_profile(p_profile_id uuid, p_reason text default null)
returns table(profile_id uuid, account_status text, onboarding_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_profile public.volunteer_profiles%rowtype;
begin
  if v_actor is null or not public.can_manage_volunteers() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_profile from public.volunteer_profiles where id = p_profile_id for update;

  if not found then
    raise exception 'Volunteer profile not found' using errcode = 'P0002';
  end if;

  if v_profile.id = v_actor then
    raise exception 'Self-approval is not allowed' using errcode = '42501';
  end if;

  if v_profile.archived_at is not null or v_profile.account_status = 'archived' then
    raise exception 'Archived profile cannot be approved' using errcode = '22023';
  end if;

  if v_profile.onboarding_status not in ('submitted', 'under_review', 'approved') then
    raise exception 'Profile is not ready for approval' using errcode = '22023';
  end if;

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
  where id = p_profile_id;

  insert into public.volunteer_status_history (volunteer_profile_id, previous_status, new_status, changed_by, reason)
  values (p_profile_id, v_profile.account_status, 'approved', v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('volunteer_profile.approve', 'volunteer_profile', p_profile_id, null, jsonb_build_object('previous_status', v_profile.account_status));

  return query select p_profile_id, 'approved'::text, 'approved'::text;
end;
$$;

create or replace function public.reject_volunteer_profile(p_profile_id uuid, p_reason text)
returns table(profile_id uuid, account_status text, onboarding_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_profile public.volunteer_profiles%rowtype;
begin
  if v_actor is null or not public.can_manage_volunteers() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_profile from public.volunteer_profiles where id = p_profile_id for update;

  if not found then
    raise exception 'Volunteer profile not found' using errcode = 'P0002';
  end if;

  if v_profile.id = v_actor then
    raise exception 'Self-rejection is not allowed' using errcode = '42501';
  end if;

  update public.volunteer_profiles
  set
    account_status = 'rejected',
    onboarding_status = 'rejected',
    rejected_at = now(),
    rejected_by = v_actor,
    rejection_reason = btrim(p_reason)
  where id = p_profile_id;

  insert into public.volunteer_status_history (volunteer_profile_id, previous_status, new_status, changed_by, reason)
  values (p_profile_id, v_profile.account_status, 'rejected', v_actor, btrim(p_reason));

  perform public.write_club_audit_log('volunteer_profile.reject', 'volunteer_profile', p_profile_id, null, jsonb_build_object('previous_status', v_profile.account_status));

  return query select p_profile_id, 'rejected'::text, 'rejected'::text;
end;
$$;

create or replace function public.suspend_volunteer_profile(p_profile_id uuid, p_reason text)
returns table(profile_id uuid, account_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_profile public.volunteer_profiles%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_profile from public.volunteer_profiles where id = p_profile_id for update;

  if not found then
    raise exception 'Volunteer profile not found' using errcode = 'P0002';
  end if;

  if v_profile.id = v_actor then
    raise exception 'Self-suspension is not allowed' using errcode = '42501';
  end if;

  update public.volunteer_profiles
  set account_status = 'suspended', suspended_at = now(), suspended_by = v_actor, suspension_reason = btrim(p_reason)
  where id = p_profile_id;

  insert into public.volunteer_status_history (volunteer_profile_id, previous_status, new_status, changed_by, reason)
  values (p_profile_id, v_profile.account_status, 'suspended', v_actor, btrim(p_reason));

  perform public.write_club_audit_log('volunteer_profile.suspend', 'volunteer_profile', p_profile_id, null, jsonb_build_object('previous_status', v_profile.account_status));

  return query select p_profile_id, 'suspended'::text;
end;
$$;

create or replace function public.restore_volunteer_profile(p_profile_id uuid, p_reason text)
returns table(profile_id uuid, account_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_profile public.volunteer_profiles%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_profile from public.volunteer_profiles where id = p_profile_id for update;

  if not found then
    raise exception 'Volunteer profile not found' using errcode = 'P0002';
  end if;

  if v_profile.account_status <> 'suspended' or v_profile.approved_at is null then
    raise exception 'Only previously approved suspended profiles can be restored' using errcode = '22023';
  end if;

  update public.volunteer_profiles
  set account_status = 'approved', suspended_at = null, suspended_by = null, suspension_reason = null
  where id = p_profile_id;

  insert into public.volunteer_status_history (volunteer_profile_id, previous_status, new_status, changed_by, reason)
  values (p_profile_id, v_profile.account_status, 'approved', v_actor, btrim(p_reason));

  perform public.write_club_audit_log('volunteer_profile.restore', 'volunteer_profile', p_profile_id, null, jsonb_build_object('previous_status', v_profile.account_status));

  return query select p_profile_id, 'approved'::text;
end;
$$;

create or replace function public.review_department_membership(
  p_membership_id uuid,
  p_status text,
  p_reason text default null
)
returns table(membership_id uuid, membership_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_membership public.volunteer_department_memberships%rowtype;
  v_profile public.volunteer_profiles%rowtype;
  v_can_manage boolean;
begin
  select * into v_membership
  from public.volunteer_department_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Department membership not found' using errcode = 'P0002';
  end if;

  v_can_manage := public.can_manage_volunteers()
    or public.has_active_department_role(v_membership.department_id, array['department_head']);

  if v_actor is null or not v_can_manage then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_membership.volunteer_profile_id = v_actor and p_status in ('approved', 'rejected', 'suspended', 'removed') then
    raise exception 'Self-action is not allowed' using errcode = '42501';
  end if;

  if p_status not in ('requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed') then
    raise exception 'Invalid membership status' using errcode = '22023';
  end if;

  if p_status in ('rejected', 'suspended', 'removed') and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_profile from public.volunteer_profiles where id = v_membership.volunteer_profile_id for update;

  if p_status = 'approved' and (v_profile.account_status <> 'approved' or v_profile.onboarding_status <> 'approved') then
    raise exception 'Volunteer profile must be approved first' using errcode = '22023';
  end if;

  if p_status = 'approved' and not exists (
    select 1 from public.club_departments
    where id = v_membership.department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Department is not active' using errcode = '22023';
  end if;

  update public.volunteer_department_memberships
  set
    membership_status = p_status,
    approved_at = case when p_status = 'approved' then now() else approved_at end,
    approved_by = case when p_status = 'approved' then v_actor else approved_by end,
    rejected_at = case when p_status = 'rejected' then now() else rejected_at end,
    rejected_by = case when p_status = 'rejected' then v_actor else rejected_by end,
    rejection_reason = case when p_status = 'rejected' then btrim(p_reason) else rejection_reason end,
    suspended_at = case when p_status = 'suspended' then now() else suspended_at end,
    suspended_by = case when p_status = 'suspended' then v_actor else suspended_by end,
    suspension_reason = case when p_status = 'suspended' then btrim(p_reason) else suspension_reason end,
    removed_at = case when p_status = 'removed' then now() else removed_at end,
    removed_by = case when p_status = 'removed' then v_actor else removed_by end,
    removal_reason = case when p_status = 'removed' then btrim(p_reason) else removal_reason end
  where id = p_membership_id;

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
    p_membership_id,
    v_membership.membership_status,
    p_status,
    v_membership.department_role,
    v_membership.department_role,
    v_actor,
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  perform public.write_club_audit_log(
    'department_membership.review',
    'department_membership',
    p_membership_id,
    v_membership.department_id,
    jsonb_build_object('previous_status', v_membership.membership_status, 'new_status', p_status)
  );

  return query select p_membership_id, p_status;
end;
$$;

create or replace function public.approve_department_membership(p_membership_id uuid, p_reason text default null)
returns table(membership_id uuid, membership_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.review_department_membership(p_membership_id, 'approved', p_reason)
$$;

create or replace function public.reject_department_membership(p_membership_id uuid, p_reason text)
returns table(membership_id uuid, membership_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.review_department_membership(p_membership_id, 'rejected', p_reason)
$$;

create or replace function public.suspend_department_membership(p_membership_id uuid, p_reason text)
returns table(membership_id uuid, membership_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.review_department_membership(p_membership_id, 'suspended', p_reason)
$$;

create or replace function public.remove_department_membership(p_membership_id uuid, p_reason text)
returns table(membership_id uuid, membership_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.review_department_membership(p_membership_id, 'removed', p_reason)
$$;

create or replace function public.change_department_role(
  p_membership_id uuid,
  p_department_role text,
  p_reason text
)
returns table(membership_id uuid, department_role text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_membership public.volunteer_department_memberships%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_department_role not in ('volunteer', 'coordinator', 'department_head') then
    raise exception 'Invalid department role' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null and p_department_role in ('coordinator', 'department_head') then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_membership
  from public.volunteer_department_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Department membership not found' using errcode = 'P0002';
  end if;

  if v_membership.volunteer_profile_id = v_actor then
    raise exception 'Self role changes are not allowed' using errcode = '42501';
  end if;

  if v_membership.membership_status <> 'approved' then
    raise exception 'Only approved memberships can change role' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.club_departments
    where id = v_membership.department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Department is not active' using errcode = '22023';
  end if;

  update public.volunteer_department_memberships
  set department_role = p_department_role
  where id = p_membership_id;

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
    p_membership_id,
    v_membership.membership_status,
    v_membership.membership_status,
    v_membership.department_role,
    p_department_role,
    v_actor,
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  perform public.write_club_audit_log('department_membership.role_change', 'department_membership', p_membership_id, v_membership.department_id, jsonb_build_object('previous_role', v_membership.department_role, 'new_role', p_department_role));

  return query select p_membership_id, p_department_role;
end;
$$;

create or replace function public.set_primary_department(p_membership_id uuid, p_reason text default null)
returns table(profile_id uuid, primary_department_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_membership public.volunteer_department_memberships%rowtype;
begin
  if v_actor is null or not public.can_manage_volunteers() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_membership
  from public.volunteer_department_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Department membership not found' using errcode = 'P0002';
  end if;

  if v_membership.membership_status <> 'approved' then
    raise exception 'Primary department must be an approved membership' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.club_departments
    where id = v_membership.department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Department is not active' using errcode = '22023';
  end if;

  update public.volunteer_department_memberships
  set is_primary = false
  where volunteer_profile_id = v_membership.volunteer_profile_id
    and id <> v_membership.id
    and membership_status = 'approved';

  update public.volunteer_department_memberships
  set is_primary = true
  where id = v_membership.id;

  update public.volunteer_profiles
  set primary_department_id = v_membership.department_id
  where id = v_membership.volunteer_profile_id;

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
    p_membership_id,
    v_membership.membership_status,
    v_membership.membership_status,
    v_membership.department_role,
    v_membership.department_role,
    v_actor,
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  perform public.write_club_audit_log('department_membership.set_primary', 'department_membership', p_membership_id, v_membership.department_id, '{}'::jsonb);

  return query select v_membership.volunteer_profile_id, v_membership.department_id;
end;
$$;

create or replace function public.assign_platform_role(
  p_profile_id uuid,
  p_role text,
  p_reason text
)
returns table(profile_id uuid, role text, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
begin
  if v_actor is null or not public.can_manage_platform_roles() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_role not in ('super_admin', 'club_admin', 'membership_admin', 'content_admin', 'department_admin') then
    raise exception 'Invalid platform role' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  if p_profile_id = v_actor then
    raise exception 'Self-escalation is not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.volunteer_profiles
    where id = p_profile_id
      and account_status = 'approved'
      and onboarding_status = 'approved'
      and archived_at is null
  ) then
    raise exception 'Target profile must be approved' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.volunteer_platform_roles
    where volunteer_profile_id = p_profile_id
      and role = p_role
      and status = 'active'
  ) then
    raise exception 'Role is already active' using errcode = '23505';
  end if;

  insert into public.volunteer_platform_roles (volunteer_profile_id, role, status, assigned_by)
  values (p_profile_id, p_role, 'active', v_actor);

  perform public.write_club_audit_log('platform_role.assign', 'volunteer_profile', p_profile_id, null, jsonb_build_object('role', p_role));

  return query select p_profile_id, p_role, 'active'::text;
end;
$$;

create or replace function public.revoke_platform_role(
  p_platform_role_id uuid,
  p_reason text
)
returns table(platform_role_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_role public.volunteer_platform_roles%rowtype;
  v_active_super_admin_count integer;
begin
  if v_actor is null or not public.can_manage_platform_roles() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_role from public.volunteer_platform_roles where id = p_platform_role_id for update;

  if not found then
    raise exception 'Platform role not found' using errcode = 'P0002';
  end if;

  if v_role.volunteer_profile_id = v_actor then
    raise exception 'Self role revocation is not allowed' using errcode = '42501';
  end if;

  if v_role.role = 'super_admin' and v_role.status = 'active' then
    select count(*) into v_active_super_admin_count
    from public.volunteer_platform_roles
    where role = 'super_admin'
      and status = 'active';

    if v_active_super_admin_count <= 1 then
      raise exception 'Cannot revoke the final active super admin' using errcode = '42501';
    end if;
  end if;

  update public.volunteer_platform_roles
  set status = 'revoked', revoked_by = v_actor, revoked_at = now(), revocation_reason = btrim(p_reason)
  where id = p_platform_role_id;

  perform public.write_club_audit_log('platform_role.revoke', 'volunteer_profile', v_role.volunteer_profile_id, null, jsonb_build_object('role', v_role.role));

  return query select p_platform_role_id, 'revoked'::text;
end;
$$;

create or replace function public.create_club_department(
  p_name text,
  p_slug text,
  p_short_description text default null,
  p_display_order integer default 0
)
returns table(department_id uuid, slug text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_department public.club_departments%rowtype;
  v_slug text := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_actor is null or not public.can_manage_departments() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  if nullif(btrim(coalesce(p_name, '')), '') is null or nullif(v_slug, '') is null then
    raise exception 'Department name and slug are required' using errcode = '22023';
  end if;

  insert into public.club_departments (name, slug, short_description, display_order, status)
  values (btrim(p_name), v_slug, nullif(btrim(coalesce(p_short_description, '')), ''), greatest(coalesce(p_display_order, 0), 0), 'active')
  returning * into v_department;

  perform public.write_club_audit_log('club_department.create', 'club_department', v_department.id, v_department.id, jsonb_build_object('slug', v_department.slug));

  return query select v_department.id, v_department.slug;
end;
$$;

create or replace function public.update_club_department(
  p_department_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_status text,
  p_display_order integer,
  p_reason text default null
)
returns table(department_id uuid, slug text, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_department public.club_departments%rowtype;
  v_slug text := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_actor is null or not public.can_manage_departments() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_status not in ('active', 'inactive') then
    raise exception 'Invalid department status for update' using errcode = '22023';
  end if;

  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  select * into v_department from public.club_departments where id = p_department_id for update;

  if not found then
    raise exception 'Department not found' using errcode = 'P0002';
  end if;

  if v_department.status = 'archived' then
    raise exception 'Archived departments cannot be edited' using errcode = '22023';
  end if;

  update public.club_departments
  set
    name = btrim(p_name),
    slug = v_slug,
    short_description = nullif(btrim(coalesce(p_short_description, '')), ''),
    status = p_status,
    display_order = greatest(coalesce(p_display_order, 0), 0)
  where id = p_department_id;

  perform public.write_club_audit_log('club_department.update', 'club_department', p_department_id, p_department_id, jsonb_build_object('previous_slug', v_department.slug, 'new_slug', v_slug, 'reason', nullif(btrim(coalesce(p_reason, '')), '')));

  return query select p_department_id, v_slug, p_status;
end;
$$;

create or replace function public.archive_club_department(p_department_id uuid, p_reason text)
returns table(department_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_department public.club_departments%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_department from public.club_departments where id = p_department_id for update;

  if not found then
    raise exception 'Department not found' using errcode = 'P0002';
  end if;

  update public.club_departments
  set status = 'archived', archived_at = coalesce(archived_at, now())
  where id = p_department_id;

  perform public.write_club_audit_log('club_department.archive', 'club_department', p_department_id, p_department_id, jsonb_build_object('previous_status', v_department.status, 'reason', btrim(p_reason)));

  return query select p_department_id, 'archived'::text;
end;
$$;

revoke all on function public.review_membership_application(uuid, text, text, text) from public;
revoke all on function public.approve_volunteer_profile(uuid, text) from public;
revoke all on function public.reject_volunteer_profile(uuid, text) from public;
revoke all on function public.suspend_volunteer_profile(uuid, text) from public;
revoke all on function public.restore_volunteer_profile(uuid, text) from public;
revoke all on function public.review_department_membership(uuid, text, text) from public;
revoke all on function public.approve_department_membership(uuid, text) from public;
revoke all on function public.reject_department_membership(uuid, text) from public;
revoke all on function public.suspend_department_membership(uuid, text) from public;
revoke all on function public.remove_department_membership(uuid, text) from public;
revoke all on function public.change_department_role(uuid, text, text) from public;
revoke all on function public.set_primary_department(uuid, text) from public;
revoke all on function public.assign_platform_role(uuid, text, text) from public;
revoke all on function public.revoke_platform_role(uuid, text) from public;
revoke all on function public.create_club_department(text, text, text, integer) from public;
revoke all on function public.update_club_department(uuid, text, text, text, text, integer, text) from public;
revoke all on function public.archive_club_department(uuid, text) from public;

grant execute on function public.review_membership_application(uuid, text, text, text) to authenticated;
grant execute on function public.approve_volunteer_profile(uuid, text) to authenticated;
grant execute on function public.reject_volunteer_profile(uuid, text) to authenticated;
grant execute on function public.suspend_volunteer_profile(uuid, text) to authenticated;
grant execute on function public.restore_volunteer_profile(uuid, text) to authenticated;
grant execute on function public.review_department_membership(uuid, text, text) to authenticated;
grant execute on function public.approve_department_membership(uuid, text) to authenticated;
grant execute on function public.reject_department_membership(uuid, text) to authenticated;
grant execute on function public.suspend_department_membership(uuid, text) to authenticated;
grant execute on function public.remove_department_membership(uuid, text) to authenticated;
grant execute on function public.change_department_role(uuid, text, text) to authenticated;
grant execute on function public.set_primary_department(uuid, text) to authenticated;
grant execute on function public.assign_platform_role(uuid, text, text) to authenticated;
grant execute on function public.revoke_platform_role(uuid, text) to authenticated;
grant execute on function public.create_club_department(text, text, text, integer) to authenticated;
grant execute on function public.update_club_department(uuid, text, text, text, text, integer, text) to authenticated;
grant execute on function public.archive_club_department(uuid, text) to authenticated;
