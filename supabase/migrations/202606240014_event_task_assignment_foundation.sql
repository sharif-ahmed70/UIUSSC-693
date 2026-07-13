-- CM-5B: Department event tasks and executive assignment foundation
-- Adds task breakdowns under CM-5A event department assignments.

create table if not exists public.event_department_tasks (
  id uuid primary key default gen_random_uuid(),
  event_department_assignment_id uuid not null references public.event_department_assignments(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  title text not null,
  description text not null,
  priority text not null default 'normal',
  task_status text not null default 'draft',
  progress_percent integer not null default 0,
  due_at timestamptz,
  started_at timestamptz,
  ready_for_review_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  updated_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_department_tasks_title_check check (btrim(title) <> ''),
  constraint event_department_tasks_description_check check (btrim(description) <> ''),
  constraint event_department_tasks_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint event_department_tasks_status_check check (task_status in ('draft', 'assigned', 'in_progress', 'blocked', 'ready_for_review', 'completed', 'cancelled')),
  constraint event_department_tasks_progress_check check (progress_percent between 0 and 100),
  constraint event_department_tasks_cancel_reason_check check (task_status <> 'cancelled' or nullif(btrim(coalesce(cancellation_reason, '')), '') is not null),
  constraint event_department_tasks_completed_progress_check check (task_status <> 'completed' or progress_percent = 100)
);

create table if not exists public.event_task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.event_department_tasks(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  assignment_role text not null default 'contributor',
  assignment_status text not null default 'active',
  assigned_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  revoked_by uuid references public.volunteer_profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_task_assignees_role_check check (assignment_role in ('primary', 'contributor')),
  constraint event_task_assignees_status_check check (assignment_status in ('active', 'revoked', 'completed')),
  constraint event_task_assignees_revoke_reason_check check (assignment_status <> 'revoked' or nullif(btrim(coalesce(revocation_reason, '')), '') is not null)
);

create table if not exists public.event_task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.event_department_tasks(id) on delete restrict,
  event_department_assignment_id uuid not null references public.event_department_assignments(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  previous_status text,
  new_status text not null,
  previous_progress integer,
  new_progress integer,
  actor_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create table if not exists public.event_task_assignee_history (
  id uuid primary key default gen_random_uuid(),
  task_assignee_id uuid not null references public.event_task_assignees(id) on delete restrict,
  task_id uuid not null references public.event_department_tasks(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  previous_status text,
  new_status text not null,
  previous_role text,
  new_role text,
  actor_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists event_department_tasks_assignment_idx on public.event_department_tasks (event_department_assignment_id);
create index if not exists event_department_tasks_event_idx on public.event_department_tasks (event_id);
create index if not exists event_department_tasks_department_idx on public.event_department_tasks (department_id);
create index if not exists event_department_tasks_status_idx on public.event_department_tasks (task_status);
create index if not exists event_department_tasks_due_idx on public.event_department_tasks (due_at) where due_at is not null;
create index if not exists event_task_assignees_task_idx on public.event_task_assignees (task_id);
create index if not exists event_task_assignees_profile_idx on public.event_task_assignees (volunteer_profile_id);
create unique index if not exists event_task_assignees_one_active_profile_idx
  on public.event_task_assignees (task_id, volunteer_profile_id)
  where assignment_status = 'active';
create unique index if not exists event_task_assignees_one_active_primary_idx
  on public.event_task_assignees (task_id)
  where assignment_status = 'active' and assignment_role = 'primary';
create index if not exists event_task_status_history_task_idx on public.event_task_status_history (task_id, changed_at desc);
create index if not exists event_task_assignee_history_task_idx on public.event_task_assignee_history (task_id, changed_at desc);

drop trigger if exists set_event_department_tasks_updated_at on public.event_department_tasks;
create trigger set_event_department_tasks_updated_at
before update on public.event_department_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_event_task_assignees_updated_at on public.event_task_assignees;
create trigger set_event_task_assignees_updated_at
before update on public.event_task_assignees
for each row execute function public.set_updated_at();

create or replace function public.cm5b_assert_task_assignment_consistency()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_assignment public.event_department_assignments%rowtype;
  v_operation public.club_event_operations%rowtype;
begin
  select * into v_assignment
  from public.event_department_assignments
  where id = new.event_department_assignment_id;

  if not found or v_assignment.assignment_status = 'cancelled' then
    raise exception 'Task requires an active event department assignment' using errcode = '23514';
  end if;

  select * into v_operation
  from public.club_event_operations
  where id = v_assignment.operation_id;

  if not found or v_operation.operational_status in ('cancelled', 'archived') then
    raise exception 'Task cannot be created for cancelled or archived event operations' using errcode = '23514';
  end if;

  if new.event_id <> v_assignment.event_id or new.department_id <> v_assignment.department_id then
    raise exception 'Task event and department must match the department assignment' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists cm5b_event_department_task_consistency on public.event_department_tasks;
create trigger cm5b_event_department_task_consistency
before insert or update on public.event_department_tasks
for each row execute function public.cm5b_assert_task_assignment_consistency();

create or replace function public.cm5b_current_approved_profile()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile uuid;
begin
  select id into v_profile
  from public.volunteer_profiles
  where auth_user_id = auth.uid()
    and account_status = 'approved'
    and onboarding_status = 'approved'
    and archived_at is null;

  return v_profile;
end;
$$;

create or replace function public.cm5b_has_task_permission(p_permission_key text, p_event_id uuid, p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.has_effective_permission(p_permission_key, 'global', null)
    or public.has_effective_permission(p_permission_key, 'event', p_event_id)
    or public.has_effective_permission(p_permission_key, 'department', p_department_id)
$$;

create or replace function public.cm5b_is_department_task_manager(p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_department_memberships vdm
    where vdm.volunteer_profile_id = public.cm5b_current_approved_profile()
      and vdm.department_id = p_department_id
      and vdm.membership_status = 'approved'
      and vdm.department_role in ('department_head', 'deputy_head')
  )
$$;

create or replace function public.cm5b_is_active_task_assignee(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.event_task_assignees eta
    where eta.task_id = p_task_id
      and eta.volunteer_profile_id = public.cm5b_current_approved_profile()
      and eta.assignment_status = 'active'
  )
$$;

create or replace function public.can_view_event_task(p_task_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_task public.event_department_tasks%rowtype;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id;
  if not found or public.cm5b_current_approved_profile() is null then
    return false;
  end if;

  return public.cm5b_has_task_permission('tasks.view', v_task.event_id, v_task.department_id)
    or public.cm5b_is_department_task_manager(v_task.department_id)
    or public.cm5b_is_active_task_assignee(p_task_id);
end;
$$;

create or replace function public.cm5b_assert_active_department_member(p_profile_id uuid, p_department_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.volunteer_profiles vp
    join public.volunteer_department_memberships vdm on vdm.volunteer_profile_id = vp.id
    where vp.id = p_profile_id
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and vdm.department_id = p_department_id
      and vdm.membership_status = 'approved'
  ) then
    raise exception 'Assignee must be an approved active member of the same department' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_event_department_task(
  p_event_department_assignment_id uuid,
  p_title text,
  p_description text,
  p_priority text default 'normal',
  p_due_at timestamptz default null
)
returns table(task_id uuid, task_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_assignment public.event_department_assignments%rowtype;
  v_operation public.club_event_operations%rowtype;
  v_task public.event_department_tasks%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_assignment from public.event_department_assignments where id = p_event_department_assignment_id for update;
  if not found or v_assignment.assignment_status = 'cancelled' then
    raise exception 'Active department assignment is required' using errcode = '22023';
  end if;

  select * into v_operation from public.club_event_operations where id = v_assignment.operation_id;
  if not found or v_operation.operational_status in ('cancelled', 'archived') then
    raise exception 'Event operation is not taskable' using errcode = '22023';
  end if;

  if not (
    public.cm5b_has_task_permission('tasks.create', v_assignment.event_id, v_assignment.department_id)
    or public.cm5b_is_department_task_manager(v_assignment.department_id)
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.event_department_tasks (
    event_department_assignment_id, event_id, department_id, title, description, priority, created_by, due_at
  )
  values (
    v_assignment.id, v_assignment.event_id, v_assignment.department_id, btrim(p_title), btrim(p_description), coalesce(p_priority, 'normal'), v_actor, p_due_at
  )
  returning * into v_task;

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, null, v_task.task_status, null, v_task.progress_percent, v_actor, 'Task created');

  perform public.write_club_audit_log('tasks.create', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('event_id', v_task.event_id, 'assignment_id', v_task.event_department_assignment_id));
  return query select v_task.id, v_task.task_status;
end;
$$;

create or replace function public.update_event_department_task(
  p_task_id uuid,
  p_title text,
  p_description text,
  p_priority text,
  p_due_at timestamptz default null
)
returns table(task_id uuid, task_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed tasks cannot be edited' using errcode = '22023';
  end if;
  if not (
    public.cm5b_has_task_permission('tasks.create', v_task.event_id, v_task.department_id)
    or public.cm5b_has_task_permission('tasks.review', v_task.event_id, v_task.department_id)
    or public.cm5b_is_department_task_manager(v_task.department_id)
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.event_department_tasks
  set title = btrim(p_title), description = btrim(p_description), priority = p_priority, due_at = p_due_at, updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  perform public.write_club_audit_log('tasks.update', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('event_id', v_task.event_id));
  return query select v_task.id, v_task.task_status;
end;
$$;

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

  perform public.write_club_audit_log('tasks.assign_member', 'event_task_assignee', v_assignee.id, v_task.department_id, jsonb_build_object('task_id', v_task.id, 'role', v_assignee.assignment_role));
  return query select v_assignee.id, v_assignee.assignment_status;
end;
$$;

create or replace function public.revoke_event_task_member(p_task_assignee_id uuid, p_reason text)
returns table(task_assignee_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_assignee public.event_task_assignees%rowtype;
  v_task public.event_department_tasks%rowtype;
begin
  select * into v_assignee from public.event_task_assignees where id = p_task_assignee_id for update;
  if v_actor is null or not found then
    raise exception 'Assignee not found' using errcode = '02000';
  end if;
  select * into v_task from public.event_department_tasks where id = v_assignee.task_id for update;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Revocation reason is required' using errcode = '22023';
  end if;
  if not (public.cm5b_has_task_permission('tasks.assign', v_task.event_id, v_task.department_id) or public.cm5b_is_department_task_manager(v_task.department_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_assignee.assignment_status <> 'active' then
    return query select v_assignee.id, v_assignee.assignment_status;
    return;
  end if;

  update public.event_task_assignees
  set assignment_status = 'revoked', revoked_by = v_actor, revoked_at = now(), revocation_reason = btrim(p_reason)
  where id = v_assignee.id
  returning * into v_assignee;

  insert into public.event_task_assignee_history (task_assignee_id, task_id, volunteer_profile_id, previous_status, new_status, previous_role, new_role, actor_profile_id, reason)
  values (v_assignee.id, v_assignee.task_id, v_assignee.volunteer_profile_id, 'active', 'revoked', v_assignee.assignment_role, v_assignee.assignment_role, v_actor, p_reason);

  perform public.write_club_audit_log('tasks.revoke_member', 'event_task_assignee', v_assignee.id, v_task.department_id, jsonb_build_object('task_id', v_task.id));
  return query select v_assignee.id, v_assignee.assignment_status;
end;
$$;

create or replace function public.update_own_event_task_progress(p_task_id uuid, p_progress_percent integer, p_reason text default null)
returns table(task_id uuid, task_status text, progress_percent integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_previous_progress integer;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed task cannot be updated' using errcode = '22023';
  end if;
  if not public.cm5b_is_active_task_assignee(p_task_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_progress_percent < 0 or p_progress_percent > 100 then
    raise exception 'Progress must be between 0 and 100' using errcode = '22023';
  end if;

  v_previous_progress := v_task.progress_percent;
  update public.event_department_tasks
  set progress_percent = p_progress_percent, updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason, metadata)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_task.task_status, v_task.task_status, v_previous_progress, v_task.progress_percent, v_actor, nullif(btrim(coalesce(p_reason, '')), ''), jsonb_build_object('progress_only', true));

  perform public.write_club_audit_log('tasks.update_progress', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('progress', v_task.progress_percent));
  return query select v_task.id, v_task.task_status, v_task.progress_percent;
end;
$$;

create or replace function public.change_event_task_status(p_task_id uuid, p_status text, p_reason text default null)
returns table(task_id uuid, task_status text, progress_percent integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_previous_status text;
  v_allowed boolean := false;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed task cannot be reopened in CM-5B' using errcode = '22023';
  end if;
  if p_status not in ('assigned', 'in_progress', 'blocked', 'ready_for_review') then
    raise exception 'Unsupported status transition for this action' using errcode = '22023';
  end if;
  if p_status = 'blocked' and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Blocked status requires a reason' using errcode = '22023';
  end if;

  if public.cm5b_is_active_task_assignee(p_task_id)
     and (
       (v_task.task_status = 'assigned' and p_status = 'in_progress')
       or (v_task.task_status = 'in_progress' and p_status in ('blocked', 'ready_for_review'))
       or (v_task.task_status = 'blocked' and p_status = 'in_progress')
     ) then
    v_allowed := true;
  end if;

  if public.cm5b_has_task_permission('tasks.review', v_task.event_id, v_task.department_id)
     or public.cm5b_is_department_task_manager(v_task.department_id) then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_previous_status := v_task.task_status;
  update public.event_department_tasks
  set task_status = p_status,
      started_at = case when p_status = 'in_progress' then coalesce(started_at, now()) else started_at end,
      ready_for_review_at = case when p_status = 'ready_for_review' then now() else ready_for_review_at end,
      updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_status, v_task.task_status, v_task.progress_percent, v_task.progress_percent, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('tasks.change_status', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('from', v_previous_status, 'to', v_task.task_status));
  return query select v_task.id, v_task.task_status, v_task.progress_percent;
end;
$$;

create or replace function public.complete_event_department_task(p_task_id uuid, p_reason text default null)
returns table(task_id uuid, task_status text, progress_percent integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_previous_status text;
  v_previous_progress integer;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed task cannot be changed' using errcode = '22023';
  end if;
  if not (public.cm5b_has_task_permission('tasks.close', v_task.event_id, v_task.department_id) or public.cm5b_is_department_task_manager(v_task.department_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_previous_status := v_task.task_status;
  v_previous_progress := v_task.progress_percent;
  update public.event_department_tasks
  set task_status = 'completed', progress_percent = 100, completed_at = now(), updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  update public.event_task_assignees
  set assignment_status = 'completed'
  where task_id = p_task_id and assignment_status = 'active';

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_status, 'completed', v_previous_progress, 100, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));

  perform public.write_club_audit_log('tasks.complete', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('event_id', v_task.event_id));
  return query select v_task.id, v_task.task_status, v_task.progress_percent;
end;
$$;

create or replace function public.cancel_event_department_task(p_task_id uuid, p_reason text)
returns table(task_id uuid, task_status text, progress_percent integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_previous_status text;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Closed task cannot be changed' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Cancellation reason is required' using errcode = '22023';
  end if;
  if not (public.cm5b_has_task_permission('tasks.close', v_task.event_id, v_task.department_id) or public.cm5b_is_department_task_manager(v_task.department_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_previous_status := v_task.task_status;
  update public.event_department_tasks
  set task_status = 'cancelled', cancelled_at = now(), cancellation_reason = btrim(p_reason), updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_status, 'cancelled', v_task.progress_percent, v_task.progress_percent, v_actor, p_reason);

  perform public.write_club_audit_log('tasks.cancel', 'event_department_task', v_task.id, v_task.department_id, jsonb_build_object('event_id', v_task.event_id));
  return query select v_task.id, v_task.task_status, v_task.progress_percent;
end;
$$;

alter table public.event_department_tasks enable row level security;
alter table public.event_task_assignees enable row level security;
alter table public.event_task_status_history enable row level security;
alter table public.event_task_assignee_history enable row level security;

revoke all on table public.event_department_tasks from anon, authenticated;
revoke all on table public.event_task_assignees from anon, authenticated;
revoke all on table public.event_task_status_history from anon, authenticated;
revoke all on table public.event_task_assignee_history from anon, authenticated;

grant select on table public.event_department_tasks to authenticated;
grant select on table public.event_task_assignees to authenticated;
grant select on table public.event_task_status_history to authenticated;
grant select on table public.event_task_assignee_history to authenticated;

drop policy if exists "Authorized users can read event department tasks" on public.event_department_tasks;
create policy "Authorized users can read event department tasks"
on public.event_department_tasks for select to authenticated
using (public.can_view_event_task(id));

drop policy if exists "Authorized users can read event task assignees" on public.event_task_assignees;
create policy "Authorized users can read event task assignees"
on public.event_task_assignees for select to authenticated
using (public.can_view_event_task(task_id));

drop policy if exists "Authorized users can read event task status history" on public.event_task_status_history;
create policy "Authorized users can read event task status history"
on public.event_task_status_history for select to authenticated
using (public.can_view_event_task(task_id));

drop policy if exists "Authorized users can read event task assignee history" on public.event_task_assignee_history;
create policy "Authorized users can read event task assignee history"
on public.event_task_assignee_history for select to authenticated
using (public.can_view_event_task(task_id));

revoke all on function public.cm5b_assert_task_assignment_consistency() from public;
revoke all on function public.cm5b_current_approved_profile() from public;
revoke all on function public.cm5b_has_task_permission(text, uuid, uuid) from public;
revoke all on function public.cm5b_is_department_task_manager(uuid) from public;
revoke all on function public.cm5b_is_active_task_assignee(uuid) from public;
revoke all on function public.can_view_event_task(uuid) from public;
revoke all on function public.cm5b_assert_active_department_member(uuid, uuid) from public;
revoke all on function public.create_event_department_task(uuid, text, text, text, timestamptz) from public;
revoke all on function public.update_event_department_task(uuid, text, text, text, timestamptz) from public;
revoke all on function public.assign_event_task_member(uuid, uuid, text) from public;
revoke all on function public.revoke_event_task_member(uuid, text) from public;
revoke all on function public.update_own_event_task_progress(uuid, integer, text) from public;
revoke all on function public.change_event_task_status(uuid, text, text) from public;
revoke all on function public.complete_event_department_task(uuid, text) from public;
revoke all on function public.cancel_event_department_task(uuid, text) from public;

grant execute on function public.can_view_event_task(uuid) to authenticated;
grant execute on function public.create_event_department_task(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.update_event_department_task(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.assign_event_task_member(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_event_task_member(uuid, text) to authenticated;
grant execute on function public.update_own_event_task_progress(uuid, integer, text) to authenticated;
grant execute on function public.change_event_task_status(uuid, text, text) to authenticated;
grant execute on function public.complete_event_department_task(uuid, text) to authenticated;
grant execute on function public.cancel_event_department_task(uuid, text) to authenticated;
