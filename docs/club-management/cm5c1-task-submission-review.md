# CM-5C1 Task Submission And Review

CM-5C1 adds task work submission, safe external evidence links, review, revision, approval, and withdrawal on top of CM-5B tasks.

## Lifecycle

An active task assignee updates progress to 100 percent, submits a summary and optional evidence links, and the task moves to `ready_for_review`. A Department Head, Deputy Head, or authorized operational reviewer may approve the submission or request revision. Approval completes the task. Revision returns the task to `in_progress`.

Completed and cancelled CM-5B tasks remain terminal.

## Evidence Links

Evidence uses external HTTPS links only. The database rejects unsafe schemes and URLs that include common token or secret query parameters. Evidence link rows are retained with the submission and are not publicly exposed.

## Versioning

Submission numbers are assigned server-side per task. A new submission after revision supersedes the previous revision-requested submission while retaining history and evidence.

## Reviewer Rules

Reviewers must be approved active users with `tasks.review` or own-department Head/Deputy authority. A submitter cannot approve or request revision on their own submission.

## Withdrawal

The original submitter or an authorized reviewer can withdraw an actionable submission with a reason. The task returns to active work and all history/evidence remains retained.

## Security

All workflow mutations use `submit_event_task_work`, `review_event_task_submission`, and `withdraw_event_task_submission`. Direct table writes are not granted. RLS follows parent task visibility.

CM-5C2 may add broader review dashboards and analytics. Human role-session testing remains a release gate.
