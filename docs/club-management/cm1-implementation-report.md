# CM-1 Implementation Report

## Migration

- Active migration: `supabase/migrations/202606240002_club_management_foundation.sql`
- Applied to linked development project: `tuuwvcujoarfqhwiaeno`
- Combined Blood/Club draft preserved under `supabase/drafts/202606240001_club_management_blood_support.sql`

## Tables

- `club_departments`
- `volunteer_profiles`
- `volunteer_department_memberships`
- `volunteer_platform_roles`
- `volunteer_status_history`
- `department_membership_history`
- `club_audit_logs`

No Blood Support tables, notification tables, proof Storage buckets, or Blood policies were created.

## Constraints

- Department slug is unique, normalized lowercase, and non-enum.
- Volunteer profile has one `auth_user_id` per profile.
- Student ID is strictly unique when present and nonblank.
- Email is unique when present and nonblank.
- Phone is normalized and indexed for future duplicate review, but not strict unique.
- Department membership has one record per volunteer and department.
- One approved primary department per volunteer.
- One active primary request per volunteer.
- Platform roles prevent duplicate active role for the same volunteer.
- Self-approval/self-assignment checks exist where applicable.

## Indexes

Indexes cover department status/order, profile auth/status/onboarding/identity, memberships by volunteer/department/status/role, active-role uniqueness, status histories, and audit actor/action/entity/department/time lookups.

## RLS Policies

- Public can read active department metadata.
- Authenticated users can read own volunteer profile.
- Authenticated users can insert own volunteer profile with pending/profile-incomplete defaults.
- Authenticated users can update safe own profile fields only.
- Authenticated users can read own department memberships.
- Authenticated users can request active department membership with default volunteer/requested state.
- Authenticated users can read own volunteer status history.
- Authenticated users can read own department membership history.

No broad admin policies were added.

## Grants

- `anon`: column-level SELECT on safe active department metadata only.
- `authenticated`: safe department metadata, own profile read/insert/update columns, own membership read/request columns, own history read columns.
- No normal client grants for platform roles or audit logs.

## Seeded Departments

- Blood Department
- Event Management
- Volunteer Management
- Logistics
- Graphics Design
- Public Relations
- Human Resources

## Remote Verification

- Seven CM-1 tables exist.
- Seven initial departments exist.
- RLS is enabled on all seven CM-1 tables.
- Active super admin count is `0`.
- No `blood_%` tables exist.
- Existing public-content counts remained unchanged: events `4`, notices `3`, gallery items `4`.

## Deferred Items

- Supabase Auth login/logout UI.
- Account invitation.
- Staff shell.
- Department switcher UI.
- Admin review and approval policies.
- Authorization helper functions.
- Disposable authenticated RLS tests.
- Blood Support schema.
- Private proof Storage.
- Rate limiting and CAPTCHA provider choice.

## Rollback Considerations

This migration adds new isolated Club Management tables and seed metadata. Existing UIUSSC public tables are not modified. If rollback is required before real volunteer onboarding begins, drop the new CM-1 tables in reverse dependency order. Once real volunteer data exists, prefer archival and corrective migrations over destructive removal.

## Next Phase Prerequisites

- Decide operator process for first super admin using the existing bootstrap draft.
- Implement CM-2 authorization helpers and Auth flows.
- Create disposable test users for authenticated RLS verification.
