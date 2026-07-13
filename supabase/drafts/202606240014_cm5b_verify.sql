-- CM-5B event task foundation verification draft.
-- Use disposable rolled-back data in development only.

select 'event_department_tasks_exists' as check_name, to_regclass('public.event_department_tasks') is not null as ok;
select 'event_task_assignees_exists' as check_name, to_regclass('public.event_task_assignees') is not null as ok;
select 'event_task_status_history_exists' as check_name, to_regclass('public.event_task_status_history') is not null as ok;
select 'event_task_assignee_history_exists' as check_name, to_regclass('public.event_task_assignee_history') is not null as ok;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('event_department_tasks', 'event_task_assignees', 'event_task_status_history', 'event_task_assignee_history');

select n.nspname as schema_name, p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_event_department_task',
    'update_event_department_task',
    'assign_event_task_member',
    'revoke_event_task_member',
    'update_own_event_task_progress',
    'change_event_task_status',
    'complete_event_department_task',
    'cancel_event_department_task'
  );

select 'existing_public_event_count' as check_name, count(*) as value from public.events;
select 'published_notice_count' as check_name, count(*) as value from public.notices where status = 'published';
select 'published_gallery_count' as check_name, count(*) as value from public.gallery_items where status = 'published';

-- Manual rolled-back workflow:
-- begin;
-- create task under an active event_department_assignment using create_event_department_task.
-- assign approved same-department member with assign_event_task_member.
-- verify duplicate active member and duplicate primary fail.
-- verify invalid department member fails.
-- update progress/status as assigned executive.
-- verify blocked requires reason and ready_for_review does not require evidence.
-- complete task as authorized Head/Deputy/Admin and confirm progress becomes 100.
-- rollback;
