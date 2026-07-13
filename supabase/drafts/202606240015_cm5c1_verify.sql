-- CM-5C1 task submission/review verification draft.
-- Use rolled-back disposable data in development only.

select 'event_task_submissions_exists' as check_name, to_regclass('public.event_task_submissions') is not null as ok;
select 'event_task_submission_evidence_links_exists' as check_name, to_regclass('public.event_task_submission_evidence_links') is not null as ok;
select 'event_task_submission_history_exists' as check_name, to_regclass('public.event_task_submission_history') is not null as ok;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('event_task_submissions', 'event_task_submission_evidence_links', 'event_task_submission_history');

select n.nspname as schema_name, p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('submit_event_task_work', 'review_event_task_submission', 'withdraw_event_task_submission');

select 'public_event_count' as check_name, count(*) as value from public.events where status = 'published';
select 'published_notice_count' as check_name, count(*) as value from public.notices where status = 'published';
select 'published_gallery_count' as check_name, count(*) as value from public.gallery_items where status = 'published';

-- Manual rolled-back workflow:
-- begin;
-- create a disposable task with an active assignee.
-- set task progress to 100 through CM-5B RPC.
-- call submit_event_task_work with safe HTTPS evidence links.
-- review with request_revision and verify task returns to in_progress.
-- submit a new version and verify previous revision is superseded.
-- review with approve and verify task completes and assignees complete.
-- rollback;
