-- CM-5A event operations verification draft.
-- Run against development only with a human admin session/context.

select 'existing_public_event_count' as check_name, count(*) as value
from public.events;

select 'event_operations_backfilled' as check_name, count(*) as value
from public.club_event_operations;

select 'missing_operations' as check_name, count(*) as value
from public.events e
where not exists (
  select 1 from public.club_event_operations ceo where ceo.event_id = e.id
);

select 'published_events_still_public' as check_name, count(*) as value
from public.events
where status = 'published';

select
  ceo.id as operation_id,
  e.title,
  e.slug,
  e.status as public_status,
  ceo.operational_status,
  e.registration_open
from public.club_event_operations ceo
join public.events e on e.id = ceo.event_id
order by e.event_date desc;

-- Expected manual workflow checks:
-- 1. create_club_event creates one events row and one club_event_operations row atomically.
-- 2. Duplicate operation per event is blocked by club_event_operations.event_id unique.
-- 3. Duplicate active department assignment per event+department is blocked.
-- 4. Duplicate active lead department per event is blocked.
-- 5. publish_club_event keeps the canonical public events row and sets published status.
-- 6. complete_club_event closes registration and retains the public event row.
-- 7. VP/GS cancellation of approved/published/active operations creates an approval request.
-- 8. President/Super Admin approved cancellation closes registration and retains cancellation reason.
-- 9. Existing public event slugs and gallery/event-registration relationships remain intact.
