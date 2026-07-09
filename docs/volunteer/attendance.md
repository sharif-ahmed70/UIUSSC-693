# Volunteer Department Attendance

## Route

The Volunteer Department dashboard is available at:

`/staff/volunteer/dashboard`

The page is protected by the staff layout and the existing department access rules. Members of the `volunteer-management` department can access it. Club-level operational roles can also access it through the existing oversight checks.

## Event Selection Logic

The dashboard event selector loads data from `get_active_events(p_department_id)`.

The selector shows:

- Existing department attendance events.
- Assigned department events that do not yet have an attendance event.
- A manual input for missing meetings or sessions.

When a missing event or meeting is saved, the server action calls:

`create_missing_event(name, date)`

The newly created attendance event is auto-selected by redirecting back to the dashboard with `eventId`.

## Attendance Workflow

Attendance records are loaded through:

`fetch_event_members(event_id, attendance_type)`

Each row includes:

- Database-assigned department serial.
- Profile picture path.
- Name.
- Student ID.
- Member type.
- Current attendance status.
- Remarks.
- Booth attendance records.

The UI keeps Present and Absent mutually exclusive. Saving attendance calls the server action, which submits a JSON array to:

`save_attendance(event_id, attendance_type, attendance_data)`

The RPC validates department scope, upserts records, stores `recorded_by`, stores `recorded_at`, and writes an audit log.

## Booth vs Meeting Attendance

Meeting attendance is stored in `volunteer_attendance` with `attendance_type = 'meeting'` and `time_slot = null`.

Booth attendance is stored in `volunteer_attendance` with `attendance_type = 'booth'` and a required `tsrange` `time_slot`. This supports multiple booth rows per member for different time slots.

## Metrics Calculation

Dashboard metrics are loaded through:

`fetch_attendance_metrics(event_id)`

Metrics include:

- Total members.
- Present count.
- Absent count.
- Unmarked count.
- Most active member.
- Most irregular member.

The active and irregular calculations use historical attendance rows for the selected department.

## Search, Filter, and Pagination

The attendance table runs client-side search and pagination for responsive use.

Supported filters:

- Member type: All, General, Panel.
- Search: name, serial number, student ID.
- Page size: 25 rows.

This keeps the UI usable for large departments while preserving the database RPC as the source of truth.

## Supabase RPCs

The exact attendance API migration adds:

- `volunteer_events`
- `volunteer_attendance`
- `fetch_volunteer_events()`
- `create_missing_event(name, date)`
- `fetch_event_members(event_id, attendance_type)`
- `save_attendance(event_id, attendance_type, attendance_data)`
- `fetch_attendance_metrics(event_id)`

Authorization helpers:

- `volunteer_department_id()`
- `can_view_volunteer_event(event_id)`
- `can_manage_volunteer_event_attendance(event_id)`
- `can_view_volunteer_department(p_department_id)`
- `can_manage_volunteer_department_attendance(p_department_id)`

## Role-Based Access

Normal approved Volunteer Department members can view their department dashboard.

Attendance write access is limited to:

- Club administrators / volunteer managers through existing `can_manage_volunteers()`.
- Users with department-scoped event update permission.
- Volunteer Department head, deputy head, or coordinator.

Blood support is read-only in this dashboard. Normal members only see assignments visible to their scope. Authorized blood staff and department managers can see broader assignment summaries according to existing RLS and RPC checks.

## Integrated Modules

The page includes:

- Attendance.
- Assigned task snapshot.
- Event participation preview.
- Committee membership overview.
- Blood support assignment overview.
- Notifications.

All dynamic reads go through existing Supabase clients and scoped RPCs.
