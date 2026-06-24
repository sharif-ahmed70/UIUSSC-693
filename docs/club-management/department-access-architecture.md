# UIUSSC Department Access Architecture

## CM-2 Status

Phase CM-2 adds the first protected staff shell, server-side access-context query, centralized department route mapping, and placeholder workspaces for the seven current departments. Department access is resolved from approved active memberships plus narrowly scoped platform-role checks. Client state, query parameters, and submitted form values are not trusted for authorization.

## CM-3 Status

Phase CM-3 adds controlled administration for department membership approval, role changes, primary department selection, department management, and platform-role management. Admin pages do not grant authority by hiding or showing navigation; every Server Action reloads trusted admin context and calls a database RPC that enforces permissions, transitions, history, and audit logging.

## CM-3.1 Status

The first-admin bootstrap remains operator-only and draft-only. The draft can now approve an eligible submitted/under-review profile and optional selected department request during the first-super-admin transaction, avoiding an impossible pre-approved-profile requirement.

## Leadership/Core Panel Status

Leadership is now modeled outside department membership. `club_positions` stores titles such as President and General Secretary, while `volunteer_club_positions` stores term-based assignments. Core Panel status does not imply `super_admin`; platform authority remains in `volunteer_platform_roles`.

Onboarding can now submit without a preferred department. In that case no department membership is created, `primary_department_id` stays null, and platform administrators can still use the staff dashboard.

The first administrator bootstrap confirmed this path in the linked development project: a club-wide executive can hold General Secretary and `super_admin` with no operational department membership.

## Departments

Initial departments:

- Blood Department (`blood`)
- Event Management (`event-management`)
- Volunteer Management (`volunteer-management`)
- Logistics (`logistics`)
- Graphics Design (`graphics-design`)
- Public Relations (`public-relations`)
- Human Resources (`human-resources`)

Departments must be database-driven, not a PostgreSQL enum, so new departments can be added without a database migration and archived departments retain historical references.

## Core Tables

CM-1 implemented these tables in `supabase/migrations/202606240002_club_management_foundation.sql`:

- `club_departments`
- `volunteer_profiles`
- `volunteer_department_memberships`
- `club_positions`
- `volunteer_club_positions`
- `volunteer_platform_roles`
- `volunteer_status_history`
- `department_membership_history`
- `club_audit_logs`

No staff UI, admin dashboard, login flow, department switcher UI, Blood tables, or Storage policy was implemented in CM-1.

### `club_departments`

Fields:

- `id`
- `name`
- `slug`
- `short_description`
- `status`: `active`, `inactive`, `archived`
- `display_order`
- `created_at`
- `updated_at`

### `volunteer_profiles`

Fields:

- `id`
- `auth_user_id` references Supabase Auth
- `full_name`
- `student_id`
- `email`
- `phone`
- `academic_department`
- `trimester`
- `blood_group`
- `profile_photo_path`
- `account_status`: `pending`, `approved`, `rejected`, `suspended`, `archived`
- `onboarding_status`: `profile_incomplete`, `submitted`, `under_review`, `approved`, `rejected`
- `primary_department_id`
- `joined_at`
- `approved_at`, `approved_by`
- `rejected_at`
- `suspended_at`
- `archived_at`
- timestamps

Supabase Auth stores credentials. Profile tables never store passwords, password hashes, generated passwords, or JWT secrets.

### `volunteer_department_memberships`

Fields:

- `id`
- `volunteer_profile_id`
- `department_id`
- `department_role`: `volunteer`, `coordinator`, `department_head`
- `membership_status`: `requested`, `under_review`, `approved`, `rejected`, `suspended`, `removed`
- `is_primary`
- `requested_at`
- `approved_at`, `approved_by`
- `rejected_at`, `rejection_reason`
- `suspended_at`
- `removed_at`
- timestamps

Rules:

- Users cannot approve themselves.
- Users cannot assign their own role.
- Browser-submitted role/status values are never trusted.
- Administration approves department and role.
- Historical membership references remain.

### `volunteer_platform_roles`

Preferred for trusted platform-wide roles:

- `super_admin`
- `club_admin`
- `membership_admin`
- `content_admin`
- `department_admin`

Trade-offs:

- Normalized table: best auditability and least frontend trust.
- Auth custom claims: useful as cached hints but must not be the only source of truth.
- Profile column: simpler, but weak for multiple roles and history.

Principle: database tables are the trusted authorization source. Auth claims may only cache hints.

### `club_positions` and `volunteer_club_positions`

Club positions describe UIUSSC organizational leadership. Volunteer club-position assignments track who currently holds a title, whether it is primary, and term boundaries.

Rules:

- General Secretary, President, and other Core Panel titles are not platform roles.
- Core Panel members normally receive `club_admin` only when application access is needed.
- A technical `super_admin` can keep that role independently through future club-position changes.
- General Secretary to President transition changes the active position assignment and preserves platform permissions.

Blood operational permissions are mapped from approved Blood Department membership:

- Blood volunteer: approved Blood membership with `department_role = volunteer`; limited operational read and assistance actions.
- Blood coordinator: approved Blood membership with `department_role = coordinator`; contact attempts, assignments, and workflow coordination.
- Blood admin: approved Blood membership with `department_role = department_head` or a platform admin role; Blood settings and operational management.

Do not create a second contradictory Blood role table unless a later permission model proves it is necessary.

## Histories and Audit

- `volunteer_status_history`
- `department_membership_history`
- `platform_role_history`
- `club_audit_logs`

Role/status changes must include actor, previous value, new value, reason, and timestamp.

## Post-Login Routing

- One approved department: route to that department dashboard.
- Multiple approved departments: route to `/staff` with approved department switcher.
- Platform admin or club admin, including club-wide executives without department membership: show `/staff` and administration shortcuts.
- Pending profile: `/staff/pending`.
- No approved department: `/staff/no-access`.
- Suspended account: deny protected access and show safe status message.

Do not rely only on client-side redirection. Every protected page and Server Action authorizes independently.

## Department Switcher

Show only:

- approved departments
- active departments
- non-suspended memberships

Display:

- department name
- department role
- primary department marker

Do not show requested, rejected, suspended, removed, inactive, or archived department access. Switching visible dashboard must not change database permissions.

## Authorization Helpers

Server-only helpers:

- `requireAuthenticatedUser()`
- `requireApprovedVolunteer()`
- `requirePlatformRole()`
- `requireDepartmentMembership()`
- `requireDepartmentRole()`
- `canAccessDepartment()`
- `canPerformBloodAction()`
- `requireBloodVolunteer()`
- `requireBloodCoordinator()`
- `requireBloodAdmin()`

Requirements:

- Use trusted database state.
- Use `auth.uid()` as the authenticated user anchor.
- Reject pending or rejected accounts.
- Reject suspended/archived accounts.
- Reject inactive departments.
- Reject suspended/removed department memberships.
- Never trust client-supplied roles.
- Never trust URL parameters as authorization proof.
- Return minimal safe authorization context.
- Avoid duplicated authorization logic.

RLS recursion risk must be handled deliberately. If policies need helper functions, use minimal boolean `SECURITY DEFINER` functions only after review, set `search_path`, schema-qualify references, revoke default `execute` from `public`, and grant only to intended roles. Do not create broad data-returning security-definer functions.

## First Super Admin Bootstrap

The first trusted super admin is assigned by an operator-only SQL draft:

`supabase/drafts/202606240001_bootstrap_super_admin.sql`

The process requires an existing Supabase Auth user UUID, manual execution by the database owner or trusted operator, an audit log entry, and a placeholder replacement. It is never exposed through a browser form, never run as a migration or seed, and does not leave a permanent public bootstrap function.

## RLS Model

- Public users may insert only approved public form columns.
- Public users may not read private blood/volunteer data.
- Volunteers may read own profile and own memberships.
- Volunteers may update limited safe own fields.
- Volunteers may not approve own profile, own department, or own role.
- Admin policies must reference trusted role/membership tables.
- Blood records are visible only to approved Blood Department members with appropriate role.
- Graphics/Event/Logistics/PR/HR members have no Blood access unless also approved in Blood Department.

CM-1 actual RLS scope:

- `club_departments`: anon/authenticated can read active department metadata only.
- `volunteer_profiles`: authenticated users can read, insert, and update only their own safe profile fields.
- `volunteer_department_memberships`: authenticated users can read own memberships and request membership in active departments with default `volunteer`/`requested` values.
- `volunteer_platform_roles`: no normal client policies or grants.
- `volunteer_status_history` and `department_membership_history`: authenticated users can read only their own related history.
- `club_audit_logs`: no normal client access.

Admin approval policies, platform-role management, suspension enforcement helpers, and cross-department authorization helpers are deferred to CM-2/CM-3.

## Department Interface Roadmap

- Blood Department: request queue, verification, secure donor database, potential-donor matching, contact attempts, assignments, donation history, notifications, audit.
- Event Management: event planning, task assignment, timeline, event registration review, venue coordination.
- Volunteer Management: volunteer pool, event volunteer assignment, attendance, coordination.
- Logistics: inventory, transportation, resource allocation, event logistics tasks.
- Graphics Design: design-request queue, asset assignment, file submission, approval workflow.
- Public Relations: communication tasks, campaign content, collaboration records, publicity workflow.
- Human Resources: membership review, volunteer approval, department assignment, attendance, status, performance records.

## Permission Matrix

| Capability | Pending volunteer | Approved volunteer | Dept volunteer | Dept coordinator | Dept head | Membership admin | Content admin | Club admin | Super admin | Blood volunteer | Blood coordinator | Blood admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View own profile | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Update safe own profile | Limited | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View own memberships | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Request department membership | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Review applications | No | No | No | No | No | Yes | No | Yes | Yes | No | No | No |
| Approve volunteer | No | No | No | No | No | Yes | No | Yes | Yes | No | No | No |
| Assign department | No | No | No | No | No | Yes | No | Yes | Yes | No | No | No |
| Assign department role | No | No | No | No | Department-scoped | Yes | No | Yes | Yes | No | Blood-scoped | Blood-scoped |
| Assign platform role | No | No | No | No | No | No | No | Club-level | Yes | No | No | No |
| Suspend volunteer | No | No | No | No | No | Yes | No | Yes | Yes | No | No | No |
| View blood request | No | No | No | No | No | No | No | Yes | Yes | Limited | Yes | Yes |
| Verify blood request | No | No | No | No | No | No | No | Yes | Yes | No | Yes | Yes |
| View donor contact | No | No | No | No | No | No | No | Yes | Yes | Limited | Yes | Yes |
| Match donors | No | No | No | No | No | No | No | Yes | Yes | Limited | Yes | Yes |
| Contact donor | No | No | No | No | No | No | No | Yes | Yes | No | Yes | Yes |
| Assign donor | No | No | No | No | No | No | No | Yes | Yes | No | Yes | Yes |
| Confirm donation | No | No | No | No | No | No | No | Yes | Yes | No | Yes | Yes |
| Manage events | No | No | Event-scoped | Event-scoped | Event-scoped | No | Content-scoped | Yes | Yes | No | No | No |
| Manage logistics | No | No | Logistics-scoped | Logistics-scoped | Logistics-scoped | No | No | Yes | Yes | No | No | No |
| Submit graphics | No | No | Graphics-scoped | Graphics-scoped | Graphics-scoped | No | No | Yes | Yes | No | No | No |
| Manage public relations | No | No | PR-scoped | PR-scoped | PR-scoped | No | Content-scoped | Yes | Yes | No | No | No |
| Manage HR | No | No | No | No | HR-scoped | Yes | No | Yes | Yes | No | No | No |
| Manage club settings | No | No | No | No | No | No | No | Limited | Yes | No | No | No |
| View audit logs | No | No | No | No | Department-scoped | HR-scoped | Content-scoped | Yes | Yes | Blood-scoped minimal | Blood-scoped | Blood-scoped |
