# Blood Support and Club Management Implementation Roadmap

Do not deploy the entire large schema in one risky operation if phased migrations are safer. The current SQL lives in `supabase/drafts/` for review only.

## Phase CM-1

Migration draft: `202606240001a_club_management_foundation.sql` or the club-management section of `202606240001_club_management_blood_support.sql`.

Status: implemented in `supabase/migrations/202606240002_club_management_foundation.sql`.

- Applied department/profile/membership/platform-role/history/audit foundation.
- Seeded only non-personal department records.
- No staff UI yet.
- No broad admin RLS policies; authorization helpers remain deferred.

## Phase CM-2

- Add Supabase Auth login/logout.
- Add account invitation.
- Add pending/no-access pages.
- Add server-only authorization helpers.
- Add protected staff shell.
- Add department switcher.
- Add disposable-user authenticated RLS test coverage for own-profile and own-membership flows.

## Phase CM-3

- Add HR/admin review interface.
- Add volunteer approval.
- Add department assignment.
- Add department-role and platform-role management.
- Add audit views for role/status changes.

## Phase BB-1

Migration draft: `202606240001b_blood_support_foundation.sql` or the Blood Support section of `202606240001_club_management_blood_support.sql`.

- Add Blood database foundation.
- Add private proof bucket draft.
- Add RLS.
- Add indexes.
- Generate Supabase database types after migration review and application.

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
