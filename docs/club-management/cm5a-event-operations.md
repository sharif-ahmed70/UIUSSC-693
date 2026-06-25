# CM-5A Event Operations Foundation

CM-5A keeps `public.events` as the canonical public event record and adds an internal operational layer beside it.

## Data Model

- `club_event_operations` stores one internal operation per public event.
- `event_department_assignments` stores department responsibility, lead department, status, and due date.
- `club_event_operation_history` and `event_department_assignment_history` are append-only status histories.

Existing published event rows, slugs, registrations, and gallery relationships are preserved.

## Authorization

Event operations reuse the CM-4 permission catalogue:

- `events.view_internal`
- `events.create`
- `events.update`
- `events.publish`
- `events.cancel`
- `events.assign_departments`

Super Admin has full access through the existing override. President can directly manage high-risk event operations. VP/GS can create, update, and assign departments; approved/published/active cancellation is approval-gated. Department Head and Deputy can update their own assigned event responsibility. Executives have assigned-event visibility only.

## Controlled RPCs

The application uses controlled RPCs instead of direct writes:

- `create_club_event`
- `update_club_event_operation`
- `change_club_event_operational_status`
- `assign_event_department`
- `update_event_department_assignment`
- `change_event_department_assignment_status`
- `cancel_event_department_assignment`
- `publish_club_event`
- `complete_club_event`
- `request_club_event_cancellation`

Direct authenticated writes to the new internal tables are not granted.

## Admin And Staff UX

Admin routes:

- `/admin/events`
- `/admin/events/new`
- `/admin/events/[id]`

Staff route:

- `/staff/assigned-events`

The staff route relies on RLS and shows only assigned event records visible to the signed-in user.

## CM-5B Integration

CM-5B adds task counts to department assignments and links event operations to task management. Counts are derived from `event_department_tasks`; no summary totals are stored on CM-5A assignment rows.

CM-5C2 adds event progress reporting and print-friendly progress detail views. Progress metrics are derived from assignments, tasks, assignees, and submissions rather than stored on event operation rows.
