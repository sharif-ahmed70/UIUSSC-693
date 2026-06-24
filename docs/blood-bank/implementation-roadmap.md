# Blood Support and Club Management Implementation Roadmap

## CM-2 Dependency Update

The Blood Department now has a protected placeholder workspace at `/staff/blood` through the club-management auth/onboarding foundation. The final Blood Support schema, donor/request workflows, matching, contact attempts, and donation history remain deferred and were not implemented in CM-2.

## CM-3 Dependency Update

Secure administration, volunteer verification, department membership review, department role management, platform-role management, and audit-log viewing are now implemented structurally. No Blood Support tables, donor workflows, matching logic, or donation history were added in CM-3.

## CM-3.1 Gate

Before BB-1 begins, bootstrap one real UIUSSC super administrator in the linked development project and complete live authenticated admin verification. CM-3.1 did not add Blood tables or Blood workflows.

## Leadership/Core Panel Gate

The leadership/Core Panel foundation adds club-position tables, Core Panel assignment workflows, optional no-department onboarding, and first-admin bootstrap support for a General Secretary plus technical `super_admin`. It does not add Blood Support tables, donor workflows, matching logic, or donation history.

Database bootstrap has been completed in the linked development project with no Blood tables created. BB-1 should still wait for human authenticated browser verification of login, Staff Dashboard, Admin Dashboard, and logout behavior.

The Club Positions admin catalogue and assignment-action UX have been corrected without creating Blood tables. BB-1 should still wait until the human operator confirms logout/re-login behavior and captures any required sanitized authenticated UI screenshots from their own browser session.

The later RSC boundary fix changed only Club Positions form composition. It did not create Blood tables or Blood workflows.

## Club Management Acceptance Gate

Human-authenticated Club Management acceptance has passed for login, Staff Dashboard, Admin access, Club Positions, logout redirects, and re-login. Machine checks confirm no Blood tables exist and the public site still builds and serves the expected content.

BB-1 may begin after the team accepts that authenticated responsive screenshots/storage inspection remain human-session-only QA tasks and must not expose password, tokens, cookies, full email, UUID, student ID, or private records.

Do not deploy the entire large schema in one risky operation if phased migrations are safer. The current SQL lives in `supabase/drafts/` for review only.

## Phase CM-1

Migration draft: `202606240001a_club_management_foundation.sql` or the club-management section of `202606240001_club_management_blood_support.sql`.

Status: implemented in `supabase/migrations/202606240002_club_management_foundation.sql`.

- Applied department/profile/membership/platform-role/history/audit foundation.
- Seeded only non-personal department records.
- No staff UI yet.
- No broad admin RLS policies; authorization helpers remain deferred.

## Phase CM-2

Status: implemented in `supabase/migrations/202606240003_club_auth_onboarding.sql` and the protected staff routes.

- Added Supabase Auth login/logout.
- Added password recovery and callback handling.
- Added volunteer onboarding with controlled department request RPC.
- Added pending/no-access/access-status pages.
- Added server-only authorization helpers.
- Added protected staff shell.
- Added department switcher.
- Added protected placeholder department workspaces.
- Deferred account invitation sender to the admin phase.
- Deferred disposable-user authenticated RLS flow tests until a pre-approved development Auth user exists.

## Phase CM-3

- Add HR/admin review interface.
- Add volunteer approval.
- Add department assignment.
- Add department-role and platform-role management.
- Add audit views for role/status changes.

## Phase BB-1

Status: implemented in `supabase/migrations/202606240008_blood_support_foundation.sql` with follow-up `supabase/migrations/202606240009_blood_fulfilment_function_fix.sql`.

- Add Blood database foundation.
- Add RLS.
- Add indexes.
- Generate Supabase database types after migration review and application.
- Public intake remains disabled.
- No Storage bucket, public Blood UI, donor seed, request seed, or legacy import was added.

## CM-4 Dependency Note

CM-4 renames Blood Department operational roles to the real UIUSSC department structure: Executive, Deputy Head, and Department Head. BB-1 authorization helpers were updated to use `executive`, `deputy_head`, and `department_head`; public Blood intake remains disabled and BB-2 remains paused.

## Phase BB-2

- Add public Blood landing page.
- Add blood request form.
- Add donor-interest registration.
- Add private proof upload flow.
- Add honeypot, Zod validation, phone normalization, and friendly duplicate handling.

## Phase BB-3

- Add Blood request queue.
- Add donor database.
- Add proof review with signed URLs.

## Phase BB-4

- Add matching.
- Add contact attempts.
- Add assignments.
- Add controlled workflow transitions.

## Phase BB-5

- Add verified donation transaction.
- Add units fulfilment.
- Add donor history.
- Add donor availability updates after verified donation result.

## Phase BB-6

- Add notification outbox.
- Add bulk import dry-run and confirmed import.
- Add audit and reporting.
- Consider `blood_donor_import_jobs` and `blood_donor_import_rows` if import volume or audit requirements justify them.

## Phase BB-7

- Add CAPTCHA.
- Add rate limiting.
- Add retention/archive workflows.
- Add privacy review.
- Add operational QA.
