-- BB-2: Blood Support operational management.
-- Extends BB-1 without duplicating donor/request/contact/history tables.

insert into public.system_permissions (
  permission_key,
  module_key,
  name,
  description,
  risk_level,
  supports_global_scope,
  supports_department_scope,
  supports_event_scope,
  supports_record_scope
)
values
  ('blood.manage_matches', 'blood', 'Manage blood donor matching', 'Create and update potential donor matches through human-reviewed workflow.', 'sensitive', true, true, false, true),
  ('blood.assign_executives', 'blood', 'Assign Blood executives', 'Assign Blood Department executives to specific request follow-up work.', 'sensitive', true, true, false, true)
on conflict (permission_key) do update set
  module_key = excluded.module_key,
  name = excluded.name,
  description = excluded.description,
  risk_level = excluded.risk_level,
  supports_global_scope = excluded.supports_global_scope,
  supports_department_scope = excluded.supports_department_scope,
  supports_event_scope = excluded.supports_event_scope,
  supports_record_scope = excluded.supports_record_scope,
  is_active = true;

alter table public.platform_role_permission_policies
drop constraint if exists platform_role_permission_scope_check;
alter table public.platform_role_permission_policies
add constraint platform_role_permission_scope_check check (scope_rule in ('global', 'own_department', 'assigned_event', 'assigned_record', 'own_record'));

alter table public.club_position_permission_policies
drop constraint if exists club_position_permission_scope_check;
alter table public.club_position_permission_policies
add constraint club_position_permission_scope_check check (scope_rule in ('global', 'own_department', 'assigned_event', 'assigned_record', 'own_record'));

alter table public.department_role_permission_policies
drop constraint if exists department_role_permission_scope_check;
alter table public.department_role_permission_policies
add constraint department_role_permission_scope_check check (scope_rule in ('own_department', 'assigned_event', 'assigned_record', 'own_record'));

insert into public.department_role_permission_policies (department_role, permission_id, effect, scope_rule)
select role_name, permission.id, 'allow', scope_rule
from (
  values
    ('department_head', 'blood.view', 'own_department'),
    ('department_head', 'blood.manage_requests', 'own_department'),
    ('department_head', 'blood.manage_donors', 'own_department'),
    ('department_head', 'blood.manage_matches', 'own_department'),
    ('department_head', 'blood.assign_executives', 'own_department'),
    ('department_head', 'blood.verify_donation', 'own_department'),
    ('deputy_head', 'blood.view', 'own_department'),
    ('deputy_head', 'blood.manage_requests', 'own_department'),
    ('deputy_head', 'blood.manage_matches', 'own_department'),
    ('executive', 'blood.view', 'assigned_record')
) matrix(role_name, permission_key, scope_rule)
join public.system_permissions permission on permission.permission_key = matrix.permission_key
on conflict do nothing;

insert into public.club_position_permission_policies (club_position_slug, permission_id, effect, scope_rule)
select position_slug, permission.id, 'allow', scope_rule
from (
  values
    ('president', 'blood.view', 'global'),
    ('vice-president', 'blood.view', 'global'),
    ('assistant-vice-president', 'blood.view', 'global'),
    ('general-secretary', 'blood.view', 'global'),
    ('head-blood', 'blood.view', 'own_department'),
    ('head-blood', 'blood.manage_requests', 'own_department'),
    ('head-blood', 'blood.manage_donors', 'own_department'),
    ('head-blood', 'blood.manage_matches', 'own_department'),
    ('head-blood', 'blood.assign_executives', 'own_department'),
    ('head-blood', 'blood.verify_donation', 'own_department'),
    ('executive-member-blood', 'blood.view', 'assigned_record')
) matrix(position_slug, permission_key, scope_rule)
join public.system_permissions permission on permission.permission_key = matrix.permission_key
on conflict do nothing;

create table if not exists public.blood_request_assignments (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  assignment_status text not null default 'active',
  assigned_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  ended_by uuid references public.volunteer_profiles(id) on delete set null,
  ended_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_request_assignments_status_check check (assignment_status in ('active', 'ended', 'revoked'))
);

create unique index if not exists blood_request_assignments_one_active_idx
  on public.blood_request_assignments (blood_request_id, volunteer_profile_id)
  where assignment_status = 'active';
create index if not exists blood_request_assignments_request_idx on public.blood_request_assignments (blood_request_id);
create index if not exists blood_request_assignments_profile_idx on public.blood_request_assignments (volunteer_profile_id);

drop trigger if exists set_blood_request_assignments_updated_at on public.blood_request_assignments;
create trigger set_blood_request_assignments_updated_at
before update on public.blood_request_assignments
for each row execute function public.set_updated_at();

create or replace function public.is_assigned_blood_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.blood_request_assignments assignment
    where assignment.blood_request_id = p_request_id
      and assignment.volunteer_profile_id = public.current_volunteer_profile_id()
      and assignment.assignment_status = 'active'
  )
$$;

create or replace function public.permission_scope_matches(
  p_policy_scope text,
  p_requested_scope text,
  p_requested_id uuid,
  p_profile_id uuid,
  p_department_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if p_policy_scope = 'global' then
    return p_requested_scope = 'global' or p_requested_id is null;
  end if;

  if p_policy_scope = 'own_department' then
    return p_requested_scope = 'department'
      and p_requested_id is not null
      and p_department_id = p_requested_id;
  end if;

  if p_policy_scope = 'assigned_event' then
    return p_requested_scope = 'event'
      and p_requested_id is not null
      and (
        exists (select 1 from public.club_event_operations ceo where ceo.event_id = p_requested_id and ceo.owner_profile_id = p_profile_id)
        or exists (
          select 1
          from public.event_department_assignments eda
          where eda.event_id = p_requested_id
            and eda.assignment_status <> 'cancelled'
            and (eda.lead_profile_id = p_profile_id or (p_department_id is not null and eda.department_id = p_department_id))
        )
        or exists (
          select 1
          from public.event_task_assignees eta
          join public.event_department_tasks edt on edt.id = eta.task_id
          where edt.event_id = p_requested_id
            and eta.volunteer_profile_id = p_profile_id
            and eta.assignment_status = 'active'
        )
      );
  end if;

  if p_policy_scope in ('assigned_record', 'own_record') then
    return p_requested_scope = 'record'
      and p_requested_id is not null
      and (
        exists (
          select 1
          from public.event_task_assignees eta
          where eta.task_id = p_requested_id
            and eta.volunteer_profile_id = p_profile_id
            and eta.assignment_status = 'active'
        )
        or exists (
          select 1
          from public.blood_request_assignments assignment
          where assignment.blood_request_id = p_requested_id
            and assignment.volunteer_profile_id = p_profile_id
            and assignment.assignment_status = 'active'
        )
      );
  end if;

  return false;
end;
$$;

create or replace function public.can_view_blood_operations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.view', 'global', null)
    or public.has_effective_permission('blood.view', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.view', 'global', null)
    or public.has_effective_permission('blood.operations.view', 'department', public.blood_department_id())
$$;

create or replace function public.can_manage_blood_donors()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.manage_donors', 'global', null)
    or public.has_effective_permission('blood.manage_donors', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.manage', 'global', null)
    or public.has_effective_permission('blood.operations.manage', 'department', public.blood_department_id())
$$;

create or replace function public.can_manage_blood_requests()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.manage_requests', 'global', null)
    or public.has_effective_permission('blood.manage_requests', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.manage', 'global', null)
    or public.has_effective_permission('blood.operations.manage', 'department', public.blood_department_id())
$$;

create or replace function public.can_manage_blood_matches()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.manage_matches', 'global', null)
    or public.has_effective_permission('blood.manage_matches', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.manage_requests', 'global', null)
    or public.has_effective_permission('blood.manage_requests', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.manage', 'global', null)
    or public.has_effective_permission('blood.operations.manage', 'department', public.blood_department_id())
$$;

create or replace function public.can_assign_blood_executives()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.assign_executives', 'global', null)
    or public.has_effective_permission('blood.assign_executives', 'department', public.blood_department_id())
$$;

create or replace function public.can_verify_blood_donations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.verify_donation', 'global', null)
    or public.has_effective_permission('blood.verify_donation', 'department', public.blood_department_id())
$$;

create or replace function public.assign_blood_request_executive(p_request_id uuid, p_profile_id uuid, p_reason text default null)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.blood_request_assignments%rowtype;
begin
  if v_actor is null or not public.can_assign_blood_executives() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.blood_requests where id = p_request_id and request_status not in ('fulfilled', 'cancelled', 'rejected', 'expired', 'archived')) then
    raise exception 'Blood request is not assignable' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.volunteer_department_memberships membership
    where membership.volunteer_profile_id = p_profile_id
      and membership.department_id = public.blood_department_id()
      and membership.department_role = 'executive'
      and membership.membership_status = 'approved'
      and membership.removed_at is null
  ) then
    raise exception 'Volunteer is not an approved Blood executive' using errcode = '22023';
  end if;

  insert into public.blood_request_assignments (blood_request_id, volunteer_profile_id, assigned_by, reason)
  values (p_request_id, p_profile_id, v_actor, nullif(btrim(coalesce(p_reason, '')), ''))
  on conflict (blood_request_id, volunteer_profile_id) where assignment_status = 'active'
  do update set reason = coalesce(excluded.reason, public.blood_request_assignments.reason)
  returning * into v_assignment;

  perform public.write_club_audit_log('blood_request.assign_executive', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('assignee_profile_id', p_profile_id));
  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.submit_public_blood_request(
  p_requester_name text,
  p_phone text,
  p_email text,
  p_blood_group text,
  p_units_requested integer,
  p_needed_at timestamptz,
  p_hospital_name text,
  p_hospital_area text,
  p_district text,
  p_urgency text,
  p_patient_reference text default null,
  p_requester_relationship text default null
)
returns table(blood_request_id uuid, public_reference_code text, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_request public.blood_requests%rowtype;
  v_enabled boolean;
begin
  select coalesce((setting_value)::boolean, false) into v_enabled
  from public.blood_support_settings
  where setting_key = 'public_request_intake_enabled' and is_active = true;

  if not coalesce(v_enabled, false) then
    raise exception 'Public blood request intake is currently closed' using errcode = '42501';
  end if;

  if p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then raise exception 'Invalid blood group' using errcode = '22023'; end if;
  if p_units_requested < 1 or p_units_requested > 8 then raise exception 'Invalid unit count' using errcode = '22023'; end if;
  if p_urgency not in ('normal', 'urgent', 'emergency') then raise exception 'Invalid urgency' using errcode = '22023'; end if;

  insert into public.blood_requests (
    blood_group, units_requested, urgency, hospital_name, hospital_area, district, needed_at,
    request_status, patient_reference, requester_relationship, source
  )
  values (
    p_blood_group, p_units_requested, p_urgency, btrim(p_hospital_name), nullif(btrim(coalesce(p_hospital_area, '')), ''),
    nullif(btrim(coalesce(p_district, '')), ''), p_needed_at, 'submitted',
    nullif(btrim(coalesce(p_patient_reference, '')), ''), nullif(btrim(coalesce(p_requester_relationship, '')), ''), 'public_request'
  )
  returning * into v_request;

  insert into public.blood_request_contacts (
    blood_request_id, requester_name, phone, normalized_phone, email, normalized_email
  )
  values (
    v_request.id, btrim(p_requester_name), btrim(p_phone), regexp_replace(btrim(p_phone), '\D', '', 'g'),
    nullif(btrim(coalesce(p_email, '')), ''), lower(nullif(btrim(coalesce(p_email, '')), ''))
  );

  insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, reason, metadata)
  values (v_request.id, null, 'submitted', 'public blood request submitted', jsonb_build_object('event', 'BLOOD_REQUEST_CREATED'));
  perform public.write_club_audit_log('BLOOD_REQUEST_CREATED', 'blood_request', v_request.id, public.blood_department_id(), jsonb_build_object('public_reference_code', v_request.public_reference_code));
  return query select v_request.id, v_request.public_reference_code, v_request.request_status;
end;
$$;

create or replace function public.submit_public_blood_donor_interest(
  p_display_name text,
  p_phone text,
  p_email text,
  p_blood_group text,
  p_district text,
  p_area text,
  p_availability_status text,
  p_preferred_contact_method text default 'phone',
  p_self_reported_last_donation_date date default null
)
returns table(donor_profile_id uuid, verification_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_donor public.blood_donor_profiles%rowtype;
  v_enabled boolean;
begin
  select coalesce((setting_value)::boolean, false) into v_enabled
  from public.blood_support_settings
  where setting_key = 'public_donor_interest_enabled' and is_active = true;

  if not coalesce(v_enabled, false) then
    raise exception 'Public donor registration is currently closed' using errcode = '42501';
  end if;

  if p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then raise exception 'Invalid blood group' using errcode = '22023'; end if;
  if p_availability_status not in ('available', 'temporarily_unavailable', 'unavailable') then raise exception 'Invalid availability status' using errcode = '22023'; end if;
  if p_preferred_contact_method not in ('phone', 'sms', 'whatsapp', 'email') then raise exception 'Invalid contact method' using errcode = '22023'; end if;

  insert into public.blood_donor_profiles (
    display_name, blood_group, district, area, source, verification_status, availability_status,
    self_reported_last_donation_date, consent_to_contact, consent_recorded_at
  )
  values (
    btrim(p_display_name), p_blood_group, nullif(btrim(coalesce(p_district, '')), ''),
    nullif(btrim(coalesce(p_area, '')), ''), 'public_interest', 'pending_review', p_availability_status,
    p_self_reported_last_donation_date, true, now()
  )
  returning * into v_donor;

  insert into public.blood_donor_contacts (
    donor_profile_id, phone, normalized_phone, email, normalized_email, preferred_contact_method
  )
  values (
    v_donor.id, btrim(p_phone), regexp_replace(btrim(p_phone), '\D', '', 'g'),
    nullif(btrim(coalesce(p_email, '')), ''), lower(nullif(btrim(coalesce(p_email, '')), '')), p_preferred_contact_method
  );

  insert into public.blood_donor_status_history (donor_profile_id, previous_status, new_status, reason, metadata)
  values (v_donor.id, null, 'pending_review', 'public donor registration submitted', jsonb_build_object('event', 'DONOR_CONTACT_REQUIRED'));
  perform public.write_club_audit_log('DONOR_CONTACT_REQUIRED', 'blood_donor', v_donor.id, public.blood_department_id(), jsonb_build_object('source', 'public_interest'));
  return query select v_donor.id, v_donor.verification_status;
end;
$$;

alter table public.blood_request_assignments enable row level security;
revoke all on table public.blood_request_assignments from anon, authenticated;
grant select on table public.blood_request_assignments to authenticated;

drop policy if exists "Blood staff can read request assignments" on public.blood_request_assignments;
create policy "Blood staff can read request assignments" on public.blood_request_assignments
for select to authenticated
using (public.can_view_blood_operations() or volunteer_profile_id = public.current_volunteer_profile_id());

drop policy if exists "Blood admins can read requests" on public.blood_requests;
create policy "Blood staff can read scoped requests" on public.blood_requests
for select to authenticated
using (public.can_view_blood_operations() or public.is_assigned_blood_request(id));

drop policy if exists "Blood admins can read matches" on public.blood_matches;
create policy "Blood staff can read scoped matches" on public.blood_matches
for select to authenticated
using (public.can_view_blood_operations() or public.is_assigned_blood_request(blood_request_id));

drop policy if exists "Blood admins can read donations" on public.blood_donations;
create policy "Blood staff can read scoped donations" on public.blood_donations
for select to authenticated
using (public.can_view_blood_operations() or public.is_assigned_blood_request(blood_request_id));

revoke all on function public.is_assigned_blood_request(uuid) from public;
revoke all on function public.can_assign_blood_executives() from public;
revoke all on function public.assign_blood_request_executive(uuid, uuid, text) from public;
revoke all on function public.submit_public_blood_request(text, text, text, text, integer, timestamptz, text, text, text, text, text, text) from public;
revoke all on function public.submit_public_blood_donor_interest(text, text, text, text, text, text, text, text, date) from public;

grant execute on function public.is_assigned_blood_request(uuid) to authenticated;
grant execute on function public.can_assign_blood_executives() to authenticated;
grant execute on function public.assign_blood_request_executive(uuid, uuid, text) to authenticated;
grant execute on function public.submit_public_blood_request(text, text, text, text, integer, timestamptz, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_public_blood_donor_interest(text, text, text, text, text, text, text, text, date) to anon, authenticated;

select public.write_club_audit_log(
  'blood_support.bb2_operational_management_seeded',
  'blood_support',
  null,
  public.blood_department_id(),
  jsonb_build_object('phase', 'BB-2', 'separate_blood_roles_created', false)
);
