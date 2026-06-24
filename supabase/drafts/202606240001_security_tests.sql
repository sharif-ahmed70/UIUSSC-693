-- UIUSSC draft security-test plan.
-- Do not run as database owner and claim anon/authenticated behavior is proven.
-- Execute with real anon/authenticated clients or Supabase CLI role-specific testing.

-- 1. Public insert behavior
-- Execute with an anon publishable-key client, not database owner.
-- Expect: anon can insert allowed public columns into blood_requests with database-generated
-- public_reference, verification_status = pending, workflow_status = submitted, and units_fulfilled = 0.
-- Expect: anon cannot set assigned_staff_id, verification_status, workflow_status,
-- units_fulfilled, public_reference, archived_at, timestamps, or staff-only fields.
-- Expect: anon can insert allowed donor-interest columns into blood_donors.
-- Expect: anon cannot set donor verification_status, verified_by, verified_at,
-- private_staff_notes, active approval fields, archived_at, timestamps, or trusted availability.

-- 2. Public read denial
-- Expect: anon SELECT from blood_donors returns no rows or permission denial.
-- Expect: anon SELECT from blood_requests returns no rows or permission denial.
-- Expect: anon SELECT from assignments/contact attempts/donation history is denied.

-- 3. Unapproved volunteer denial
-- Create a Supabase Auth test user with volunteer_profile.account_status = pending.
-- Expect: protected staff pages/actions deny Blood Department data access.

-- 4. Wrong-department denial
-- Create approved Graphics Design member only.
-- Expect: no donor records, requester phone, proof paths, assignments, or contact attempts are readable.

-- 5. Suspended-user denial
-- Mark approved Blood member as suspended.
-- Expect: all protected blood reads/writes are denied immediately.

-- 6. Blood Department approved-user access
-- Create approved Blood Department volunteer/coordinator/department_head profiles.
-- Expect: access varies by role:
-- Blood volunteer can view limited request/donor operational records.
-- Blood coordinator can create contact attempts and assignments.
-- Blood department_head can manage Blood Department settings and operational records.

-- 7. Privilege escalation rejection
-- Attempt to update own profile to approved.
-- Attempt to approve own department membership.
-- Attempt to assign own platform role.
-- Attempt to submit browser-provided role/status fields.
-- Attempt to forge a department switcher target or URL param for a department not approved for the user.
-- Expect: all denied.

-- 8. Proof-storage privacy
-- Attempt to read private proof object without signed URL.
-- Expect: denied.
-- Attempt signed URL generation as wrong department.
-- Expect: denied.

-- 9. Audit behavior
-- Verify sensitive actions create club_audit_logs records with safe metadata only.

-- 10. Notification privacy
-- Attempt to enqueue payload containing password/token/service_role_key keys.
-- Expect: rejected by constraint or validation.

-- 11. Status-transition controls
-- Attempt direct submitted -> fulfilled transition through ordinary client update.
-- Expect: denied. Only reviewed trusted transition mechanism may perform this atomically.
