-- CM-5C2.1 security assertions.
-- Development only. Run with a database role that can inspect metadata.
-- Human authenticated browser role checks remain separate because they require real sessions.

begin;

do $$
declare
  v_anon_execute_count integer;
  v_authenticated_execute_count integer;
begin
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
    raise exception 'anon execute privilege is present on % reporting function(s)', v_anon_execute_count;
  end if;

  select count(*) into v_authenticated_execute_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'get_operational_event_dashboard',
      'get_event_progress_summary',
      'get_single_event_progress_summary',
      'get_event_department_progress',
      'get_my_task_progress_summary',
      'get_event_progress_report_rows',
      'get_event_task_progress_report_rows',
      'get_event_task_risk_rows'
    )
    and has_function_privilege('authenticated', p.oid, 'execute');

  if v_authenticated_execute_count < 8 then
    raise exception 'authenticated reporting execute grants are incomplete: %', v_authenticated_execute_count;
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

select
  'human_browser_tests_pending' as check_name,
  'Requires authenticated Super Admin, Department Head/Deputy, Executive, and unrelated member sessions.' as note;

rollback;
