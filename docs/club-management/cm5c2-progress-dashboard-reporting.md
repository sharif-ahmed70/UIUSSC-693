# CM-5C2 Progress Dashboard And Reporting

CM-5C2 adds role-scoped event and department progress dashboards, operational reporting, CSV export, and print-friendly event progress views.
CM-5C2.1 hardens the reporting math and makes dashboard filters/export filters functional.

## Metric Definitions

- Active task: status is not `completed` or `cancelled`.
- Overdue task: due date is before now and status is not `completed` or `cancelled`.
- Blocked task: status is `blocked`.
- Unassigned task: no active task assignee.
- Pending review: latest submission is `submitted` or `under_review`.
- Revision requested: latest submission is `revision_requested`.
- Completion percentage: completed non-cancelled tasks divided by all non-cancelled tasks. No-task scopes return 0.
- Average progress: average `progress_percent` across non-cancelled tasks.
- Event counts are distinct event-operation counts. They are not multiplied by task count or assignment count.
- Awaiting-approval events are counted by distinct event operation.

## Reporting Model

Dashboard totals are derived through read-only RPCs from event operations, department assignments, tasks, assignees, and submissions. No summary totals are stored on operational tables.
Event-level metrics start from authorized event operations, so zero-task events remain visible to authorized users. Department metrics start from authorized active department assignments, so zero-task assignments remain visible with explicit zero values and `has_no_tasks = true`. Cancelled tasks are excluded from denominators and averages.

The event detail pages use `get_single_event_progress_summary(p_operation_id)` instead of loading all event summaries and searching in application code.

## Filters

`/admin/event-progress` uses server-side URL filters for operational status, upcoming/past timeframe, department, and risk state. Filtering is for user experience only; authorization remains inside the reporting RPCs.

Supported risk filters are:

- `overdue`
- `blocked`
- `pending_review`
- `revision_requested`

## Staff Scope

The staff progress dashboard is role-aware:

- `personal`: executives and task assignees see their own assigned task scope.
- `department`: department heads and deputy heads see their approved active department scope, including team tasks and unassigned work.
- `global`: operational admins see permitted cross-department progress.

## CSV Security

The CSV exports are generated server-side, use the actor's scoped report rows, accept the same safe filters as the dashboard, and exclude private contact/member/submission/evidence data.

- Event report: event, date, operational status, department, lead/support, assignment status, task totals, progress, risk counts, and next deadline.
- Task report: event, department, task title, priority, status, progress, due date, overdue yes/no, assigned/unassigned state, and latest submission status.

CSV cells beginning with `=`, `+`, `-`, or `@` are prefixed to prevent spreadsheet formula execution. Export audit metadata stores report type, safe filter summary, authorized scope, and row count only. It does not log CSV content.

## Print Behavior

The event progress detail page is browser-print friendly. Navigation and controls are hidden through print styling; no PDF generation is performed.

## Access

Access is scoped by existing CM-4 permissions and CM-5 task visibility helpers. Executives see their own task progress. Department leaders see their own department. Operational admins see permitted broader progress.

## Tests

Automated SQL drafts:

- `supabase/drafts/202606240017_cm5c2_hardening_verify.sql`
- `supabase/drafts/202606240017_cm5c2_hardening_security_tests.sql`

These verify function contracts, public/anon execute revocation, fixed search paths, and sensitive report-column absence where database metadata can prove it.

Human authenticated role-matrix testing remains a release gate for browser-visible Super Admin, Department Head/Deputy, Executive, and unrelated member behavior.
