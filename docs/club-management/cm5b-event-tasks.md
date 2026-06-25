# CM-5B Event Tasks

CM-5B breaks a CM-5A department event assignment into operational tasks. It does not add evidence uploads, comments, attendance, finance, notifications, or formal submission review.

## Lifecycle

Tasks move through:

- `draft`
- `assigned`
- `in_progress`
- `blocked`
- `ready_for_review`
- `completed`
- `cancelled`

Draft tasks start at 0 percent. Assigning the first active member moves the task to `assigned`. Completion sets progress to 100 percent. Cancelled and completed tasks cannot reopen in CM-5B.

## Roles

Department Head and Deputy Head can create, edit, assign, revoke, monitor, complete, and cancel tasks for their own department. Executives can view assigned tasks, update progress, and move allowed statuses. Core operational admins retain broader oversight through existing CM-4 task permissions.

## Assignees

Tasks support multiple active assignees. One active primary assignee is allowed per task; additional assignees use the contributor role. Assignees must be approved active members of the same department.

## Security

All task mutations use controlled RPCs. Direct authenticated inserts, updates, and deletes are not granted. RLS allows visibility only through effective permission, own department manager access, or active task assignment. History tables are append-only from application perspective.

## CM-5C Deferred

CM-5C1 adds summary submission, external evidence links, review, revision, approval, and withdrawal. Private file upload, Storage buckets, analytics dashboards, notifications, and broader review reporting remain deferred.
