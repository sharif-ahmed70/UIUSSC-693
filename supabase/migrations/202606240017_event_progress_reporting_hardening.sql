-- CM-5C2.1: Event progress reporting accuracy and hardening.
-- Corrects aggregation bases, preserves zero-task operations/assignments, and adds filtered reports.

create index if not exists club_event_operations_status_event_idx
on public.club_event_operations (operational_status, event_id);

create index if not exists event_department_assignments_operation_department_status_idx
on public.event_department_assignments (operation_id, department_id, assignment_status);

create or replace function public.cm5c2_filter_matches(
  p_operational_status text,
  p_event_date date,
  p_department_id uuid,
  p_has_overdue boolean,
  p_has_blocked boolean,
  p_has_pending_review boolean,
  p_has_revision_requested boolean,
  p_filter_status text default null,
  p_filter_timeframe text default null,
  p_filter_department_id uuid default null,
  p_filter_risk text default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    (p_filter_status is null or p_filter_status = '' or p_operational_status = p_filter_status)
    and (
      p_filter_timeframe is null
      or p_filter_timeframe = ''
      or (p_filter_timeframe = 'upcoming' and p_event_date >= current_date)
      or (p_filter_timeframe = 'past' and p_event_date < current_date)
    )
    and (p_filter_department_id is null or p_department_id = p_filter_department_id)
    and (
      p_filter_risk is null
      or p_filter_risk = ''
      or (p_filter_risk = 'overdue' and p_has_overdue)
      or (p_filter_risk = 'blocked' and p_has_blocked)
      or (p_filter_risk = 'pending_review' and p_has_pending_review)
      or (p_filter_risk = 'revision_requested' and p_has_revision_requested)
    )
$$;

create or replace function public.cm5c2_visible_assignments()
returns table(
  assignment_id uuid,
  operation_id uuid,
  event_id uuid,
  event_title text,
  event_date date,
  public_status text,
  operational_status text,
  department_id uuid,
  department_name text,
  is_lead_department boolean,
  assignment_status text,
  responsibility text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    eda.id,
    ceo.id,
    e.id,
    e.title,
    e.event_date,
    e.status,
    ceo.operational_status,
    cd.id,
    cd.name,
    eda.is_lead_department,
    eda.assignment_status,
    eda.assignment_title
  from public.event_department_assignments eda
  join public.club_event_operations ceo on ceo.id = eda.operation_id
  join public.events e on e.id = eda.event_id
  join public.club_departments cd on cd.id = eda.department_id
  where eda.assignment_status <> 'cancelled'
    and public.can_view_event_operation(eda.event_id)
$$;

drop function if exists public.get_operational_event_dashboard();
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
    select * from public.cm5c2_visible_assignments()
  ),
  task_base as (
    select v.*,
      coalesce(v.task_status not in ('completed', 'cancelled') and v.due_at < now(), false) as has_overdue,
      v.task_status = 'blocked' as has_blocked,
      v.latest_submission_status in ('submitted', 'under_review') as has_pending_review,
      v.latest_submission_status = 'revision_requested' as has_revision_requested
    from public.cm5c2_visible_tasks() v
  ),
  event_risks as (
    select
      eb.operation_id,
      eb.operational_status,
      eb.event_date,
      bool_or(coalesce(tb.has_overdue, false)) as has_overdue,
      bool_or(coalesce(tb.has_blocked, false)) as has_blocked,
      bool_or(coalesce(tb.has_pending_review, false)) as has_pending_review,
      bool_or(coalesce(tb.has_revision_requested, false)) as has_revision_requested
    from event_base eb
    left join task_base tb on tb.operation_id = eb.operation_id
    left join assignment_base ab on ab.operation_id = eb.operation_id
    group by eb.operation_id, eb.operational_status, eb.event_date
  ),
  filtered_events as (
    select *
    from event_risks er
    where public.cm5c2_filter_matches(er.operational_status, er.event_date, null, er.has_overdue, er.has_blocked, er.has_pending_review, er.has_revision_requested, p_status, p_timeframe, null, p_risk)
      and (
        p_department_id is null
        or exists (
          select 1 from assignment_base ab
          where ab.operation_id = er.operation_id and ab.department_id = p_department_id
        )
      )
  ),
  filtered_assignments as (
    select distinct ab.assignment_id
    from assignment_base ab
    join filtered_events fe on fe.operation_id = ab.operation_id
    where p_department_id is null or ab.department_id = p_department_id
  ),
  filtered_tasks as (
    select tb.*
    from task_base tb
    join filtered_events fe on fe.operation_id = tb.operation_id
    where p_department_id is null or tb.department_id = p_department_id
  )
  select
    (select count(*) from filtered_events where operational_status in ('planning', 'approved', 'published', 'active'))::bigint,
    (select count(*) from filtered_events where operational_status = 'awaiting_approval')::bigint,
    (select count(*) from filtered_assignments)::bigint,
    (select count(*) from filtered_tasks where task_status not in ('completed', 'cancelled'))::bigint,
    (select count(*) from filtered_tasks where task_status not in ('completed', 'cancelled') and due_at < now())::bigint,
    (select count(*) from filtered_tasks where task_status = 'blocked')::bigint,
    (select count(*) from filtered_tasks where latest_submission_status in ('submitted', 'under_review'))::bigint,
    (select count(*) from filtered_tasks where latest_submission_status = 'revision_requested')::bigint
$$;

drop function if exists public.get_event_progress_summary();
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
  assignments as (
    select * from public.cm5c2_visible_assignments()
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
    where v.task_status <> 'cancelled'
      and (p_department_id is null or v.department_id = p_department_id)
  ),
  metrics as (
    select
      eb.operation_id,
      eb.event_id,
      eb.event_title,
      eb.event_date,
      eb.public_status,
      eb.operational_status,
      count(distinct a.assignment_id) filter (where p_department_id is null or a.department_id = p_department_id)::bigint as assigned_department_count,
      count(t.task_id) filter (where t.task_status = 'completed')::bigint as completed_tasks,
      count(t.task_id)::bigint as total_tasks,
      coalesce(round(avg(t.progress_percent), 2), 0) as average_progress,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.due_at < now())::bigint as overdue_count,
      count(t.task_id) filter (where t.task_status = 'blocked')::bigint as blocked_count,
      count(t.task_id) filter (where t.latest_submission_status in ('submitted', 'under_review'))::bigint as pending_review_count,
      count(t.task_id) filter (where t.latest_submission_status = 'revision_requested')::bigint as revision_requested_count,
      count(t.task_id) filter (where t.task_status <> 'completed' and t.active_assignees = 0)::bigint as unassigned_count,
      min(t.due_at) filter (where t.task_status <> 'completed' and t.due_at >= now()) as nearest_deadline
    from event_base eb
    left join assignments a on a.operation_id = eb.operation_id
    left join tasks t on t.operation_id = eb.operation_id
    group by eb.operation_id, eb.event_id, eb.event_title, eb.event_date, eb.public_status, eb.operational_status
  )
  select *
  from metrics m
  where public.cm5c2_filter_matches(m.operational_status, m.event_date, null, m.overdue_count > 0, m.blocked_count > 0, m.pending_review_count > 0, m.revision_requested_count > 0, p_status, p_timeframe, null, p_risk)
    and (
      p_department_id is null
      or exists (
        select 1 from assignments a
        where a.operation_id = m.operation_id and a.department_id = p_department_id
      )
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
  select *
  from public.get_event_progress_summary(null, null, null, null, 1, 0) gps
  where gps.operation_id = p_operation_id
$$;

drop function if exists public.get_event_department_progress(uuid);
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
  next_deadline timestamptz,
  has_no_tasks boolean
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with assignments as (
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
    a.assignment_id,
    a.event_id,
    a.department_id,
    a.department_name,
    a.is_lead_department,
    a.assignment_status,
    a.responsibility,
    count(t.task_id)::bigint,
    count(t.task_id) filter (where t.task_status = 'completed')::bigint,
    case when count(t.task_id) = 0 then 0
      else round((count(t.task_id) filter (where t.task_status = 'completed')::numeric / count(t.task_id)::numeric) * 100, 2)
    end,
    coalesce(round(avg(t.progress_percent), 2), 0),
    count(t.task_id) filter (where t.task_status <> 'completed' and t.due_at < now())::bigint,
    count(t.task_id) filter (where t.task_status = 'blocked')::bigint,
    count(t.task_id) filter (where t.latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(t.task_id) filter (where t.latest_submission_status = 'revision_requested')::bigint,
    count(t.task_id) filter (where t.task_status <> 'completed' and t.active_assignees = 0)::bigint,
    min(t.due_at) filter (where t.task_status <> 'completed' and t.due_at >= now()),
    count(t.task_id) = 0
  from assignments a
  left join tasks t on t.assignment_id = a.assignment_id
  group by a.assignment_id, a.event_id, a.department_id, a.department_name, a.is_lead_department, a.assignment_status, a.responsibility
  order by a.department_name
$$;

drop function if exists public.get_my_task_progress_summary();
create or replace function public.get_my_task_progress_summary()
returns table(
  scope_kind text,
  assigned_events bigint,
  total_tasks bigint,
  active_tasks bigint,
  completed_tasks bigint,
  ready_to_submit bigint,
  under_review bigint,
  revision_requested bigint,
  overdue_tasks bigint,
  blocked_tasks bigint,
  unassigned_tasks bigint,
  average_progress numeric,
  next_deadline timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with actor as (
    select public.cm5b_current_approved_profile() as profile_id
  ),
  managed_departments as (
    select vdm.department_id
    from public.volunteer_department_memberships vdm, actor
    where vdm.volunteer_profile_id = actor.profile_id
      and vdm.membership_status = 'approved'
      and vdm.department_role in ('department_head', 'deputy_head')
  ),
  scope as (
    select case
      when public.has_effective_permission('tasks.view', 'global', null)
        or public.has_effective_permission('events.view_internal', 'global', null) then 'global'
      when exists (select 1 from managed_departments) then 'department'
      else 'personal'
    end as scope_kind
  ),
  assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  scoped_tasks as (
    select distinct v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    cross join scope s
    cross join actor
    left join assignees a on a.task_id = v.task_id
    left join public.event_task_assignees eta on eta.task_id = v.task_id
      and eta.volunteer_profile_id = actor.profile_id
      and eta.assignment_status in ('active', 'completed')
    where v.task_status <> 'cancelled'
      and (
        s.scope_kind = 'global'
        or (s.scope_kind = 'department' and exists (select 1 from managed_departments md where md.department_id = v.department_id))
        or (s.scope_kind = 'personal' and eta.id is not null)
      )
  )
  select
    (select scope_kind from scope),
    count(distinct operation_id)::bigint,
    count(*)::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled'))::bigint,
    count(*) filter (where task_status = 'completed')::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled') and progress_percent = 100 and coalesce(latest_submission_status, '') not in ('submitted', 'under_review'))::bigint,
    count(*) filter (where latest_submission_status in ('submitted', 'under_review'))::bigint,
    count(*) filter (where latest_submission_status = 'revision_requested')::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled') and due_at < now())::bigint,
    count(*) filter (where task_status = 'blocked')::bigint,
    count(*) filter (where task_status not in ('completed', 'cancelled') and active_assignees = 0)::bigint,
    coalesce(round(avg(progress_percent), 2), 0),
    min(due_at) filter (where task_status not in ('completed', 'cancelled') and due_at >= now())
  from scoped_tasks
$$;

drop function if exists public.get_event_progress_report_rows();
create or replace function public.get_event_progress_report_rows(
  p_status text default null,
  p_timeframe text default null,
  p_department_id uuid default null,
  p_risk text default null,
  p_limit integer default 500
)
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
    gps.event_title,
    gps.event_date,
    gps.operational_status,
    dp.department_name,
    case when dp.is_lead_department then 'lead' else 'support' end,
    dp.assignment_status,
    dp.responsibility,
    dp.total_tasks,
    dp.completed_tasks,
    dp.average_progress,
    dp.overdue_count,
    dp.blocked_count,
    dp.pending_review_count,
    dp.next_deadline
  from public.get_event_progress_summary(p_status, p_timeframe, p_department_id, p_risk, least(coalesce(p_limit, 500), 500), 0) gps
  join public.get_event_department_progress(gps.operation_id) dp on true
  where p_department_id is null or dp.department_id = p_department_id
  order by gps.event_date desc, gps.event_title, dp.department_name
  limit greatest(1, least(coalesce(p_limit, 500), 500))
$$;

create or replace function public.get_event_task_progress_report_rows(
  p_status text default null,
  p_timeframe text default null,
  p_department_id uuid default null,
  p_risk text default null,
  p_operation_id uuid default null,
  p_limit integer default 500
)
returns table(
  operation_id uuid,
  task_id uuid,
  event_title text,
  event_date date,
  operational_status text,
  department_name text,
  task_title text,
  priority text,
  task_status text,
  progress_percent integer,
  due_at timestamptz,
  is_overdue boolean,
  assignment_state text,
  latest_submission_status text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with assignees as (
    select edt.id as task_id, count(eta.id) filter (where eta.assignment_status = 'active') as active_assignees
    from public.event_department_tasks edt
    left join public.event_task_assignees eta on eta.task_id = edt.id
    group by edt.id
  ),
  tasks as (
    select v.*, coalesce(a.active_assignees, 0) as active_assignees
    from public.cm5c2_visible_tasks() v
    left join assignees a on a.task_id = v.task_id
    where v.task_status <> 'cancelled'
      and (p_operation_id is null or v.operation_id = p_operation_id)
      and (p_department_id is null or v.department_id = p_department_id)
  )
  select
    t.operation_id,
    t.task_id,
    t.event_title,
    t.event_date,
    t.operational_status,
    t.department_name,
    t.task_title,
    t.priority,
    t.task_status,
    t.progress_percent,
    t.due_at,
    (t.task_status <> 'completed' and t.due_at < now()) as is_overdue,
    case when t.active_assignees = 0 then 'unassigned' else 'assigned' end as assignment_state,
    t.latest_submission_status
  from tasks t
  where public.cm5c2_filter_matches(
    t.operational_status,
    t.event_date,
    t.department_id,
    t.task_status <> 'completed' and t.due_at < now(),
    t.task_status = 'blocked',
    t.latest_submission_status in ('submitted', 'under_review'),
    t.latest_submission_status = 'revision_requested',
    p_status,
    p_timeframe,
    p_department_id,
    p_risk
  )
  order by t.due_at asc nulls last, t.event_date desc, t.task_title
  limit greatest(1, least(coalesce(p_limit, 500), 500))
$$;

create or replace function public.get_event_task_risk_rows(p_operation_id uuid, p_risk text, p_limit integer default 10)
returns table(
  task_id uuid,
  department_name text,
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
    r.task_id,
    r.department_name,
    r.task_title,
    r.priority,
    r.task_status,
    r.progress_percent,
    r.due_at,
    r.latest_submission_status
  from public.get_event_task_progress_report_rows(null, null, null, p_risk, p_operation_id, least(coalesce(p_limit, 10), 25)) r
  limit greatest(1, least(coalesce(p_limit, 10), 25))
$$;

revoke all on function public.cm5c2_filter_matches(text, date, uuid, boolean, boolean, boolean, boolean, text, text, uuid, text) from public;
revoke all on function public.cm5c2_visible_assignments() from public;
revoke all on function public.get_operational_event_dashboard(text, text, uuid, text) from public;
revoke all on function public.get_event_progress_summary(text, text, uuid, text, integer, integer) from public;
revoke all on function public.get_single_event_progress_summary(uuid) from public;
revoke all on function public.get_event_department_progress(uuid) from public;
revoke all on function public.get_my_task_progress_summary() from public;
revoke all on function public.get_event_progress_report_rows(text, text, uuid, text, integer) from public;
revoke all on function public.get_event_task_progress_report_rows(text, text, uuid, text, uuid, integer) from public;
revoke all on function public.get_event_task_risk_rows(uuid, text, integer) from public;

grant execute on function public.get_operational_event_dashboard(text, text, uuid, text) to authenticated;
grant execute on function public.get_event_progress_summary(text, text, uuid, text, integer, integer) to authenticated;
grant execute on function public.get_single_event_progress_summary(uuid) to authenticated;
grant execute on function public.get_event_department_progress(uuid) to authenticated;
grant execute on function public.get_my_task_progress_summary() to authenticated;
grant execute on function public.get_event_progress_report_rows(text, text, uuid, text, integer) to authenticated;
grant execute on function public.get_event_task_progress_report_rows(text, text, uuid, text, uuid, integer) to authenticated;
grant execute on function public.get_event_task_risk_rows(uuid, text, integer) to authenticated;
