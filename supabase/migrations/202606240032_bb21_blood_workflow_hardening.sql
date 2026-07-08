-- BB-2.1: Blood Support workflow hardening and user-facing operational clarity.
-- Additive migration. Does not duplicate BB-1/BB-2 tables.

alter table public.blood_requests
add column if not exists priority text not null default 'normal';

alter table public.blood_requests
drop constraint if exists blood_requests_priority_check;
alter table public.blood_requests
add constraint blood_requests_priority_check check (priority in ('normal', 'urgent', 'critical'));

update public.blood_requests
set priority = case urgency when 'emergency' then 'critical' when 'urgent' then 'urgent' else 'normal' end
where priority = 'normal';

create table if not exists public.blood_request_priority_history (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete restrict,
  previous_priority text,
  new_priority text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint blood_request_priority_history_priority_check check (
    (previous_priority is null or previous_priority in ('normal', 'urgent', 'critical'))
    and new_priority in ('normal', 'urgent', 'critical')
  )
);

create table if not exists public.blood_donor_availability_history (
  id uuid primary key default gen_random_uuid(),
  donor_profile_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint blood_donor_availability_history_status_check check (
    (previous_status is null or previous_status in ('unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact'))
    and new_status in ('unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact')
  )
);

alter table public.blood_request_assignments
add column if not exists action_label text not null default 'Follow up blood request',
add column if not exists due_at timestamptz,
add column if not exists completed_at timestamptz,
add column if not exists completion_note text;

create index if not exists blood_requests_priority_needed_idx on public.blood_requests (priority, needed_at);
create index if not exists blood_request_priority_history_request_idx on public.blood_request_priority_history (blood_request_id, changed_at desc);
create index if not exists blood_donor_availability_history_donor_idx on public.blood_donor_availability_history (donor_profile_id, changed_at desc);
create index if not exists blood_request_assignments_due_idx on public.blood_request_assignments (due_at) where due_at is not null and assignment_status = 'active';

create or replace function public.change_blood_request_priority(p_request_id uuid, p_new_priority text, p_reason text)
returns table(blood_request_id uuid, priority text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.blood_requests%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_requests() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_new_priority not in ('normal', 'urgent', 'critical') then
    raise exception 'Invalid priority' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;

  update public.blood_requests
  set priority = p_new_priority,
      urgency = case p_new_priority when 'critical' then 'emergency' when 'urgent' then 'urgent' else 'normal' end
  where id = p_request_id;

  if v_request.priority is distinct from p_new_priority then
    insert into public.blood_request_priority_history (blood_request_id, previous_priority, new_priority, changed_by, reason)
    values (p_request_id, v_request.priority, p_new_priority, v_actor, btrim(p_reason));
  end if;

  perform public.write_club_audit_log('BLOOD_PRIORITY_CHANGED', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('from', v_request.priority, 'to', p_new_priority));
  return query select p_request_id, p_new_priority;
end;
$$;

create or replace function public.review_blood_request(p_request_id uuid, p_new_status text, p_reason text default null)
returns table(blood_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.blood_requests%rowtype;
  v_action text;
begin
  if v_actor is null or not public.can_manage_blood_requests() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  if p_new_status not in ('under_review', 'approved', 'rejected') then raise exception 'Invalid review status' using errcode = '22023'; end if;
  if p_new_status = 'under_review' and v_request.request_status <> 'submitted' then raise exception 'Invalid request transition' using errcode = '22023'; end if;
  if p_new_status in ('approved', 'rejected') and v_request.request_status not in ('submitted', 'under_review') then raise exception 'Invalid request transition' using errcode = '22023'; end if;
  if p_new_status = 'rejected' and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;

  update public.blood_requests
  set request_status = p_new_status,
      reviewed_by = v_actor,
      reviewed_at = now(),
      rejection_reason = case when p_new_status = 'rejected' then btrim(p_reason) else null end
  where id = p_request_id;

  insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason)
  values (p_request_id, v_request.request_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  v_action := case p_new_status when 'approved' then 'BLOOD_REQUEST_VERIFIED' when 'rejected' then 'BLOOD_REQUEST_REJECTED' else 'blood_request.under_review' end;
  perform public.write_club_audit_log(v_action, 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_request_id, p_new_status;
end;
$$;

create or replace function public.change_blood_donor_availability(p_donor_id uuid, p_new_status text, p_reason text default null)
returns table(donor_profile_id uuid, availability_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_donor public.blood_donor_profiles%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_donors() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_new_status not in ('unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact') then raise exception 'Invalid availability status' using errcode = '22023'; end if;
  if p_new_status in ('temporarily_unavailable', 'unavailable', 'do_not_contact') and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;

  select * into v_donor from public.blood_donor_profiles where id = p_donor_id and archived_at is null for update;
  if not found then raise exception 'Potential donor not found' using errcode = 'P0002'; end if;

  update public.blood_donor_profiles set availability_status = p_new_status where id = p_donor_id;
  if v_donor.availability_status is distinct from p_new_status then
    insert into public.blood_donor_availability_history (donor_profile_id, previous_status, new_status, changed_by, reason)
    values (p_donor_id, v_donor.availability_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));
  end if;

  perform public.write_club_audit_log('DONOR_AVAILABILITY_CHANGED', 'blood_donor', p_donor_id, public.blood_department_id(), jsonb_build_object('from', v_donor.availability_status, 'to', p_new_status));
  return query select p_donor_id, p_new_status;
end;
$$;

create or replace function public.create_blood_match(p_request_id uuid, p_donor_id uuid, p_notes text default null)
returns table(match_id uuid, match_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_request public.blood_requests%rowtype; v_match public.blood_matches%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_matches() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  if v_request.request_status not in ('approved', 'matching', 'partially_fulfilled') then raise exception 'Request cannot accept new matches' using errcode = '22023'; end if;
  if not exists (select 1 from public.blood_donor_profiles where id = p_donor_id and verification_status = 'verified' and archived_at is null) then raise exception 'Potential donor is not verified for matching workflow' using errcode = '22023'; end if;
  insert into public.blood_matches (blood_request_id, donor_profile_id, match_status, suggested_by, notes)
  values (p_request_id, p_donor_id, 'suggested', v_actor, nullif(btrim(coalesce(p_notes, '')), ''))
  returning * into v_match;
  insert into public.blood_match_status_history (blood_match_id, previous_status, new_status, changed_by, reason)
  values (v_match.id, null, 'suggested', v_actor, 'Potential donor suggested after human review');
  if v_request.request_status = 'approved' then
    update public.blood_requests set request_status = 'matching' where id = p_request_id;
    insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason)
    values (p_request_id, v_request.request_status, 'matching', v_actor, 'Potential donor found');
  end if;
  perform public.write_club_audit_log('DONOR_MATCH_FOUND', 'blood_match', v_match.id, public.blood_department_id(), jsonb_build_object('request_id', p_request_id, 'donor_profile_id', p_donor_id));
  return query select v_match.id, v_match.match_status;
end;
$$;

create or replace function public.assign_blood_request_executive(
  p_request_id uuid,
  p_profile_id uuid,
  p_reason text default null,
  p_action_label text default 'Follow up blood request',
  p_due_at timestamptz default null
)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.blood_request_assignments%rowtype;
begin
  if v_actor is null or not public.can_assign_blood_executives() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not exists (select 1 from public.blood_requests where id = p_request_id and request_status not in ('fulfilled', 'cancelled', 'rejected', 'expired', 'archived')) then raise exception 'Blood request is not assignable' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.volunteer_department_memberships membership
    where membership.volunteer_profile_id = p_profile_id
      and membership.department_id = public.blood_department_id()
      and membership.department_role = 'executive'
      and membership.membership_status = 'approved'
      and membership.removed_at is null
  ) then raise exception 'Volunteer is not an approved Blood executive' using errcode = '22023'; end if;

  insert into public.blood_request_assignments (blood_request_id, volunteer_profile_id, assigned_by, reason, action_label, due_at)
  values (p_request_id, p_profile_id, v_actor, nullif(btrim(coalesce(p_reason, '')), ''), coalesce(nullif(btrim(p_action_label), ''), 'Follow up blood request'), p_due_at)
  on conflict (blood_request_id, volunteer_profile_id) where assignment_status = 'active'
  do update set
    reason = coalesce(excluded.reason, public.blood_request_assignments.reason),
    action_label = excluded.action_label,
    due_at = excluded.due_at
  returning * into v_assignment;

  perform public.write_club_audit_log('BLOOD_EXECUTIVE_ASSIGNED', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('assignee_profile_id', p_profile_id, 'action', v_assignment.action_label));
  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.complete_blood_request_assignment(p_assignment_id uuid, p_completion_note text default null)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.blood_request_assignments%rowtype;
begin
  select * into v_assignment from public.blood_request_assignments where id = p_assignment_id for update;
  if not found then raise exception 'Assigned action not found' using errcode = 'P0002'; end if;

  if v_actor is null or not (
    public.can_assign_blood_executives() or (v_assignment.volunteer_profile_id = v_actor and v_assignment.assignment_status = 'active')
  ) then raise exception 'Not authorized' using errcode = '42501'; end if;

  update public.blood_request_assignments
  set assignment_status = 'ended',
      ended_by = v_actor,
      ended_at = now(),
      completed_at = now(),
      completion_note = nullif(btrim(coalesce(p_completion_note, '')), '')
  where id = p_assignment_id;

  perform public.write_club_audit_log('BLOOD_ASSIGNED_ACTION_COMPLETED', 'blood_request_assignment', p_assignment_id, public.blood_department_id(), jsonb_build_object('request_id', v_assignment.blood_request_id));
  return query select p_assignment_id, 'ended'::text;
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
  v_priority text;
begin
  select coalesce((setting_value)::boolean, false) into v_enabled
  from public.blood_support_settings
  where setting_key = 'public_request_intake_enabled' and is_active = true;
  if not coalesce(v_enabled, false) then raise exception 'Public blood request intake is currently closed' using errcode = '42501'; end if;
  if p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then raise exception 'Invalid blood group' using errcode = '22023'; end if;
  if p_units_requested < 1 or p_units_requested > 8 then raise exception 'Invalid unit count' using errcode = '22023'; end if;
  if p_urgency not in ('normal', 'urgent', 'critical', 'emergency') then raise exception 'Invalid priority' using errcode = '22023'; end if;

  v_priority := case p_urgency when 'emergency' then 'critical' else p_urgency end;

  insert into public.blood_requests (
    blood_group, units_requested, urgency, priority, hospital_name, hospital_area, district, needed_at,
    request_status, patient_reference, requester_relationship, source
  )
  values (
    p_blood_group, p_units_requested, case v_priority when 'critical' then 'emergency' else v_priority end, v_priority,
    btrim(p_hospital_name), nullif(btrim(coalesce(p_hospital_area, '')), ''),
    nullif(btrim(coalesce(p_district, '')), ''), p_needed_at, 'submitted',
    nullif(btrim(coalesce(p_patient_reference, '')), ''), nullif(btrim(coalesce(p_requester_relationship, '')), ''), 'public_request'
  )
  returning * into v_request;

  insert into public.blood_request_contacts (blood_request_id, requester_name, phone, normalized_phone, email, normalized_email)
  values (v_request.id, btrim(p_requester_name), btrim(p_phone), regexp_replace(btrim(p_phone), '\D', '', 'g'), nullif(btrim(coalesce(p_email, '')), ''), lower(nullif(btrim(coalesce(p_email, '')), '')));

  insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, reason, metadata)
  values (v_request.id, null, 'submitted', 'Public blood request submitted', jsonb_build_object('event', 'BLOOD_REQUEST_CREATED'));
  perform public.write_club_audit_log('BLOOD_REQUEST_CREATED', 'blood_request', v_request.id, public.blood_department_id(), jsonb_build_object('public_reference_code', v_request.public_reference_code, 'priority', v_priority));
  return query select v_request.id, v_request.public_reference_code, v_request.request_status;
end;
$$;

revoke all on function public.change_blood_request_priority(uuid, text, text) from public;
revoke all on function public.complete_blood_request_assignment(uuid, text) from public;
revoke all on function public.assign_blood_request_executive(uuid, uuid, text, text, timestamptz) from public;
grant execute on function public.change_blood_request_priority(uuid, text, text) to authenticated;
grant execute on function public.complete_blood_request_assignment(uuid, text) to authenticated;
grant execute on function public.assign_blood_request_executive(uuid, uuid, text, text, timestamptz) to authenticated;
grant select on table public.blood_request_priority_history to authenticated;
grant select on table public.blood_donor_availability_history to authenticated;
alter table public.blood_request_priority_history enable row level security;
alter table public.blood_donor_availability_history enable row level security;

drop policy if exists "Blood staff can read request priority history" on public.blood_request_priority_history;
create policy "Blood staff can read request priority history" on public.blood_request_priority_history
for select to authenticated
using (public.can_view_blood_operations() or public.is_assigned_blood_request(blood_request_id));

drop policy if exists "Blood staff can read donor availability history" on public.blood_donor_availability_history;
create policy "Blood staff can read donor availability history" on public.blood_donor_availability_history
for select to authenticated
using (public.can_view_blood_operations());

select public.write_club_audit_log(
  'blood_support.bb21_workflow_hardening_seeded',
  'blood_support',
  null,
  public.blood_department_id(),
  jsonb_build_object('phase', 'BB-2.1', 'human_friendly_workflow', true)
);
