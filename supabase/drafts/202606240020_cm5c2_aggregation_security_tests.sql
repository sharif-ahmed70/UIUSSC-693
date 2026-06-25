-- CM-5C2.2 reporting security assertions.
-- Development only. Metadata assertions are transaction wrapped.

begin;

do $$
declare
  v_public_execute_count integer;
  v_anon_execute_count integer;
  v_bad_search_path_count integer;
  v_exposed_helper_count integer;
begin
  select count(*) into v_public_execute_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'cm5c2_filter_matches',
      'cm5c2_visible_assignments',
      'cm5c2_visible_tasks',
      'get_operational_event_dashboard',
      'get_event_progress_summary',
      'get_single_event_progress_summary',
      'get_event_department_progress',
      'get_my_task_progress_summary',
      'get_event_progress_report_rows',
      'get_event_task_progress_report_rows',
      'get_event_task_risk_rows'
    )
    and has_function_privilege('public', p.oid, 'execute');

  if v_public_execute_count <> 0 then
    raise exception 'PUBLIC execute privilege remains on % reporting function(s)', v_public_execute_count;
  end if;

  select count(*) into v_anon_execute_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'cm5c2_filter_matches',
      'cm5c2_visible_assignments',
      'cm5c2_visible_tasks',
      'get_operational_event_dashboard',
      'get_event_progress_summary',
      'get_single_event_progress_summary',
      'get_event_department_progress',
      'get_my_task_progress_summary',
      'get_event_progress_report_rows',
      'get_event_task_progress_report_rows',
      'get_event_task_risk_rows'
    )
    and has_function_privilege('anon', p.oid, 'execute');

  if v_anon_execute_count <> 0 then
    raise exception 'anon execute privilege remains on % reporting function(s)', v_anon_execute_count;
  end if;

  select count(*) into v_bad_search_path_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'cm5c2_filter_matches',
      'cm5c2_visible_assignments',
      'cm5c2_visible_tasks',
      'get_operational_event_dashboard',
      'get_event_progress_summary',
      'get_single_event_progress_summary',
      'get_event_department_progress',
      'get_my_task_progress_summary',
      'get_event_progress_report_rows',
      'get_event_task_progress_report_rows',
      'get_event_task_risk_rows'
    )
    and not ('search_path=public, auth, pg_temp' = any(coalesce(p.proconfig, array[]::text[])));

  if v_bad_search_path_count <> 0 then
    raise exception 'fixed search_path missing on % reporting function(s)', v_bad_search_path_count;
  end if;

  select count(*) into v_exposed_helper_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('cm5c2_filter_matches', 'cm5c2_visible_assignments', 'cm5c2_visible_tasks')
    and has_function_privilege('authenticated', p.oid, 'execute');

  if v_exposed_helper_count <> 0 then
    raise exception 'helper functions are directly executable by authenticated users: %', v_exposed_helper_count;
  end if;
end $$;

select
  'sensitive_report_columns_absent' as check_name,
  not exists (
    select 1
    from information_schema.parameters
    where specific_schema = 'public'
      and specific_name like any (array[
        'get_event_progress_report_rows%',
        'get_event_task_progress_report_rows%',
        'get_event_task_risk_rows%'
      ])
      and parameter_mode = 'OUT'
      and parameter_name in ('email', 'phone', 'student_id', 'url', 'summary', 'review_note', 'auth_user_id')
  ) as ok;

select 'cm5c2_aggregation_security_metadata_assertions_passed' as check_name, true as ok;

rollback;
