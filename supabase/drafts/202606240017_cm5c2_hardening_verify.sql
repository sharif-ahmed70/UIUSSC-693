-- CM-5C2.1 executable verification checks.
-- Development only. Uses metadata assertions and transaction-safe probes.

begin;

do $$
declare
  v_public_execute_count integer;
  v_bad_search_path_count integer;
begin
  if to_regprocedure('public.get_operational_event_dashboard(text,text,uuid,text)') is null then
    raise exception 'missing get_operational_event_dashboard filter overload';
  end if;

  if to_regprocedure('public.get_event_progress_summary(text,text,uuid,text,integer,integer)') is null then
    raise exception 'missing get_event_progress_summary filter overload';
  end if;

  if to_regprocedure('public.get_single_event_progress_summary(uuid)') is null then
    raise exception 'missing get_single_event_progress_summary';
  end if;

  if to_regprocedure('public.get_event_task_progress_report_rows(text,text,uuid,text,uuid,integer)') is null then
    raise exception 'missing get_event_task_progress_report_rows';
  end if;

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
    raise exception 'PUBLIC execute privilege is still present on % reporting function(s)', v_public_execute_count;
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
end $$;

select
  'published_public_content_counts' as check_name,
  (select count(*) from public.events where status = 'published') as published_events,
  (select count(*) from public.notices where status = 'published') as published_notices,
  (select count(*) from public.gallery_items where status = 'published') as published_gallery;

select
  'cm5c2_function_contracts' as check_name,
  to_regprocedure('public.get_operational_event_dashboard(text,text,uuid,text)') is not null as dashboard_ok,
  to_regprocedure('public.get_event_progress_summary(text,text,uuid,text,integer,integer)') is not null as summary_ok,
  to_regprocedure('public.get_event_department_progress(uuid)') is not null as department_ok,
  to_regprocedure('public.get_event_task_progress_report_rows(text,text,uuid,text,uuid,integer)') is not null as task_report_ok;

rollback;
