-- CM-5C2.1 follow-up: keep single-event progress lookup narrowly scoped.

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
  assignments as (
    select * from public.cm5c2_visible_assignments()
    where operation_id = p_operation_id
  ),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  tasks as (
    select v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    left join assignees a on a.task_id = v.task_id
    where v.operation_id = p_operation_id
      and v.task_status <> 'cancelled'
  )
  select
    eb.operation_id,
    eb.event_id,
    eb.event_title,
    eb.event_date,
    eb.public_status,
    eb.operational_status,
    count(distinct a.assignment_id)::bigint,
    count(t.task_id) filter (where t.task_status = 'completed')::bigint,
    count(t.task_id)::bigint,
    coalesce(round(avg(t.progress_percent), 2), 0),
    count(t.task_id) filter (where t.task_status <> 'completed' and t.due_at < now())::bigint,
    count(t.task_id) filter (where t.task_status = 'blocked')::bigint,
    count(t.task_id) filter (where t.latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(t.task_id) filter (where t.latest_submission_status = 'revision_requested')::bigint,
    count(t.task_id) filter (where t.task_status <> 'completed' and t.active_assignees = 0)::bigint,
    min(t.due_at) filter (where t.task_status <> 'completed' and t.due_at >= now())
  from event_base eb
  left join assignments a on a.operation_id = eb.operation_id
  left join tasks t on t.operation_id = eb.operation_id
  group by eb.operation_id, eb.event_id, eb.event_title, eb.event_date, eb.public_status, eb.operational_status
$$;

revoke all on function public.get_single_event_progress_summary(uuid) from public;
grant execute on function public.get_single_event_progress_summary(uuid) to authenticated;
