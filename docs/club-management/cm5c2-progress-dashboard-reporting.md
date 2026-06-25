# CM-5C2 Progress Dashboard And Reporting

CM-5C2 adds role-scoped event and department progress dashboards, operational reporting, CSV export, and print-friendly event progress views.

## Metric Definitions

- Active task: status is not `completed` or `cancelled`.
- Overdue task: due date is before now and status is not `completed` or `cancelled`.
- Blocked task: status is `blocked`.
- Unassigned task: no active task assignee.
- Pending review: latest submission is `submitted` or `under_review`.
- Revision requested: latest submission is `revision_requested`.
- Completion percentage: completed non-cancelled tasks divided by all non-cancelled tasks. No-task scopes return 0.
- Average progress: average `progress_percent` across non-cancelled tasks.

## Reporting Model

Dashboard totals are derived through read-only RPCs from event operations, department assignments, tasks, assignees, and submissions. No summary totals are stored on operational tables.

## CSV Security

The CSV export is generated server-side, uses the actor's scoped report rows, excludes private contact/member/submission/evidence data, and escapes cells that begin with formula-triggering characters.

## Print Behavior

The event progress detail page is browser-print friendly. Navigation and controls are hidden through print styling; no PDF generation is performed.

## Access

Access is scoped by existing CM-4 permissions and CM-5 task visibility helpers. Executives see their own task progress. Department leaders see their own department. Operational admins see permitted broader progress.

Human authenticated role-matrix testing remains a release gate.
