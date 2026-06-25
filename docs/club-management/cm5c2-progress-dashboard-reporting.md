# CM-5C2 Progress Dashboard And Reporting

CM-5C2 adds role-scoped event and department progress dashboards, operational reporting, CSV export, and print-friendly event progress views.
CM-5C2.1 hardens the reporting math and makes dashboard filters/export filters functional.
CM-5C2.2 fixes an event-level aggregation integrity issue where raw assignment rows and raw task rows could multiply each other when joined at event scope.

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
- Department assignment counts are active, non-cancelled assignment counts.
- Task counts count each non-cancelled task exactly once, regardless of assignee count or submission history count.

## Reporting Model

Dashboard totals are derived through read-only RPCs from event operations, department assignments, tasks, assignees, and submissions. No summary totals are stored on operational tables.
Event-level metrics start from authorized event operations, so zero-task events remain visible to authorized users. Department metrics start from authorized active department assignments, so zero-task assignments remain visible with explicit zero values and `has_no_tasks = true`. Cancelled tasks are excluded from denominators and averages.

CM-5C2.2 uses pre-aggregated CTEs:

- one base event-operation row per operation
- one assignment metric row per operation
- one task metric row per operation
- final joins only between these one-row-per-operation aggregates

Raw assignment rows and raw task rows are never joined directly at event scope. This prevents a case like two assignments and three tasks from becoming six task rows.

The event detail pages use `get_single_event_progress_summary(p_operation_id)` instead of loading all event summaries and searching in application code.

## Filters

`/admin/event-progress` uses server-side URL filters for operational status, upcoming/past timeframe, department, and risk state. Filtering is for user experience only; authorization remains inside the reporting RPCs.

Department-filter semantics:

- An event appears only when the selected department is assigned to that event.
- `assigned_department_count` is the count inside the filtered department scope.
- Task metrics are calculated only from tasks owned by the selected department.
- Other departments remain authorized only through RPC visibility checks, but they do not contribute to the filtered event metrics.

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
- `supabase/drafts/202606240020_cm5c2_aggregation_verify.sql`
- `supabase/drafts/202606240020_cm5c2_aggregation_security_tests.sql`

These verify function contracts, public/anon execute revocation, fixed search paths, and sensitive report-column absence where database metadata can prove it.

The CM-5C2.2 aggregation test creates disposable rows in a rolled-back transaction and verifies:

- two assignments plus three tasks remain `assigned_department_count = 2` and `total_tasks = 3`
- one task with multiple assignees counts once
- multiple submissions use the latest submission state where intended
- zero-task events and zero-task department assignments remain visible with zero metrics
- status, timeframe, department, and risk filters operate on corrected metrics
- task report rows are one row per task
- event CSV/report rows are one row per event/department assignment

Human authenticated role-matrix testing remains a release gate for browser-visible Super Admin, Department Head/Deputy, Executive, and unrelated member behavior.
