# Phase CM-3: Administration And Verification

Phase CM-3 adds the secure administration foundation for UIUSSC volunteer verification, department access management, platform-role management, and audit visibility.

## Permission Model

- `super_admin`: full CM-3 administration, platform-role assignment/revocation, department management, audit visibility.
- `club_admin`: volunteer/profile review, department membership management, department role management, department management, audit visibility. Cannot assign or revoke `super_admin`.
- `membership_admin`: membership application review, onboarding profile review, ordinary volunteer approval, ordinary department request approval.
- `content_admin`: reserved for future public content administration.
- `department_admin`: restricted department configuration role.
- Department roles were later normalized in CM-4 to `executive`, `deputy_head`, and `department_head`.

Department heads do not receive platform-role authority, cross-department authority, self-approval, or club-wide suspension authority.

## Admin Routes

- `/admin`
- `/admin/membership-applications`
- `/admin/membership-applications/[id]`
- `/admin/volunteers`
- `/admin/volunteers/[id]`
- `/admin/department-memberships`
- `/admin/departments`
- `/admin/club-positions`
- `/admin/platform-roles`
- `/admin/audit-logs`

`app/admin/layout.tsx` requires an authenticated approved volunteer and an actual admin permission. Unauthenticated users redirect to `/login?next=/admin`; authenticated non-admin users see a safe access-denied state.

## Workflows

Membership applications can be reviewed using the existing statuses: `pending`, `approved`, `rejected`, `waitlisted`, and `withdrawn`. Approval does not create an Auth account and does not send an invitation.

Volunteer profiles can be approved, rejected, suspended, and restored through controlled RPCs. Approval does not automatically approve department membership or assign platform roles.

Department memberships can be approved, rejected, suspended, removed, role-changed, and marked primary. Primary department changes update the membership row and `volunteer_profiles.primary_department_id` atomically.

Departments can be created, updated, deactivated, and archived. Archived departments are not physically deleted.

Platform roles can be assigned or revoked only by `super_admin`. The database prevents self-escalation, self-revocation, duplicate active roles, and revocation of the final active `super_admin`.

Club positions are managed separately at `/admin/club-positions`. Core Panel titles such as General Secretary and President can be assigned, completed, revoked, and marked primary without changing platform roles.

## RPC And RLS Approach

CM-3 uses narrow `SECURITY DEFINER` helper functions for boolean authorization checks to avoid RLS recursion. Admin actions use controlled RPCs instead of broad table `UPDATE` grants. RPCs validate the actor, lock target rows, enforce allowed transitions, write history where applicable, and append audit logs.

Key helpers include:

- `current_volunteer_profile_id`
- `has_active_platform_role`
- `has_any_active_platform_role`
- `has_active_department_role`
- `can_review_membership_applications`
- `can_manage_volunteers`
- `can_manage_departments`
- `can_manage_platform_roles`
- `can_view_audit_logs`

## History And Audit Logs

CM-3 adds `membership_application_status_history`. Volunteer profile changes use `volunteer_status_history`, department access changes use `department_membership_history`, and all controlled admin RPCs append to `club_audit_logs`.

Audit metadata must not contain tokens, passwords, service keys, session cookies, or sensitive raw payloads.

## Bootstrap Requirement

No administrator was seeded. The first `super_admin` must be bootstrapped manually by a trusted database operator using a real existing Supabase Auth user and an eligible volunteer profile that has completed onboarding. The draft remains at:

`supabase/drafts/202606240001_bootstrap_super_admin.sql`

The bootstrap must not be exposed through public routes, normal Server Actions, login, or onboarding.

CM-3.1 updates the draft so the trusted operator transaction can approve a submitted or under-review profile during the one-time first-admin bootstrap. The leadership update extends the draft so the selected real account can be assigned General Secretary as a primary club position and `super_admin` while keeping department selection optional.

The linked development project now has one bootstrapped `super_admin` assigned independently from the General Secretary club position. No operational department was assigned during bootstrap.

## Invitation Limitation

CM-3 intentionally does not implement invitation sending. Safe future options include:

- Supabase Auth admin invitation through a secure backend or Edge Function
- controlled one-time activation tokens
- provider-independent notification outbox

## Testing Limitation

The development project currently has no approved volunteer profile and no active `super_admin`, so live authenticated admin UI workflows are deferred. Build, migration, generated types, unauthenticated redirects, fake-claims denial checks, RLS/grant verification, and route regression checks are covered.

## Rollback Considerations

CM-3 is additive: one migration adds helper functions, policies, one history table, RPCs, grants, and indexes. Rollback should remove CM-3 RPCs/policies/history table only after confirming no admin audit/history data must be preserved.
