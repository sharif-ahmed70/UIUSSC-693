-- CM-5C2.2: Event progress aggregation integrity.
-- Prevent assignment x task multiplication by pre-aggregating event metrics.

create or replace function public.get_operational_event_dashboard(
  p_status text default null,
  p_timeframe text default null,
  p_department_id uuid default null,
  p_risk text default null
)
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
  with event_base as (
    select ceo.id as operation_id, ceo.operational_status, e.event_date
    from public.club_event_operations ceo
    join public.events e on e.id = ceo.event_id
    where public.can_view_event_operation(ceo.event_id)
  ),
  assignment_base as (
    select *
    from public.cm5c2_visible_assignments()
    where p_department_id is null or department_id = p_department_id
  ),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  task_base as (
    select v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    left join assignees a on a.task_id = v.task_id
    where v.task_status <> 'cancelled'
      and (p_department_id is null or v.department_id = p_department_id)
  ),
  task_metrics as (
    select
      tb.operation_id,
      count(tb.task_id) filter (where tb.task_status not in ('completed', 'cancelled'))::bigint as active_tasks,
      count(tb.task_id) filter (where tb.task_status not in ('completed', 'cancelled') and tb.due_at < now())::bigint as overdue_tasks,
      count(tb.task_id) filter (where tb.task_status = 'blocked')::bigint as blocked_tasks,
      count(tb.task_id) filter (where tb.latest_submission_status in ('submitted', 'under_review'))::bigint as pending_reviews,
      count(tb.task_id) filter (where tb.latest_submission_status = 'revision_requested')::bigint as revision_requested
    from task_base tb
    group by tb.operation_id
  ),
  assignment_metrics as (
    select ab.operation_id, count(ab.assignment_id)::bigint as active_department_assignments
    from assignment_base ab
    group by ab.operation_id
  ),
  filtered_events as (
    select
      eb.operation_id,
      eb.operational_status,
      eb.event_date,
      coalesce(am.active_department_assignments, 0) as active_department_assignments,
      coalesce(tm.active_tasks, 0) as active_tasks,
      coalesce(tm.overdue_tasks, 0) as overdue_tasks,
      coalesce(tm.blocked_tasks, 0) as blocked_tasks,
      coalesce(tm.pending_reviews, 0) as pending_reviews,
      coalesce(tm.revision_requested, 0) as revision_requested
    from event_base eb
    left join assignment_metrics am on am.operation_id = eb.operation_id
    left join task_metrics tm on tm.operation_id = eb.operation_id
    where (p_department_id is null or coalesce(am.active_department_assignments, 0) > 0)
      and public.cm5c2_filter_matches(
        eb.operational_status,
        eb.event_date,
        null,
        coalesce(tm.overdue_tasks, 0) > 0,
        coalesce(tm.blocked_tasks, 0) > 0,
        coalesce(tm.pending_reviews, 0) > 0,
        coalesce(tm.revision_requested, 0) > 0,
        p_status,
        p_timeframe,
        null,
        p_risk
      )
  )
  select
    count(*) filter (where operational_status in ('planning', 'approved', 'published', 'active'))::bigint,
    count(*) filter (where operational_status = 'awaiting_approval')::bigint,
    coalesce(sum(active_department_assignments), 0)::bigint,
    coalesce(sum(active_tasks), 0)::bigint,
    coalesce(sum(overdue_tasks), 0)::bigint,
    coalesce(sum(blocked_tasks), 0)::bigint,
    coalesce(sum(pending_reviews), 0)::bigint,
    coalesce(sum(revision_requested), 0)::bigint
  from filtered_events
$$;

create or replace function public.get_event_progress_summary(
  p_status text default null,
  p_timeframe text default null,
  p_department_id uuid default null,
  p_risk text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
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
  with event_base as (
    select ceo.id as operation_id, e.id as event_id, e.title as event_title, e.event_date, e.status as public_status, ceo.operational_status
    from public.club_event_operations ceo
    join public.events e on e.id = ceo.event_id
    where public.can_view_event_operation(ceo.event_id)
  ),
  assignment_metrics as (
    select
      a.operation_id,
      count(a.assignment_id)::bigint as assigned_department_count
    from public.cm5c2_visible_assignments() a
    where p_department_id is null or a.department_id = p_department_id
    group by a.operation_id
  ),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  task_base as (
    select v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    left join assignees a on a.task_id = v.task_id
    where v.task_status <> 'cancelled'
      and (p_department_id is null or v.department_id = p_department_id)
  ),
  task_metrics as (
    select
      t.operation_id,
      count(t.task_id) filter (where t.task_status = 'completed')::bigint as completed_tasks,
      count(t.task_id)::bigint as total_tasks,
      coalesce(round(avg(t.progress_percent), 2), 0) as average_progress,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.due_at < now())::bigint as overdue_count,
      count(t.task_id) filter (where t.task_status = 'blocked')::bigint as blocked_count,
      count(t.task_id) filter (where t.latest_submission_status in ('submitted', 'under_review'))::bigint as pending_review_count,
      count(t.task_id) filter (where t.latest_submission_status = 'revision_requested')::bigint as revision_requested_count,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.active_assignees = 0)::bigint as unassigned_count,
      min(t.due_at) filter (where t.task_status <> 'completed' and t.due_at >= now()) as nearest_deadline
    from task_base t
    group by t.operation_id
  ),
  metrics as (
    select
      eb.operation_id,
      eb.event_id,
      eb.event_title,
      eb.event_date,
      eb.public_status,
      eb.operational_status,
      coalesce(am.assigned_department_count, 0)::bigint as assigned_department_count,
      coalesce(tm.completed_tasks, 0)::bigint as completed_tasks,
      coalesce(tm.total_tasks, 0)::bigint as total_tasks,
      coalesce(tm.average_progress, 0) as average_progress,
      coalesce(tm.overdue_count, 0)::bigint as overdue_count,
      coalesce(tm.blocked_count, 0)::bigint as blocked_count,
      coalesce(tm.pending_review_count, 0)::bigint as pending_review_count,
      coalesce(tm.revision_requested_count, 0)::bigint as revision_requested_count,
      coalesce(tm.unassigned_count, 0)::bigint as unassigned_count,
      tm.nearest_deadline
    from event_base eb
    left join assignment_metrics am on am.operation_id = eb.operation_id
    left join task_metrics tm on tm.operation_id = eb.operation_id
    where p_department_id is null or coalesce(am.assigned_department_count, 0) > 0
  )
  select *
  from metrics m
  where public.cm5c2_filter_matches(
    m.operational_status,
    m.event_date,
    null,
    m.overdue_count > 0,
    m.blocked_count > 0,
    m.pending_review_count > 0,
    m.revision_requested_count > 0,
    p_status,
    p_timeframe,
    null,
    p_risk
  )
  order by m.event_date desc, m.event_title
  limit greatest(1, least(coalesce(p_limit, 50), 100))
  offset greatest(0, coalesce(p_offset, 0))
$$;

create or replace function public.get_single_event_progress_summary(p_operation_id uuid)
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
  with event_base as (
    select ceo.id as operation_id, e.id as event_id, e.title as event_title, e.event_date, e.status as public_status, ceo.operational_status
    from public.club_event_operations ceo
    join public.events e on e.id = ceo.event_id
    where ceo.id = p_operation_id
      and public.can_view_event_operation(ceo.event_id)
  ),
  assignment_metrics as (
    select a.operation_id, count(a.assignment_id)::bigint as assigned_department_count
    from public.cm5c2_visible_assignments() a
    where a.operation_id = p_operation_id
    group by a.operation_id
  ),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  task_base as (
    select v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    left join assignees a on a.task_id = v.task_id
    where v.operation_id = p_operation_id
      and v.task_status <> 'cancelled'
  ),
  task_metrics as (
    select
      t.operation_id,
      count(t.task_id) filter (where t.task_status = 'completed')::bigint as completed_tasks,
      count(t.task_id)::bigint as total_tasks,
      coalesce(round(avg(t.progress_percent), 2), 0) as average_progress,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.due_at < now())::bigint as overdue_count,
      count(t.task_id) filter (where t.task_status = 'blocked')::bigint as blocked_count,
      count(t.task_id) filter (where t.latest_submission_status in ('submitted', 'under_review'))::bigint as pending_review_count,
      count(t.task_id) filter (where t.latest_submission_status = 'revision_requested')::bigint as revision_requested_count,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.active_assignees = 0)::bigint as unassigned_count,
      min(t.due_at) filter (where t.task_status <> 'completed' and t.due_at >= now()) as nearest_deadline
    from task_base t
    group by t.operation_id
  )
  select
    eb.operation_id,
    eb.event_id,
    eb.event_title,
    eb.event_date,
    eb.public_status,
    eb.operational_status,
    coalesce(am.assigned_department_count, 0)::bigint,
    coalesce(tm.completed_tasks, 0)::bigint,
    coalesce(tm.total_tasks, 0)::bigint,
    coalesce(tm.average_progress, 0),
    coalesce(tm.overdue_count, 0)::bigint,
    coalesce(tm.blocked_count, 0)::bigint,
    coalesce(tm.pending_review_count, 0)::bigint,
    coalesce(tm.revision_requested_count, 0)::bigint,
    coalesce(tm.unassigned_count, 0)::bigint,
    tm.nearest_deadline
  from event_base eb
  left join assignment_metrics am on am.operation_id = eb.operation_id
  left join task_metrics tm on tm.operation_id = eb.operation_id
$$;

revoke all on function public.get_operational_event_dashboard(text, text, uuid, text) from anon, public;
revoke all on function public.get_event_progress_summary(text, text, uuid, text, integer, integer) from anon, public;
revoke all on function public.get_single_event_progress_summary(uuid) from anon, public;

grant execute on function public.get_operational_event_dashboard(text, text, uuid, text) to authenticated;
grant execute on function public.get_event_progress_summary(text, text, uuid, text, integer, integer) to authenticated;
grant execute on function public.get_single_event_progress_summary(uuid) to authenticated;
