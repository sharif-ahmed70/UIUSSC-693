-- NC-1 notification integrations for existing workflows.

create or replace function public.assign_event_task_member(
  p_task_id uuid,
  p_volunteer_profile_id uuid,
  p_assignment_role text default 'contributor'
)
returns table(task_assignee_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_assignee public.event_task_assignees%rowtype;
  v_previous_status text;
  v_event_title text;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed tasks cannot receive assignees' using errcode = '22023';
  end if;
  if not (public.cm5b_has_task_permission('tasks.assign', v_task.event_id, v_task.department_id) or public.cm5b_is_department_task_manager(v_task.department_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  perform public.cm5b_assert_active_department_member(p_volunteer_profile_id, v_task.department_id);

  insert into public.event_task_assignees (task_id, volunteer_profile_id, assignment_role, assigned_by)
  values (p_task_id, p_volunteer_profile_id, coalesce(p_assignment_role, 'contributor'), v_actor)
  returning * into v_assignee;

  insert into public.event_task_assignee_history (task_assignee_id, task_id, volunteer_profile_id, previous_status, new_status, previous_role, new_role, actor_profile_id, reason)
  values (v_assignee.id, v_assignee.task_id, v_assignee.volunteer_profile_id, null, v_assignee.assignment_status, null, v_assignee.assignment_role, v_actor, 'Task member assigned');

  if v_task.task_status = 'draft' then
    v_previous_status := v_task.task_status;
    update public.event_department_tasks
    set task_status = 'assigned', updated_by = v_actor
    where id = v_task.id
    returning * into v_task;

    insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason)
    values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_status, v_task.task_status, 0, v_task.progress_percent, v_actor, 'First active assignee added');
  end if;

  select title into v_event_title from public.events where id = v_task.event_id;

  perform public.send_notification(
    p_volunteer_profile_id,
    'New Task Assigned',
    format('You have been assigned %s task for %s.', v_task.title, coalesce(v_event_title, 'an event')),
    'TASK',
    case v_task.priority when 'urgent' then 'HIGH' when 'high' then 'HIGH' else 'NORMAL' end,
    'event_task',
    v_task.id,
    '/staff/tasks/' || v_task.id::text
  );

  perform public.write_club_audit_log('tasks.assign_member', 'event_task_assignee', v_assignee.id, v_task.department_id, jsonb_build_object('task_id', v_task.id, 'role', v_assignee.assignment_role));
  return query select v_assignee.id, v_assignee.assignment_status;
end;
$$;

create or replace function public.create_approval_request(
  p_action_key text,
  p_target_type text,
  p_target_id uuid,
  p_scope_type text,
  p_department_id uuid,
  p_event_id uuid,
  p_request_payload jsonb,
  p_reason text
)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
  v_approver uuid;
begin
  if v_actor is null or not public.has_effective_permission('approval_requests.create', coalesce(p_scope_type, 'global'), coalesce(p_department_id, p_event_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not public.cm4_is_supported_approval_action(p_action_key) then
    raise exception 'Unsupported approval action' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    action_key, requester_profile_id, target_type, target_id, scope_type, department_id, event_id, request_payload, reason, expires_at
  )
  values (
    p_action_key, v_actor, btrim(p_target_type), p_target_id, coalesce(p_scope_type, 'global'), p_department_id, p_event_id,
    coalesce(p_request_payload, '{}'::jsonb), btrim(p_reason), now() + interval '14 days'
  )
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, 'created', v_actor, p_reason);

  for v_approver in
    select distinct profile_id
    from (
      select volunteer_profile_id as profile_id
      from public.volunteer_platform_roles
      where role = 'super_admin' and status = 'active'
      union
      select vcp.volunteer_profile_id
      from public.volunteer_club_positions vcp
      join public.club_positions cp on cp.id = vcp.club_position_id
      where cp.slug = 'president' and vcp.status = 'active'
    ) approvers
    where profile_id <> v_actor
  loop
    perform public.send_notification(
      v_approver,
      'Approval Required',
      'A leadership or access request needs your review.',
      'APPROVAL',
      'HIGH',
      'approval_request',
      v_request.id,
      '/admin/approval-requests'
    );
  end loop;

  perform public.write_club_audit_log('approval_request.create', 'approval_request', v_request.id, p_department_id, jsonb_build_object('action_key', p_action_key));
  return query select v_request.id, v_request.request_status;
end;
$$;

create or replace function public.review_approval_request(p_request_id uuid, p_decision text, p_reason text)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
  v_status text;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;

  if not public.can_review_approval_request(p_request_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if v_request.expires_at is not null and v_request.expires_at <= now() then
    update public.approval_requests set request_status = 'expired' where id = p_request_id returning * into v_request;
    raise exception 'Approval request expired' using errcode = '22023';
  end if;

  v_status := p_decision;
  update public.approval_requests
  set request_status = v_status, reviewed_by = v_actor, reviewed_at = now(), review_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = p_request_id
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, v_status, v_actor, p_reason);

  perform public.send_notification(
    v_request.requester_profile_id,
    'Approval Completed',
    case v_status when 'approved' then 'Your request has been approved.' else 'Your request has been rejected.' end,
    'APPROVAL',
    case v_status when 'approved' then 'NORMAL' else 'HIGH' end,
    'approval_request',
    v_request.id,
    '/admin/approval-requests'
  );

  perform public.write_club_audit_log('approval_request.review', 'approval_request', v_request.id, v_request.department_id, jsonb_build_object('action_key', v_request.action_key, 'decision', v_status));
  return query select v_request.id, v_request.request_status;
end;
$$;

create or replace function public.assign_committee_member(
  p_committee_id uuid,
  p_profile_id uuid,
  p_position_id uuid,
  p_start_date date default current_date,
  p_reason text default null
)
returns table(committee_membership_id uuid, position_assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_committee public.committees%rowtype;
  v_position public.club_positions%rowtype;
  v_assignment_id uuid;
  v_membership public.committee_memberships%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_is_primary boolean := true;
begin
  if v_actor is null or not public.can_manage_committees() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_profile_id = v_actor then raise exception 'Self leadership assignment is not allowed' using errcode = '42501'; end if;

  select * into v_committee from public.committees where id = p_committee_id for update;
  if not found then raise exception 'Committee not found' using errcode = 'P0002'; end if;
  if v_committee.status not in ('draft', 'active') then raise exception 'Only draft or active committees can receive members' using errcode = '22023'; end if;

  select * into v_position from public.club_positions where id = p_position_id and status = 'active' and archived_at is null for update;
  if not found then raise exception 'Position must be active' using errcode = '22023'; end if;

  v_is_primary := v_position.is_core_panel or v_position.slug like 'head-%' or v_position.slug in ('treasurer');

  if v_is_primary and exists (
    select 1 from public.committee_memberships
    where committee_id = p_committee_id and club_position_id = p_position_id and status = 'active'
  ) then
    raise exception 'This position already has an active committee member' using errcode = '23505';
  end if;

  select assigned.assignment_id into v_assignment_id
  from public.assign_club_position(p_profile_id, p_position_id, v_is_primary, coalesce(p_start_date, current_date), coalesce(v_reason, 'Assigned through committee management')) assigned;

  insert into public.committee_memberships (
    committee_id, volunteer_profile_id, club_position_id, volunteer_club_position_id, is_primary_position, assigned_date, assigned_by, start_date, status, reason
  )
  values (p_committee_id, p_profile_id, p_position_id, v_assignment_id, v_is_primary, current_date, v_actor, coalesce(p_start_date, current_date), 'active', v_reason)
  returning * into v_membership;

  perform public.send_notification(
    p_profile_id,
    'Committee Role Assigned',
    format('You have been selected as %s for %s.', v_position.name, v_committee.name),
    'COMMITTEE',
    case when v_is_primary then 'HIGH' else 'NORMAL' end,
    'committee',
    p_committee_id,
    '/about/team'
  );

  perform public.write_club_audit_log('COMMITTEE_MEMBER_ASSIGNED', 'committee', p_committee_id, null, jsonb_build_object('committee_member', v_membership.id, 'target_volunteer', p_profile_id, 'new_position', p_position_id, 'position_assignment', v_assignment_id, 'reason', v_reason));
  perform public.write_club_audit_log('LEADERSHIP_CHANGED', 'volunteer_profile', p_profile_id, null, jsonb_build_object('committee', p_committee_id, 'new_position', p_position_id, 'reason', v_reason));
  return query select v_membership.id, v_assignment_id, v_membership.status;
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
  v_request public.blood_requests%rowtype;
begin
  if v_actor is null or not public.can_assign_blood_executives() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id and request_status not in ('fulfilled', 'cancelled', 'rejected', 'expired', 'archived');
  if not found then raise exception 'Blood request is not assignable' using errcode = '22023'; end if;
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
  do update set reason = coalesce(excluded.reason, public.blood_request_assignments.reason), action_label = excluded.action_label, due_at = excluded.due_at
  returning * into v_assignment;

  perform public.send_notification(
    p_profile_id,
    'Blood Request Assigned',
    format('You have been assigned to %s for a %s blood request.', v_assignment.action_label, v_request.blood_group),
    'BLOOD',
    case v_request.priority when 'critical' then 'URGENT' when 'urgent' then 'HIGH' else 'NORMAL' end,
    'blood_request',
    p_request_id,
    '/staff/blood/requests/' || p_request_id::text
  );

  perform public.write_club_audit_log('BLOOD_EXECUTIVE_ASSIGNED', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('assignee_profile_id', p_profile_id, 'action', v_assignment.action_label));
  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.create_blood_match(p_request_id uuid, p_donor_id uuid, p_notes text default null)
returns table(match_id uuid, match_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_request public.blood_requests%rowtype; v_match public.blood_matches%rowtype; v_recipient uuid;
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

  for v_recipient in
    select distinct volunteer_profile_id
    from public.volunteer_department_memberships
    where department_id = public.blood_department_id()
      and department_role in ('department_head', 'deputy_head')
      and membership_status = 'approved'
      and removed_at is null
  loop
    perform public.send_notification(
      v_recipient,
      'Donor Match Found',
      format('A potential donor match was found for %s blood request.', v_request.blood_group),
      'BLOOD',
      'HIGH',
      'blood_match',
      v_match.id,
      '/staff/blood/requests/' || p_request_id::text
    );
  end loop;

  perform public.write_club_audit_log('DONOR_MATCH_FOUND', 'blood_match', v_match.id, public.blood_department_id(), jsonb_build_object('request_id', p_request_id, 'donor_profile_id', p_donor_id));
  return query select v_match.id, v_match.match_status;
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
  v_recipient uuid;
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

  if v_priority = 'critical' then
    for v_recipient in
      select distinct volunteer_profile_id
      from public.volunteer_department_memberships
      where department_id = public.blood_department_id()
        and department_role in ('department_head', 'deputy_head')
        and membership_status = 'approved'
        and removed_at is null
    loop
      perform public.send_notification(
        v_recipient,
        'Critical Blood Request',
        format('Critical %s blood request requires attention.', v_request.blood_group),
        'BLOOD',
        'URGENT',
        'blood_request',
        v_request.id,
        '/staff/blood/requests/' || v_request.id::text
      );
    end loop;
  end if;

  perform public.write_club_audit_log('BLOOD_REQUEST_CREATED', 'blood_request', v_request.id, public.blood_department_id(), jsonb_build_object('public_reference_code', v_request.public_reference_code, 'priority', v_priority));
  return query select v_request.id, v_request.public_reference_code, v_request.request_status;
end;
$$;

revoke all on function public.assign_event_task_member(uuid, uuid, text) from anon, public;
revoke all on function public.create_approval_request(text, text, uuid, text, uuid, uuid, jsonb, text) from anon, public;
revoke all on function public.review_approval_request(uuid, text, text) from anon, public;
revoke all on function public.assign_committee_member(uuid, uuid, uuid, date, text) from anon, public;
revoke all on function public.assign_blood_request_executive(uuid, uuid, text, text, timestamptz) from anon, public;
revoke all on function public.create_blood_match(uuid, uuid, text) from anon, public;

grant execute on function public.assign_event_task_member(uuid, uuid, text) to authenticated;
grant execute on function public.create_approval_request(text, text, uuid, text, uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.review_approval_request(uuid, text, text) to authenticated;
grant execute on function public.assign_committee_member(uuid, uuid, uuid, date, text) to authenticated;
grant execute on function public.assign_blood_request_executive(uuid, uuid, text, text, timestamptz) to authenticated;
grant execute on function public.create_blood_match(uuid, uuid, text) to authenticated;
grant execute on function public.submit_public_blood_request(text, text, text, text, integer, timestamptz, text, text, text, text, text, text) to anon, authenticated;
