# First Super Administrator Bootstrap Verification

## Scope

This document records the first real UIUSSC website administrator bootstrap for the linked development project. It intentionally excludes administrator email, Auth UUID, passwords, tokens, cookies, database credentials, and private applicant data.

## Selection

The development database contained exactly one eligible Auth user and volunteer profile pair at selection time. The selected profile had completed onboarding as a club-wide executive with no operational department request.

Selection safeguards:

- Auth user count was at least one.
- Volunteer profile count was at least one.
- Exactly one eligible profile belonged to exactly one Auth user.
- Onboarding status was supported for bootstrap.
- The profile was not archived.
- No active `super_admin` existed before bootstrap.
- No department membership existed for the selected profile.
- `primary_department_id` was null.
- No Blood Support tables existed.

The local selection file lives under `.reference/` and is ignored by Git.

## Operator-Only Bootstrap

The bootstrap remained a draft-only SQL file:

`supabase/drafts/202606240001_bootstrap_super_admin.sql`

It was rendered into an ignored local operator SQL file under `.reference/` and executed against the linked development project only.

The draft validates:

- exact Auth user
- expected normalized email
- volunteer profile ownership
- eligible onboarding state
- non-archived profile state
- no pre-existing active `super_admin`
- active club position slug

The transaction approves the selected profile, approves onboarding, assigns General Secretary as the primary active club position, assigns one active `super_admin` platform role, writes history/audit entries, and commits atomically.

The bootstrap is not exposed through a public route, browser button, Server Action, normal RPC, or client-side API.

## Result

Post-bootstrap verification confirmed:

- active `super_admin` count changed from 0 to 1
- selected profile account status is `approved`
- selected onboarding status is `approved`
- active official position is General Secretary
- General Secretary is the primary club position
- General Secretary is a Core Panel position
- active platform role is `super_admin`
- no department membership exists for the selected profile
- `primary_department_id` remains null
- volunteer status history exists
- position assignment exists
- bootstrap audit entries exist
- no unrelated profile changed
- no duplicate active role exists
- no Blood Support tables exist

## Security Verification

Rollback-wrapped checks confirmed:

- duplicate active `super_admin` assignment is rejected
- the final active `super_admin` cannot be revoked
- direct platform-role insertion is rejected for authenticated clients
- platform role assignment does not create a department
- club position assignment does not create extra platform roles
- no broad `UPDATE` or `DELETE` grants exist on sensitive leadership/platform tables for `anon` or `authenticated`

Core Panel titles do not silently grant `super_admin`. Core Panel members must receive explicit audited platform roles when policy requires application access.

## Login And UI Verification

Database bootstrap and public route verification are complete. The human operator confirmed normal login, `/staff`, and `/admin/club-positions` access. Codex did not inspect, log, store, or capture the password, tokens, refresh tokens, or cookies.

Authenticated logout, browser-back-after-logout, and sanitized authenticated screenshot capture still require a human-operated browser session because Codex must not receive the account password or session material.

Expected authenticated UI result after normal login:

- `/staff` opens without redirecting to `/staff/no-access`
- Staff Dashboard shows General Secretary as Club Leadership
- Staff Dashboard shows Core Panel membership
- Staff Dashboard shows Super Admin under Platform Access
- Staff Dashboard shows no operational department assigned
- `/admin` and admin child routes load for the super admin
- `/admin/club-positions` shows the General Secretary assignment

## Club Positions Catalogue Fix

The first authenticated review showed an empty position catalogue even though the database had seven seeded positions. Root cause: the application query selected `*` from `club_positions`, but the table intentionally grants authenticated clients only the public/admin-safe position columns. The query error was swallowed and displayed as an empty state.

The fix uses an explicit column list, safe status filters, stable ordering, pagination, and safe error messaging. No RLS migration was required.

Post-fix database verification confirmed:

- seven seeded position definitions
- seven active positions
- seven Core Panel positions
- one active primary General Secretary assignment
- unchanged active `super_admin`
- no department membership
- null primary department
- no Blood tables

The Create Position and assignment actions now use visible labels, pending states, safe duplicate-slug messaging, and confirmation dialogs for primary/completion/revocation workflows.

## Future Position Transition

When the official transition happens, complete the General Secretary assignment, store the term end, assign President, mark President primary, preserve the General Secretary history, and leave `super_admin` active unless a separate explicit platform-access decision is made.

## Rollback Considerations

The bootstrap changed real development data. Rollback should be a deliberate trusted database-owner action that revokes the platform role, completes or revokes the position assignment, and records an audit reason. Do not use destructive blanket resets.

## BB-1 Gate

BB-1 should wait until the human operator completes normal authenticated login verification and confirms Staff/Admin dashboard behavior in the browser.
