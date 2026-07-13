-- CM-5C2.1 security hardening: explicitly deny anon execution on progress reporting RPCs.

revoke all on function public.cm5c2_filter_matches(text, date, uuid, boolean, boolean, boolean, boolean, text, text, uuid, text) from anon;
revoke all on function public.cm5c2_visible_assignments() from anon;
revoke all on function public.cm5c2_visible_tasks() from anon;
revoke all on function public.get_operational_event_dashboard(text, text, uuid, text) from anon;
revoke all on function public.get_event_progress_summary(text, text, uuid, text, integer, integer) from anon;
revoke all on function public.get_single_event_progress_summary(uuid) from anon;
revoke all on function public.get_event_department_progress(uuid) from anon;
revoke all on function public.get_my_task_progress_summary() from anon;
revoke all on function public.get_event_progress_report_rows(text, text, uuid, text, integer) from anon;
revoke all on function public.get_event_task_progress_report_rows(text, text, uuid, text, uuid, integer) from anon;
revoke all on function public.get_event_task_risk_rows(uuid, text, integer) from anon;

revoke all on function public.cm5c2_filter_matches(text, date, uuid, boolean, boolean, boolean, boolean, text, text, uuid, text) from public;
revoke all on function public.cm5c2_visible_assignments() from public;
revoke all on function public.cm5c2_visible_tasks() from public;
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
