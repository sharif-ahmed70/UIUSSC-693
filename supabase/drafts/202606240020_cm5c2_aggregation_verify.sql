-- CM-5C2.2 aggregation integrity verification.
-- Development only. Creates disposable rows inside a rollback transaction.

begin;

do $$
declare
  v_admin_profile uuid;
  v_admin_auth uuid;
  v_second_profile uuid;
  v_department_a uuid := gen_random_uuid();
  v_department_b uuid := gen_random_uuid();
  v_department_zero uuid := gen_random_uuid();
  v_event uuid := gen_random_uuid();
  v_zero_event uuid := gen_random_uuid();
  v_operation uuid := gen_random_uuid();
  v_zero_operation uuid := gen_random_uuid();
  v_assignment_a uuid := gen_random_uuid();
  v_assignment_b uuid := gen_random_uuid();
  v_assignment_zero uuid := gen_random_uuid();
  v_task_completed uuid := gen_random_uuid();
  v_task_blocked uuid := gen_random_uuid();
  v_task_unassigned uuid := gen_random_uuid();
  v_summary record;
  v_single record;
  v_department_b_summary record;
  v_zero_summary record;
  v_zero_department record;
  v_dashboard record;
  v_task_report_count integer;
  v_event_report_count integer;
begin
  select vp.id, vp.auth_user_id
  into v_admin_profile, v_admin_auth
  from public.volunteer_profiles vp
  join public.volunteer_platform_roles vpr on vpr.volunteer_profile_id = vp.id
  where vpr.role = 'super_admin'
    and vpr.status = 'active'
    and vp.account_status = 'approved'
    and vp.onboarding_status = 'approved'
    and vp.archived_at is null
  limit 1;

  if v_admin_profile is null or v_admin_auth is null then
    raise exception 'No active Super Admin profile is available for authenticated aggregation tests';
  end if;

  select id into v_second_profile
  from public.volunteer_profiles
  where id <> v_admin_profile
    and account_status = 'approved'
    and onboarding_status = 'approved'
    and archived_at is null
  limit 1;

  if v_second_profile is null then
    v_second_profile := v_admin_profile;
  end if;

  insert into public.club_departments (id, name, slug, short_description, status, display_order)
  values
    (v_department_a, 'CM5C2 Test Department A', 'cm5c2-test-department-a', 'Disposable aggregation test department', 'active', 901),
    (v_department_b, 'CM5C2 Test Department B', 'cm5c2-test-department-b', 'Disposable aggregation test department', 'active', 902),
    (v_department_zero, 'CM5C2 Zero Department', 'cm5c2-zero-department', 'Disposable zero-task test department', 'active', 903);

  insert into public.events (id, title, slug, summary, description, category, event_date, location, status, published_at)
  values
    (v_event, 'CM5C2 Aggregation Test Event', 'cm5c2-aggregation-test-event', 'Disposable summary', 'Disposable description', 'Workshop', current_date + 14, 'UIU', 'published', now()),
    (v_zero_event, 'CM5C2 Zero Task Event', 'cm5c2-zero-task-event', 'Disposable summary', 'Disposable description', 'Workshop', current_date + 15, 'UIU', 'published', now());

  insert into public.club_event_operations (id, event_id, operational_status, owner_profile_id, created_by, internal_summary)
  values
    (v_operation, v_event, 'active', v_admin_profile, v_admin_profile, 'Disposable aggregation test operation'),
    (v_zero_operation, v_zero_event, 'active', v_admin_profile, v_admin_profile, 'Disposable zero task operation');

  insert into public.event_department_assignments (id, operation_id, event_id, department_id, is_lead_department, lead_profile_id, assignment_title, responsibility_brief, assigned_by, assignment_status)
  values
    (v_assignment_a, v_operation, v_event, v_department_a, true, v_admin_profile, 'Lead test scope', 'Disposable responsibility', v_admin_profile, 'in_progress'),
    (v_assignment_b, v_operation, v_event, v_department_b, false, v_admin_profile, 'Support test scope', 'Disposable responsibility', v_admin_profile, 'in_progress'),
    (v_assignment_zero, v_zero_operation, v_zero_event, v_department_zero, true, v_admin_profile, 'Zero test scope', 'Disposable responsibility', v_admin_profile, 'assigned');

  insert into public.event_department_tasks (id, event_department_assignment_id, event_id, department_id, title, description, priority, task_status, progress_percent, due_at, created_by)
  values
    (v_task_completed, v_assignment_a, v_event, v_department_a, 'Completed task', 'Disposable task', 'normal', 'completed', 100, now() - interval '2 days', v_admin_profile),
    (v_task_blocked, v_assignment_a, v_event, v_department_a, 'Blocked overdue task', 'Disposable task', 'urgent', 'blocked', 50, now() - interval '1 day', v_admin_profile),
    (v_task_unassigned, v_assignment_b, v_event, v_department_b, 'Unassigned pending task', 'Disposable task', 'high', 'in_progress', 25, now() + interval '5 days', v_admin_profile);

  insert into public.event_task_assignees (task_id, volunteer_profile_id, assignment_role, assignment_status, assigned_by)
  values
    (v_task_completed, v_admin_profile, 'primary', 'completed', v_admin_profile),
    (v_task_blocked, v_admin_profile, 'primary', 'active', v_admin_profile);

  if v_second_profile <> v_admin_profile then
    insert into public.event_task_assignees (task_id, volunteer_profile_id, assignment_role, assignment_status, assigned_by)
    values (v_task_blocked, v_second_profile, 'contributor', 'active', v_admin_profile);
  end if;

  insert into public.event_task_submissions (task_id, submission_number, submitted_by, submission_status, summary, completion_note, submitted_at, reviewed_by, reviewed_at)
  values (v_task_unassigned, 1, v_admin_profile, 'approved', 'Historical disposable summary', 'Approved disposable note', now() - interval '2 days', v_admin_profile, now() - interval '1 day');

  insert into public.event_task_submissions (task_id, submission_number, submitted_by, submission_status, summary, submitted_at)
  values (v_task_unassigned, 2, v_admin_profile, 'submitted', 'Latest disposable summary', now());

  perform set_config('request.jwt.claim.sub', v_admin_auth::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select * into v_summary
  from public.get_event_progress_summary('active', 'upcoming', null, null, 50, 0)
  where operation_id = v_operation;

  if v_summary.assigned_department_count <> 2
    or v_summary.total_tasks <> 3
    or v_summary.completed_tasks <> 1
    or v_summary.blocked_count <> 1
    or v_summary.overdue_count <> 1
    or v_summary.unassigned_count <> 1
    or v_summary.pending_review_count <> 1
    or v_summary.average_progress <> 58.33 then
    raise exception 'Event summary aggregation mismatch: departments %, total %, completed %, blocked %, overdue %, unassigned %, pending %, average %',
      v_summary.assigned_department_count, v_summary.total_tasks, v_summary.completed_tasks, v_summary.blocked_count, v_summary.overdue_count, v_summary.unassigned_count, v_summary.pending_review_count, v_summary.average_progress;
  end if;

  select * into v_single
  from public.get_single_event_progress_summary(v_operation);

  if v_single.assigned_department_count <> 2 or v_single.total_tasks <> 3 then
    raise exception 'Single-event aggregation mismatch: departments %, total %', v_single.assigned_department_count, v_single.total_tasks;
  end if;

  select * into v_department_b_summary
  from public.get_event_progress_summary('active', 'upcoming', v_department_b, 'pending_review', 50, 0)
  where operation_id = v_operation;

  if v_department_b_summary.assigned_department_count <> 1
    or v_department_b_summary.total_tasks <> 1
    or v_department_b_summary.pending_review_count <> 1
    or v_department_b_summary.blocked_count <> 0 then
    raise exception 'Department filter aggregation mismatch: departments %, total %, pending %, blocked %',
      v_department_b_summary.assigned_department_count, v_department_b_summary.total_tasks, v_department_b_summary.pending_review_count, v_department_b_summary.blocked_count;
  end if;

  select * into v_zero_summary
  from public.get_event_progress_summary('active', 'upcoming', v_department_zero, null, 50, 0)
  where operation_id = v_zero_operation;

  if v_zero_summary.assigned_department_count <> 1
    or v_zero_summary.total_tasks <> 0
    or v_zero_summary.completed_tasks <> 0
    or v_zero_summary.average_progress <> 0 then
    raise exception 'Zero-task event mismatch: departments %, total %, completed %, average %',
      v_zero_summary.assigned_department_count, v_zero_summary.total_tasks, v_zero_summary.completed_tasks, v_zero_summary.average_progress;
  end if;

  select * into v_zero_department
  from public.get_event_department_progress(v_zero_operation)
  where assignment_id = v_assignment_zero;

  if v_zero_department.has_no_tasks is not true
    or v_zero_department.total_tasks <> 0
    or v_zero_department.completed_tasks <> 0
    or v_zero_department.completion_percent <> 0
    or v_zero_department.average_progress <> 0 then
    raise exception 'Zero-task department mismatch';
  end if;

  select * into v_dashboard
  from public.get_operational_event_dashboard('active', 'upcoming', v_department_a, 'blocked');

  if v_dashboard.active_events <> 1
    or v_dashboard.active_department_assignments <> 1
    or v_dashboard.active_tasks <> 1
    or v_dashboard.blocked_tasks <> 1 then
    raise exception 'Dashboard filtered aggregation mismatch: events %, departments %, active tasks %, blocked %',
      v_dashboard.active_events, v_dashboard.active_department_assignments, v_dashboard.active_tasks, v_dashboard.blocked_tasks;
  end if;

  select count(*) into v_task_report_count
  from public.get_event_task_progress_report_rows('active', 'upcoming', null, null, v_operation, 50);

  if v_task_report_count <> 3 then
    raise exception 'Task report row count mismatch: %', v_task_report_count;
  end if;

  select count(*) into v_event_report_count
  from public.get_event_progress_report_rows('active', 'upcoming', null, null, 50)
  where event_title = 'CM5C2 Aggregation Test Event';

  if v_event_report_count <> 2 then
    raise exception 'Event/department report row count mismatch: %', v_event_report_count;
  end if;
end $$;

select 'cm5c2_aggregation_disposable_assertions_passed' as check_name, true as ok;

rollback;
