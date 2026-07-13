-- CM-5A security test draft.
-- Execute with representative anon, ordinary volunteer, department, VP/GS, President, and Super Admin sessions.
-- Do not run as database owner and claim anon/RLS behavior.

-- Anon/public expectations:
-- select from club_event_operations;                         -- denied/no rows
-- select from event_department_assignments;                  -- denied/no rows
-- select from club_event_operation_history;                  -- denied/no rows
-- select from event_department_assignment_history;           -- denied/no rows
-- select internal_summary from club_event_operations limit 1; -- not publicly readable

-- Existing public content remains readable:
select count(*) as published_public_events
from public.events
where status = 'published';

-- Direct writes are denied for non-RPC paths:
-- insert into public.club_event_operations(event_id, operational_status) values ('00000000-0000-0000-0000-000000000000', 'draft');
-- update public.event_department_assignments set assignment_status = 'completed';
-- delete from public.event_department_assignments;

-- Scoped access expectations:
-- 1. Ordinary approved volunteer with no assignment sees no broad operation records.
-- 2. Department Head/Deputy/Executive can read only matching active assigned event operations.
-- 3. Department Head/Deputy can update own assignment status through change_event_department_assignment_status.
-- 4. Executive can read assignment but cannot update status.
-- 5. Temporary event-scoped allow works for supported permissions while active.
-- 6. Expired/revoked event-scoped temporary access fails immediately.
-- 7. VP/GS cannot directly cancel approved/published/active operations; request is routed through approval.
-- 8. Requester cannot approve or execute their own cancellation request.
-- 9. Blood support tables and RLS behavior are unchanged by this migration.
