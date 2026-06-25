-- CM-5C2: Event and department progress reporting.
-- Read-only derived metrics; no cached totals.

create index if not exists event_department_tasks_active_due_idx
on public.event_department_tasks (due_at)
where task_status not in ('completed', 'cancelled') and due_at is not null;

create index if not exists event_department_tasks_event_status_idx
on public.event_department_tasks (event_id, task_status);

create index if not exists event_department_tasks_department_status_idx
on public.event_department_tasks (department_id, task_status);

create index if not exists event_task_submissions_task_status_idx
on public.event_task_submissions (task_id, submission_status, submitted_at desc);

create or replace function public.cm5c2_visible_tasks()
returns table(
  task_id uuid,
  operation_id uuid,
  event_id uuid,
  event_title text,
  event_date date,
  public_status text,
  operational_status text,
  assignment_id uuid,
  department_id uuid,
  department_name text,
  is_lead_department boolean,
  assignment_status text,
  responsibility text,
  task_title text,
  priority text,
  task_status text,
  progress_percent integer,
  due_at timestamptz,
  latest_submission_status text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    edt.id,
    ceo.id,
    e.id,
    e.title,
    e.event_date,
    e.status,
    ceo.operational_status,
    eda.id,
    cd.id,
    cd.name,
    eda.is_lead_department,
    eda.assignment_status,
    eda.assignment_title,
    edt.title,
    edt.priority,
    edt.task_status,
    edt.progress_percent,
    edt.due_at,
    latest.submission_status
  from public.event_department_tasks edt
  join public.event_department_assignments eda on eda.id = edt.event_department_assignment_id
  join public.club_event_operations ceo on ceo.id = eda.operation_id
  join public.events e on e.id = edt.event_id
  join public.club_departments cd on cd.id = edt.department_id
  left join lateral (
    select ets.submission_status
    from public.event_task_submissions ets
    where ets.task_id = edt.id
    order by ets.submission_number desc
    limit 1
  ) latest on true
  where public.can_view_event_task(edt.id)
$$;

create or replace function public.get_operational_event_dashboard()
returns table(
  active_events bigint,
  awaiting_approval_events bigint,
  active_department_assignments bigint,
  active_tasks bigint,
  overdue_tasks bigint,
  blocked_tasks bigint,
  pending_reviews bigint,
  revision_requested bigint
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with visible as (select * from public.cm5c2_visible_tasks()),
  visible_events as (
    select distinct ceo.id, ceo.operational_status
    from public.club_event_operations ceo
    where public.can_view_event_operation(ceo.event_id)
  ),
  visible_assignments as (
    select distinct assignment_id
    from visible
    where assignment_status <> 'cancelled'
  )
  select
    count(*) filter (where ve.operational_status in ('planning', 'approved', 'published', 'active'))::bigint,
    count(*) filter (where ve.operational_status = 'awaiting_approval')::bigint,
    (select count(*) from visible_assignments)::bigint,
    count(*) filter (where v.task_status not in ('completed', 'cancelled'))::bigint,
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at < now())::bigint,
    count(*) filter (where v.task_status = 'blocked')::bigint,
    count(*) filter (where v.latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(*) filter (where v.latest_submission_status = 'revision_requested')::bigint
  from visible_events ve
  full join visible v on v.operation_id = ve.id
$$;

create or replace function public.get_event_progress_summary()
returns table(
  operation_id uuid,
  event_id uuid,
  event_title text,
  event_date date,
  public_status text,
  operational_status text,
  assigned_department_count bigint,
  completed_tasks bigint,
  total_tasks bigint,
  average_progress numeric,
  overdue_count bigint,
  blocked_count bigint,
  pending_review_count bigint,
  revision_requested_count bigint,
  unassigned_count bigint,
  nearest_deadline timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with visible as (select * from public.cm5c2_visible_tasks()),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  )
  select
    v.operation_id,
    v.event_id,
    max(v.event_title),
    max(v.event_date),
    max(v.public_status),
    max(v.operational_status),
    count(distinct v.assignment_id) filter (where v.assignment_status <> 'cancelled')::bigint,
    count(*) filter (where v.task_status = 'completed')::bigint,
    count(*) filter (where v.task_status <> 'cancelled')::bigint,
    coalesce(round(avg(v.progress_percent) filter (where v.task_status <> 'cancelled'), 2), 0),
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at < now())::bigint,
    count(*) filter (where v.task_status = 'blocked')::bigint,
    count(*) filter (where v.latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(*) filter (where v.latest_submission_status = 'revision_requested')::bigint,
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and coalesce(a.active_assignees, 0) = 0)::bigint,
    min(v.due_at) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at >= now())
  from visible v
  left join assignees a on a.task_id = v.task_id
  group by v.operation_id, v.event_id
  order by max(v.event_date) desc
$$;

create or replace function public.get_event_department_progress(p_operation_id uuid)
returns table(
  assignment_id uuid,
  event_id uuid,
  department_id uuid,
  department_name text,
  is_lead_department boolean,
  assignment_status text,
  responsibility text,
  total_tasks bigint,
  completed_tasks bigint,
  completion_percent numeric,
  average_progress numeric,
  overdue_count bigint,
  blocked_count bigint,
  pending_review_count bigint,
  revision_requested_count bigint,
  unassigned_count bigint,
  next_deadline timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with visible as (select * from public.cm5c2_visible_tasks() where operation_id = p_operation_id),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  )
  select
    v.assignment_id,
    v.event_id,
    v.department_id,
    max(v.department_name),
    bool_or(v.is_lead_department),
    max(v.assignment_status),
    max(v.responsibility),
    count(*) filter (where v.task_status <> 'cancelled')::bigint,
    count(*) filter (where v.task_status = 'completed')::bigint,
    case when count(*) filter (where v.task_status <> 'cancelled') = 0 then 0
      else round((count(*) filter (where v.task_status = 'completed')::numeric / count(*) filter (where v.task_status <> 'cancelled')::numeric) * 100, 2)
    end,
    coalesce(round(avg(v.progress_percent) filter (where v.task_status <> 'cancelled'), 2), 0),
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at < now())::bigint,
    count(*) filter (where v.task_status = 'blocked')::bigint,
    count(*) filter (where v.latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(*) filter (where v.latest_submission_status = 'revision_requested')::bigint,
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and coalesce(a.active_assignees, 0) = 0)::bigint,
    min(v.due_at) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at >= now())
  from visible v
  left join assignees a on a.task_id = v.task_id
  group by v.assignment_id, v.event_id, v.department_id
  order by max(v.department_name)
$$;

create or replace function public.get_my_task_progress_summary()
returns table(
  active_tasks bigint,
  completed_tasks bigint,
  ready_to_submit bigint,
  under_review bigint,
  revision_requested bigint,
  overdue_tasks bigint,
  next_deadline timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with mine as (
    select distinct v.*
    from public.cm5c2_visible_tasks() v
    join public.event_task_assignees eta on eta.task_id = v.task_id
    where eta.volunteer_profile_id = public.cm5b_current_approved_profile()
      and eta.assignment_status in ('active', 'completed')
  )
  select
    count(*) filter (where task_status not in ('completed', 'cancelled'))::bigint,
    count(*) filter (where task_status = 'completed')::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled') and progress_percent = 100 and coalesce(latest_submission_status, '') not in ('submitted', 'under_review'))::bigint,
    count(*) filter (where latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(*) filter (where latest_submission_status = 'revision_requested')::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled') and due_at < now())::bigint,
    min(due_at) filter (where task_status not in ('completed', 'cancelled') and due_at >= now())
  from mine
$$;

create or replace function public.get_event_progress_report_rows()
returns table(
  event_title text,
  event_date date,
  operational_status text,
  department_name text,
  department_role text,
  assignment_status text,
  responsibility text,
  total_tasks bigint,
  completed_tasks bigint,
  average_progress numeric,
  overdue_count bigint,
  blocked_count bigint,
  pending_review_count bigint,
  next_deadline timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    max(v.event_title),
    max(v.event_date),
    max(v.operational_status),
    max(v.department_name),
    case when bool_or(v.is_lead_department) then 'lead' else 'support' end,
    max(v.assignment_status),
    max(v.responsibility),
    count(*) filter (where v.task_status <> 'cancelled')::bigint,
    count(*) filter (where v.task_status = 'completed')::bigint,
    coalesce(round(avg(v.progress_percent) filter (where v.task_status <> 'cancelled'), 2), 0),
    count(*) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at < now())::bigint,
    count(*) filter (where v.task_status = 'blocked')::bigint,
    count(*) filter (where v.latest_submission_status in ('submitted', 'under_review'))::bigint,
    min(v.due_at) filter (where v.task_status not in ('completed', 'cancelled') and v.due_at >= now())
  from public.cm5c2_visible_tasks() v
  group by v.event_id, v.assignment_id
  order by max(v.event_date) desc, max(v.department_name)
$$;

revoke all on function public.cm5c2_visible_tasks() from public;
revoke all on function public.get_operational_event_dashboard() from public;
revoke all on function public.get_event_progress_summary() from public;
revoke all on function public.get_event_department_progress(uuid) from public;
revoke all on function public.get_my_task_progress_summary() from public;
revoke all on function public.get_event_progress_report_rows() from public;

grant execute on function public.get_operational_event_dashboard() to authenticated;
grant execute on function public.get_event_progress_summary() to authenticated;
grant execute on function public.get_event_department_progress(uuid) to authenticated;
grant execute on function public.get_my_task_progress_summary() to authenticated;
grant execute on function public.get_event_progress_report_rows() to authenticated;
