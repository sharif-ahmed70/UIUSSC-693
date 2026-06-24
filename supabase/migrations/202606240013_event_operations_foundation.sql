-- CM-5A: Event operations and department assignment foundation
-- Adds internal operational records beside the existing public events table.

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
  ('events.publish', 'events', 'Publish events', 'Publish operationally approved events to the public website.', 'sensitive', true, false, true, false),
  ('events.cancel', 'events', 'Cancel events', 'Cancel approved, published, or active events with an auditable reason.', 'sensitive', true, false, true, false),
  ('events.assign_departments', 'events', 'Assign event departments', 'Assign departments and leads to event operations.', 'sensitive', true, false, true, false)
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  risk_level = excluded.risk_level,
  supports_global_scope = excluded.supports_global_scope,
  supports_department_scope = excluded.supports_department_scope,
  supports_event_scope = excluded.supports_event_scope,
  supports_record_scope = excluded.supports_record_scope,
  updated_at = now();

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule)
select 'club_admin', sp.id, 'allow', 'global'
from public.system_permissions sp
where sp.permission_key in ('events.publish', 'events.assign_departments')
on conflict (platform_role, permission_id, scope_rule) where is_active = true
do update set effect = excluded.effect, is_active = true, updated_at = now();

insert into public.club_position_permission_policies (club_position_slug, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select role_slug, permission_id, 'allow', 'global', requires_approval, approval_policy_key
from (
  select 'president'::text as role_slug, sp.id as permission_id, false as requires_approval, null::text as approval_policy_key
  from public.system_permissions sp
  where sp.permission_key in ('events.create', 'events.update', 'events.publish', 'events.cancel', 'events.assign_departments')
  union all
  select 'vice-president', sp.id, case when sp.permission_key = 'events.cancel' then true else false end, case when sp.permission_key = 'events.cancel' then 'president_review' else null end
  from public.system_permissions sp
  where sp.permission_key in ('events.create', 'events.update', 'events.assign_departments', 'events.cancel')
  union all
  select 'general-secretary', sp.id, case when sp.permission_key = 'events.cancel' then true else false end, case when sp.permission_key = 'events.cancel' then 'president_review' else null end
  from public.system_permissions sp
  where sp.permission_key in ('events.create', 'events.update', 'events.assign_departments', 'events.cancel')
) policies
on conflict (club_position_slug, permission_id, scope_rule) where is_active = true
do update set
  effect = excluded.effect,
  requires_approval = excluded.requires_approval,
  approval_policy_key = excluded.approval_policy_key,
  is_active = true,
  updated_at = now();

insert into public.department_role_permission_policies (department_role, permission_id, effect, scope_rule)
select role_name, sp.id, 'allow', 'assigned_event'
from public.system_permissions sp
cross join (values ('department_head'), ('deputy_head'), ('executive')) roles(role_name)
where sp.permission_key = 'events.view_internal'
on conflict (department_role, permission_id, scope_rule) where is_active = true
do update set effect = excluded.effect, is_active = true, updated_at = now();

create table if not exists public.club_event_operations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete restrict,
  operational_status text not null default 'draft',
  owner_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  created_by uuid references public.volunteer_profiles(id) on delete set null,
  approved_by uuid references public.volunteer_profiles(id) on delete set null,
  approved_at timestamptz,
  internal_summary text,
  planning_start_at timestamptz,
  operational_deadline timestamptz,
  cancellation_reason text,
  cancelled_by uuid references public.volunteer_profiles(id) on delete set null,
  cancelled_at timestamptz,
  completed_by uuid references public.volunteer_profiles(id) on delete set null,
  completed_at timestamptz,
  archived_by uuid references public.volunteer_profiles(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_event_operations_status_check check (operational_status in ('draft', 'planning', 'awaiting_approval', 'approved', 'published', 'active', 'completed', 'cancelled', 'archived')),
  constraint club_event_operations_cancel_reason_check check (operational_status <> 'cancelled' or nullif(btrim(coalesce(cancellation_reason, '')), '') is not null)
);

create table if not exists public.event_department_assignments (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.club_event_operations(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  is_lead_department boolean not null default false,
  lead_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  assignment_title text not null,
  responsibility_brief text not null,
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  assignment_status text not null default 'assigned',
  accepted_by uuid references public.volunteer_profiles(id) on delete set null,
  accepted_at timestamptz,
  completed_by uuid references public.volunteer_profiles(id) on delete set null,
  completed_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid references public.volunteer_profiles(id) on delete set null,
  cancelled_at timestamptz,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_department_assignments_status_check check (assignment_status in ('assigned', 'acknowledged', 'in_progress', 'blocked', 'completed', 'cancelled')),
  constraint event_department_assignments_title_check check (btrim(assignment_title) <> ''),
  constraint event_department_assignments_brief_check check (btrim(responsibility_brief) <> ''),
  constraint event_department_assignments_cancel_reason_check check (assignment_status <> 'cancelled' or nullif(btrim(coalesce(cancellation_reason, '')), '') is not null),
  constraint event_department_assignments_block_reason_check check (assignment_status <> 'blocked' or nullif(btrim(coalesce(blocked_reason, '')), '') is not null)
);

create table if not exists public.club_event_operation_history (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.club_event_operations(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create table if not exists public.event_department_assignment_history (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.event_department_assignments(id) on delete restrict,
  operation_id uuid not null references public.club_event_operations(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create index if not exists club_event_operations_event_idx on public.club_event_operations (event_id);
create index if not exists club_event_operations_status_idx on public.club_event_operations (operational_status);
create index if not exists event_department_assignments_operation_idx on public.event_department_assignments (operation_id);
create index if not exists event_department_assignments_event_idx on public.event_department_assignments (event_id);
create index if not exists event_department_assignments_department_idx on public.event_department_assignments (department_id);
create index if not exists event_department_assignments_status_idx on public.event_department_assignments (assignment_status);
create unique index if not exists event_department_assignments_active_department_idx
  on public.event_department_assignments (event_id, department_id)
  where assignment_status <> 'cancelled';
create unique index if not exists event_department_assignments_one_active_lead_idx
  on public.event_department_assignments (event_id)
  where is_lead_department = true and assignment_status <> 'cancelled';
create index if not exists club_event_operation_history_operation_idx on public.club_event_operation_history (operation_id, changed_at desc);
create index if not exists event_department_assignment_history_assignment_idx on public.event_department_assignment_history (assignment_id, changed_at desc);

drop trigger if exists set_club_event_operations_updated_at on public.club_event_operations;
create trigger set_club_event_operations_updated_at
before update on public.club_event_operations
for each row execute function public.set_updated_at();

drop trigger if exists set_event_department_assignments_updated_at on public.event_department_assignments;
create trigger set_event_department_assignments_updated_at
before update on public.event_department_assignments
for each row execute function public.set_updated_at();

insert into public.club_event_operations (event_id, operational_status, internal_summary, created_at, updated_at)
select
  e.id,
  case
    when e.status = 'published' then 'published'
    when e.status = 'completed' then 'completed'
    when e.status = 'cancelled' then 'cancelled'
    when e.status = 'archived' then 'archived'
    else 'draft'
  end,
  null,
  coalesce(e.created_at, now()),
  coalesce(e.updated_at, now())
from public.events e
on conflict (event_id) do nothing;

insert into public.club_event_operation_history (operation_id, event_id, previous_status, new_status, reason)
select ceo.id, ceo.event_id, null, ceo.operational_status, 'CM-5A backfill from existing public event'
from public.club_event_operations ceo
where not exists (
  select 1 from public.club_event_operation_history h where h.operation_id = ceo.id
);

create or replace function public.can_view_event_operation(p_event_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile uuid := public.current_volunteer_profile_id();
begin
  if v_profile is null then
    return false;
  end if;

  if public.has_effective_permission('events.view_internal', 'global', null)
     or public.has_effective_permission('events.view_internal', 'event', p_event_id) then
    return true;
  end if;

  return exists (
    select 1
    from public.event_department_assignments eda
    join public.volunteer_department_memberships vdm on vdm.department_id = eda.department_id
    where eda.event_id = p_event_id
      and eda.assignment_status <> 'cancelled'
      and vdm.volunteer_profile_id = v_profile
      and vdm.membership_status = 'approved'
      and vdm.department_role in ('department_head', 'deputy_head', 'executive')
  );
end;
$$;

create or replace function public.can_manage_event_department_assignment(p_assignment_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile uuid := public.current_volunteer_profile_id();
  v_assignment public.event_department_assignments%rowtype;
begin
  select * into v_assignment
  from public.event_department_assignments
  where id = p_assignment_id;

  if v_profile is null or not found then
    return false;
  end if;

  if public.has_effective_permission('events.assign_departments', 'global', null)
     or public.has_effective_permission('events.assign_departments', 'event', v_assignment.event_id) then
    return true;
  end if;

  return exists (
    select 1
    from public.volunteer_department_memberships vdm
    where vdm.volunteer_profile_id = v_profile
      and vdm.department_id = v_assignment.department_id
      and vdm.membership_status = 'approved'
      and vdm.department_role in ('department_head', 'deputy_head')
  );
end;
$$;

create or replace function public.cm5a_require_event_permission(p_permission_key text, p_event_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not (
    public.has_effective_permission(p_permission_key, 'global', null)
    or public.has_effective_permission(p_permission_key, 'event', p_event_id)
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_club_event(
  p_title text,
  p_slug text,
  p_summary text,
  p_description text,
  p_category text,
  p_event_date date,
  p_location text,
  p_start_time time default null,
  p_end_time time default null,
  p_capacity integer default null,
  p_registration_open boolean default false,
  p_volunteer_requirements text default null,
  p_internal_summary text default null
)
returns table(event_id uuid, operation_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_event public.events%rowtype;
  v_operation public.club_event_operations%rowtype;
begin
  if v_actor is null or not public.has_effective_permission('events.create', 'global', null) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.events (
    title, slug, summary, description, category, event_date, start_time, end_time,
    location, volunteer_requirements, capacity, registration_open, status
  )
  values (
    btrim(p_title), lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g')),
    btrim(p_summary), btrim(p_description), p_category, p_event_date, p_start_time, p_end_time,
    btrim(p_location), nullif(btrim(coalesce(p_volunteer_requirements, '')), ''), p_capacity, false, 'draft'
  )
  returning * into v_event;

  insert into public.club_event_operations (event_id, operational_status, owner_profile_id, created_by, internal_summary)
  values (v_event.id, 'draft', v_actor, v_actor, nullif(btrim(coalesce(p_internal_summary, '')), ''))
  returning * into v_operation;

  insert into public.club_event_operation_history (operation_id, event_id, previous_status, new_status, changed_by, reason)
  values (v_operation.id, v_event.id, null, 'draft', v_actor, 'Event operation created');

  perform public.write_club_audit_log('events.create', 'event', v_event.id, null, jsonb_build_object('operation_id', v_operation.id));

  return query select v_event.id, v_operation.id;
end;
$$;

create or replace function public.update_club_event_operation(
  p_operation_id uuid,
  p_internal_summary text default null,
  p_planning_start_at timestamptz default null,
  p_operational_deadline timestamptz default null,
  p_owner_profile_id uuid default null
)
returns table(operation_id uuid, operational_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_operation public.club_event_operations%rowtype;
begin
  select * into v_operation from public.club_event_operations where id = p_operation_id for update;
  if v_actor is null or not found then
    raise exception 'Event operation not found' using errcode = '02000';
  end if;

  perform public.cm5a_require_event_permission('events.update', v_operation.event_id);

  update public.club_event_operations
  set internal_summary = nullif(btrim(coalesce(p_internal_summary, internal_summary, '')), ''),
      planning_start_at = p_planning_start_at,
      operational_deadline = p_operational_deadline,
      owner_profile_id = coalesce(p_owner_profile_id, owner_profile_id)
  where id = p_operation_id
  returning * into v_operation;

  perform public.write_club_audit_log('events.update_operation', 'event_operation', v_operation.id, null, jsonb_build_object('event_id', v_operation.event_id));
  return query select v_operation.id, v_operation.operational_status;
end;
$$;

create or replace function public.change_club_event_operational_status(
  p_operation_id uuid,
  p_status text,
  p_reason text
)
returns table(operation_id uuid, operational_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_operation public.club_event_operations%rowtype;
  v_previous text;
  v_auth text;
begin
  select * into v_operation from public.club_event_operations where id = p_operation_id for update;
  if v_actor is null or not found then
    raise exception 'Event operation not found' using errcode = '02000';
  end if;

  if p_status not in ('draft', 'planning', 'awaiting_approval', 'approved', 'published', 'active', 'completed', 'cancelled', 'archived') then
    raise exception 'Invalid operational status' using errcode = '22023';
  end if;

  if p_status = 'cancelled' then
    if nullif(btrim(coalesce(p_reason, '')), '') is null then
      raise exception 'Cancellation reason is required' using errcode = '22023';
    end if;
    perform public.cm5a_require_event_permission('events.cancel', v_operation.event_id);
    v_auth := public.get_action_authorization('events.cancel', 'global', null);
    if v_operation.operational_status in ('approved', 'published', 'active') and v_auth = 'request_approval' then
      raise exception 'Cancellation requires approval' using errcode = '42501';
    end if;
  else
    perform public.cm5a_require_event_permission('events.update', v_operation.event_id);
  end if;

  v_previous := v_operation.operational_status;

  update public.club_event_operations
  set operational_status = p_status,
      approved_by = case when p_status = 'approved' then v_actor else approved_by end,
      approved_at = case when p_status = 'approved' then now() else approved_at end,
      cancellation_reason = case when p_status = 'cancelled' then btrim(p_reason) else cancellation_reason end,
      cancelled_by = case when p_status = 'cancelled' then v_actor else cancelled_by end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      completed_by = case when p_status = 'completed' then v_actor else completed_by end,
      completed_at = case when p_status = 'completed' then now() else completed_at end,
      archived_by = case when p_status = 'archived' then v_actor else archived_by end,
      archived_at = case when p_status = 'archived' then now() else archived_at end
  where id = p_operation_id
  returning * into v_operation;

  if p_status = 'cancelled' then
    update public.events set status = 'cancelled', registration_open = false where id = v_operation.event_id;
  elsif p_status = 'completed' then
    update public.events set status = 'completed', registration_open = false where id = v_operation.event_id;
  elsif p_status = 'archived' then
    update public.events set status = 'archived', registration_open = false where id = v_operation.event_id;
  end if;

  insert into public.club_event_operation_history (operation_id, event_id, previous_status, new_status, changed_by, reason)
  values (v_operation.id, v_operation.event_id, v_previous, p_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('events.change_status', 'event_operation', v_operation.id, null, jsonb_build_object('event_id', v_operation.event_id, 'from', v_previous, 'to', p_status));
  return query select v_operation.id, v_operation.operational_status;
end;
$$;

create or replace function public.assign_event_department(
  p_operation_id uuid,
  p_department_id uuid,
  p_is_lead_department boolean,
  p_assignment_title text,
  p_responsibility_brief text,
  p_due_at timestamptz default null,
  p_lead_profile_id uuid default null
)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_operation public.club_event_operations%rowtype;
  v_assignment public.event_department_assignments%rowtype;
begin
  select * into v_operation from public.club_event_operations where id = p_operation_id for update;
  if v_actor is null or not found then
    raise exception 'Event operation not found' using errcode = '02000';
  end if;

  perform public.cm5a_require_event_permission('events.assign_departments', v_operation.event_id);

  if not exists (select 1 from public.club_departments where id = p_department_id and status = 'active' and archived_at is null) then
    raise exception 'Select an active department' using errcode = '22023';
  end if;

  insert into public.event_department_assignments (
    operation_id, event_id, department_id, is_lead_department, lead_profile_id,
    assignment_title, responsibility_brief, assigned_by, due_at
  )
  values (
    v_operation.id, v_operation.event_id, p_department_id, coalesce(p_is_lead_department, false), p_lead_profile_id,
    btrim(p_assignment_title), btrim(p_responsibility_brief), v_actor, p_due_at
  )
  returning * into v_assignment;

  insert into public.event_department_assignment_history (assignment_id, operation_id, event_id, department_id, previous_status, new_status, changed_by, reason)
  values (v_assignment.id, v_assignment.operation_id, v_assignment.event_id, v_assignment.department_id, null, v_assignment.assignment_status, v_actor, 'Department assigned');

  perform public.write_club_audit_log('events.assign_department', 'event_department_assignment', v_assignment.id, p_department_id, jsonb_build_object('event_id', v_assignment.event_id, 'lead', v_assignment.is_lead_department));
  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.update_event_department_assignment(
  p_assignment_id uuid,
  p_assignment_title text,
  p_responsibility_brief text,
  p_due_at timestamptz default null,
  p_is_lead_department boolean default null,
  p_lead_profile_id uuid default null
)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_assignment public.event_department_assignments%rowtype;
begin
  select * into v_assignment from public.event_department_assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'Assignment not found' using errcode = '02000';
  end if;

  perform public.cm5a_require_event_permission('events.assign_departments', v_assignment.event_id);

  update public.event_department_assignments
  set assignment_title = btrim(p_assignment_title),
      responsibility_brief = btrim(p_responsibility_brief),
      due_at = p_due_at,
      is_lead_department = coalesce(p_is_lead_department, is_lead_department),
      lead_profile_id = coalesce(p_lead_profile_id, lead_profile_id)
  where id = p_assignment_id
  returning * into v_assignment;

  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.change_event_department_assignment_status(
  p_assignment_id uuid,
  p_status text,
  p_reason text default null
)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.event_department_assignments%rowtype;
  v_previous text;
begin
  select * into v_assignment from public.event_department_assignments where id = p_assignment_id for update;
  if v_actor is null or not found then
    raise exception 'Assignment not found' using errcode = '02000';
  end if;

  if p_status not in ('assigned', 'acknowledged', 'in_progress', 'blocked', 'completed', 'cancelled') then
    raise exception 'Invalid assignment status' using errcode = '22023';
  end if;

  if not public.can_manage_event_department_assignment(p_assignment_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_status in ('blocked', 'cancelled') and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  v_previous := v_assignment.assignment_status;

  update public.event_department_assignments
  set assignment_status = p_status,
      accepted_by = case when p_status in ('acknowledged', 'in_progress') and accepted_by is null then v_actor else accepted_by end,
      accepted_at = case when p_status in ('acknowledged', 'in_progress') and accepted_at is null then now() else accepted_at end,
      completed_by = case when p_status = 'completed' then v_actor else completed_by end,
      completed_at = case when p_status = 'completed' then now() else completed_at end,
      blocked_reason = case when p_status = 'blocked' then btrim(p_reason) else blocked_reason end,
      cancellation_reason = case when p_status = 'cancelled' then btrim(p_reason) else cancellation_reason end,
      cancelled_by = case when p_status = 'cancelled' then v_actor else cancelled_by end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_assignment_id
  returning * into v_assignment;

  insert into public.event_department_assignment_history (assignment_id, operation_id, event_id, department_id, previous_status, new_status, changed_by, reason)
  values (v_assignment.id, v_assignment.operation_id, v_assignment.event_id, v_assignment.department_id, v_previous, p_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('events.assignment_status', 'event_department_assignment', v_assignment.id, v_assignment.department_id, jsonb_build_object('event_id', v_assignment.event_id, 'from', v_previous, 'to', p_status));
  return query select v_assignment.id, v_assignment.assignment_status;
end;
$$;

create or replace function public.cancel_event_department_assignment(p_assignment_id uuid, p_reason text)
returns table(assignment_id uuid, assignment_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.change_event_department_assignment_status(p_assignment_id, 'cancelled', p_reason)
$$;

create or replace function public.publish_club_event(p_operation_id uuid, p_reason text default null)
returns table(operation_id uuid, operational_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_operation public.club_event_operations%rowtype;
  v_previous text;
begin
  select * into v_operation from public.club_event_operations where id = p_operation_id for update;
  if v_actor is null or not found then
    raise exception 'Event operation not found' using errcode = '02000';
  end if;

  perform public.cm5a_require_event_permission('events.publish', v_operation.event_id);
  v_previous := v_operation.operational_status;

  update public.club_event_operations
  set operational_status = 'published',
      approved_by = coalesce(approved_by, v_actor),
      approved_at = coalesce(approved_at, now())
  where id = p_operation_id
  returning * into v_operation;

  update public.events
  set status = 'published', published_at = coalesce(published_at, now())
  where id = v_operation.event_id;

  insert into public.club_event_operation_history (operation_id, event_id, previous_status, new_status, changed_by, reason)
  values (v_operation.id, v_operation.event_id, v_previous, 'published', v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('events.publish', 'event_operation', v_operation.id, null, jsonb_build_object('event_id', v_operation.event_id));
  return query select v_operation.id, v_operation.operational_status;
end;
$$;

create or replace function public.complete_club_event(p_operation_id uuid, p_reason text default null)
returns table(operation_id uuid, operational_status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.change_club_event_operational_status(p_operation_id, 'completed', p_reason)
$$;

create or replace function public.request_club_event_cancellation(p_operation_id uuid, p_reason text)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_operation public.club_event_operations%rowtype;
begin
  select * into v_operation from public.club_event_operations where id = p_operation_id;
  if not found then
    raise exception 'Event operation not found' using errcode = '02000';
  end if;

  perform public.cm5a_require_event_permission('events.cancel', v_operation.event_id);

  return query
  select * from public.create_approval_request(
    'events.cancel',
    'club_event_operation',
    v_operation.id,
    'event',
    null,
    v_operation.event_id,
    jsonb_build_object('operation_id', v_operation.id, 'event_id', v_operation.event_id),
    p_reason
  );
end;
$$;

create or replace function public.cm4_is_supported_approval_action(p_action_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p_action_key in (
    'members.suspend',
    'members.archive',
    'members.remove_department_membership',
    'departments.assign_head',
    'departments.assign_deputy',
    'positions.complete',
    'positions.revoke',
    'departments.archive',
    'platform_roles.revoke_non_super_admin',
    'access_grants.grant_elevated',
    'access_grants.revoke_elevated',
    'events.cancel'
  )
$$;

create or replace function public.execute_approved_request(p_request_id uuid, p_reason text)
returns table(approval_request_id uuid, execution_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
  v_payload jsonb;
  v_permission_key text;
  v_effect text;
  v_scope_type text;
begin
  if v_actor is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if not found then
    raise exception 'Approval request not found' using errcode = '02000';
  end if;

  if v_request.request_status <> 'approved' then
    raise exception 'Only approved requests can execute' using errcode = '22023';
  end if;

  if v_request.requester_profile_id = v_actor and not public.has_active_platform_role('super_admin') then
    raise exception 'Requester cannot execute own approved request' using errcode = '42501';
  end if;

  if not (public.has_active_platform_role('super_admin') or v_request.reviewed_by = v_actor or public.is_current_operational_president()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_payload := v_request.request_payload;

  if v_request.action_key = 'members.suspend' then
    update public.volunteer_profiles
    set account_status = 'suspended', suspended_by = v_actor, suspended_at = now(), suspension_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and account_status <> 'archived';
  elsif v_request.action_key = 'members.archive' then
    update public.volunteer_profiles
    set account_status = 'archived', archived_at = now()
    where id = v_request.target_id and account_status <> 'archived';
  elsif v_request.action_key = 'members.remove_department_membership' then
    update public.volunteer_department_memberships
    set membership_status = 'removed', removed_by = v_actor, removed_at = now(), removal_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and membership_status <> 'removed';
  elsif v_request.action_key = 'departments.assign_head' then
    update public.volunteer_department_memberships
    set department_role = 'department_head', approved_by = coalesce(approved_by, v_actor), approved_at = coalesce(approved_at, now()), membership_status = 'approved'
    where id = v_request.target_id;
  elsif v_request.action_key = 'departments.assign_deputy' then
    update public.volunteer_department_memberships
    set department_role = 'deputy_head', approved_by = coalesce(approved_by, v_actor), approved_at = coalesce(approved_at, now()), membership_status = 'approved'
    where id = v_request.target_id;
  elsif v_request.action_key = 'positions.complete' then
    update public.volunteer_club_positions
    set status = 'completed', ended_by = v_actor, ended_at = now(), reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and status = 'active';
  elsif v_request.action_key = 'positions.revoke' then
    update public.volunteer_club_positions
    set status = 'revoked', revoked_by = v_actor, revoked_at = now(), reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and status = 'active';
  elsif v_request.action_key = 'departments.archive' then
    update public.club_departments
    set status = 'archived', archived_at = now()
    where id = v_request.target_id and archived_at is null;
  elsif v_request.action_key = 'platform_roles.revoke_non_super_admin' then
    update public.volunteer_platform_roles
    set status = 'revoked', revoked_by = v_actor, revoked_at = now(), revocation_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and role <> 'super_admin' and status = 'active';
  elsif v_request.action_key = 'access_grants.grant_elevated' then
    v_permission_key := v_payload ->> 'permission_key';
    v_effect := coalesce(v_payload ->> 'effect', 'allow');
    v_scope_type := coalesce(v_payload ->> 'scope_type', 'global');
    perform public.grant_temporary_access(
      (v_payload ->> 'profile_id')::uuid,
      v_permission_key,
      v_effect,
      v_scope_type,
      nullif(v_payload ->> 'department_id', '')::uuid,
      nullif(v_payload ->> 'event_id', '')::uuid,
      nullif(v_payload ->> 'target_record_type', ''),
      nullif(v_payload ->> 'target_record_id', '')::uuid,
      coalesce(nullif(v_payload ->> 'starts_at', '')::timestamptz, now()),
      nullif(v_payload ->> 'expires_at', '')::timestamptz,
      coalesce(p_reason, v_request.reason)
    );
  elsif v_request.action_key = 'access_grants.revoke_elevated' then
    perform public.revoke_temporary_access((v_payload ->> 'override_id')::uuid, coalesce(p_reason, v_request.reason));
  elsif v_request.action_key = 'events.cancel' then
    perform public.change_club_event_operational_status(v_request.target_id, 'cancelled', coalesce(p_reason, v_request.reason));
  else
    raise exception 'Unsupported approval action' using errcode = '22023';
  end if;

  update public.approval_requests
  set request_status = 'executed', executed_by = v_actor, executed_at = now(), execution_status = 'succeeded'
  where id = p_request_id
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, 'executed', v_actor, p_reason);

  perform public.write_club_audit_log('approval_request.execute', 'approval_request', v_request.id, v_request.department_id, jsonb_build_object('action_key', v_request.action_key));

  return query select v_request.id, v_request.execution_status;
exception
  when others then
    if v_request.id is not null then
      update public.approval_requests
      set request_status = 'execution_failed', executed_by = v_actor, executed_at = now(), execution_status = 'failed', execution_error_code = sqlstate
      where id = v_request.id;
    end if;
    raise;
end;
$$;

alter table public.club_event_operations enable row level security;
alter table public.event_department_assignments enable row level security;
alter table public.club_event_operation_history enable row level security;
alter table public.event_department_assignment_history enable row level security;

revoke all on table public.club_event_operations from anon, authenticated;
revoke all on table public.event_department_assignments from anon, authenticated;
revoke all on table public.club_event_operation_history from anon, authenticated;
revoke all on table public.event_department_assignment_history from anon, authenticated;

grant select on table public.club_event_operations to authenticated;
grant select on table public.event_department_assignments to authenticated;
grant select on table public.club_event_operation_history to authenticated;
grant select on table public.event_department_assignment_history to authenticated;

drop policy if exists "Authorized users can read event operations" on public.club_event_operations;
create policy "Authorized users can read event operations"
on public.club_event_operations for select to authenticated
using (public.can_view_event_operation(event_id));

drop policy if exists "Authorized users can read event assignments" on public.event_department_assignments;
create policy "Authorized users can read event assignments"
on public.event_department_assignments for select to authenticated
using (public.can_view_event_operation(event_id));

drop policy if exists "Authorized users can read event operation history" on public.club_event_operation_history;
create policy "Authorized users can read event operation history"
on public.club_event_operation_history for select to authenticated
using (public.can_view_event_operation(event_id));

drop policy if exists "Authorized users can read event assignment history" on public.event_department_assignment_history;
create policy "Authorized users can read event assignment history"
on public.event_department_assignment_history for select to authenticated
using (public.can_view_event_operation(event_id));

revoke all on function public.can_view_event_operation(uuid) from public;
revoke all on function public.can_manage_event_department_assignment(uuid) from public;
revoke all on function public.cm5a_require_event_permission(text, uuid) from public;
revoke all on function public.create_club_event(text, text, text, text, text, date, text, time, time, integer, boolean, text, text) from public;
revoke all on function public.update_club_event_operation(uuid, text, timestamptz, timestamptz, uuid) from public;
revoke all on function public.change_club_event_operational_status(uuid, text, text) from public;
revoke all on function public.assign_event_department(uuid, uuid, boolean, text, text, timestamptz, uuid) from public;
revoke all on function public.update_event_department_assignment(uuid, text, text, timestamptz, boolean, uuid) from public;
revoke all on function public.change_event_department_assignment_status(uuid, text, text) from public;
revoke all on function public.cancel_event_department_assignment(uuid, text) from public;
revoke all on function public.publish_club_event(uuid, text) from public;
revoke all on function public.complete_club_event(uuid, text) from public;
revoke all on function public.request_club_event_cancellation(uuid, text) from public;

grant execute on function public.can_view_event_operation(uuid) to authenticated;
grant execute on function public.can_manage_event_department_assignment(uuid) to authenticated;
grant execute on function public.create_club_event(text, text, text, text, text, date, text, time, time, integer, boolean, text, text) to authenticated;
grant execute on function public.update_club_event_operation(uuid, text, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.change_club_event_operational_status(uuid, text, text) to authenticated;
grant execute on function public.assign_event_department(uuid, uuid, boolean, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.update_event_department_assignment(uuid, text, text, timestamptz, boolean, uuid) to authenticated;
grant execute on function public.change_event_department_assignment_status(uuid, text, text) to authenticated;
grant execute on function public.cancel_event_department_assignment(uuid, text) to authenticated;
grant execute on function public.publish_club_event(uuid, text) to authenticated;
grant execute on function public.complete_club_event(uuid, text) to authenticated;
grant execute on function public.request_club_event_cancellation(uuid, text) to authenticated;
