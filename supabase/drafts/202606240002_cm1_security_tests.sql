-- UIUSSC Phase CM-1 security test plan.
-- Do not run as database owner and claim RLS is proven.
-- Use anon publishable-key and disposable authenticated users when available.

-- Anon
-- 1. Active department metadata read succeeds for name/slug/short_description/display_order.
-- 2. Inactive or archived department rows are not visible.
-- 3. volunteer_profiles read is denied.
-- 4. volunteer_department_memberships read is denied.
-- 5. volunteer_platform_roles read is denied.
-- 6. history and audit reads are denied.
-- 7. inserts/updates/deletes on all CM-1 tables are denied.

-- Authenticated own profile
-- 1. Insert own profile using auth_user_id = auth.uid() succeeds with safe columns.
-- 2. Insert profile for another auth_user_id is denied.
-- 3. Own profile read succeeds.
-- 4. Another profile read is denied.
-- 5. Safe own profile update succeeds.
-- 6. account_status update is rejected by column grants.
-- 7. approved_by/rejected_by/suspended_by update is rejected by column grants.
-- 8. auth_user_id reassignment is rejected by column grants.

-- Department membership
-- 1. Own membership read succeeds.
-- 2. Another user's membership is denied.
-- 3. Self-request into an active department succeeds with default role=volunteer and status=requested.
-- 4. Self-approval is rejected.
-- 5. Self coordinator/department_head assignment is rejected by column grants and RLS check.
-- 6. Membership request into inactive/archived department is rejected or unavailable.

-- Platform roles
-- 1. Self role assignment is rejected.
-- 2. Other role read/write is denied.
-- 3. No public role enumeration is possible.
-- 4. No real super admin exists after migration.

-- Histories and audit
-- 1. Normal authenticated clients cannot insert/update/delete status history.
-- 2. Normal authenticated clients cannot insert/update/delete audit logs.
-- 3. A user may read own status history only.

-- Suspension behavior
-- Schema supports pending/approved/rejected/suspended/archived account states.
-- Full protected-route enforcement is deferred to CM-2 authorization helpers.

-- Deferred authenticated API tests
-- If disposable authenticated test users are unavailable, run anon API tests and
-- validate authenticated behavior structurally through grants, policies, and generated types.
