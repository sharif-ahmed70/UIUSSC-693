-- CM-5C2 progress dashboard/reporting verification draft.
-- Use development only with representative authenticated sessions.

select 'get_operational_event_dashboard_exists' as check_name, to_regprocedure('public.get_operational_event_dashboard()') is not null as ok;
select 'get_event_progress_summary_exists' as check_name, to_regprocedure('public.get_event_progress_summary()') is not null as ok;
select 'get_event_department_progress_exists' as check_name, to_regprocedure('public.get_event_department_progress(uuid)') is not null as ok;
select 'get_my_task_progress_summary_exists' as check_name, to_regprocedure('public.get_my_task_progress_summary()') is not null as ok;
select 'get_event_progress_report_rows_exists' as check_name, to_regprocedure('public.get_event_progress_report_rows()') is not null as ok;

select n.nspname, p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'get_%progress%'
order by p.proname;

select 'published_events' as check_name, count(*) as value from public.events where status = 'published';
select 'published_notices' as check_name, count(*) as value from public.notices where status = 'published';
select 'published_gallery' as check_name, count(*) as value from public.gallery_items where status = 'published';

-- Manual checks:
-- 1. Cancelled tasks are excluded from completion denominator.
-- 2. No-task assignments are not shown as complete.
-- 3. Overdue means due_at < now() and status not completed/cancelled.
-- 4. Pending review means latest submission submitted/under_review.
-- 5. Revision requested means latest submission revision_requested.
-- 6. CSV export does not include private email, phone, student id, evidence URL, submission text, or review note.
