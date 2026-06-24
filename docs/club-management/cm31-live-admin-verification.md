# Phase CM-3.1: Live Admin Verification

## Hydration Investigation

The Membership page source was audited for unstable render behavior. No `Math.random()`, `Date.now()`, browser-only initial render branch, unstable generated ID, locale-dependent output, localStorage read, controlled/uncontrolled switch, or invalid dynamic field attribute was found.

The injected attributes reported earlier are not present in the React source or server-rendered HTML:

- `data-temp-mail-org`
- injected inline data-URL `background-image`

Clean Chromium verification returned zero hydration warnings and zero injected attribute matches. This classifies the warning as external browser extension DOM mutation.

No `suppressHydrationWarning` was added.

## Bootstrap Design

The operator-only bootstrap draft was updated to resolve the chicken-and-egg problem:

1. A real Auth user must exist in the linked development project.
2. That user signs in normally and completes `/staff/onboarding`.
3. A trusted operator reviews the exact Auth UUID, exact email, and optional profile id.
4. The draft transaction verifies ownership and email, approves eligible submitted/under-review/approved profile states, optionally approves one selected department request, assigns `super_admin`, writes history, writes audit, and rolls back on failure.

The committed draft contains placeholders only. No real email, UUID, password, token, or key is committed.

## Human Checkpoint

The real selected administrator account has completed `/staff/onboarding` as a club-wide executive with no operational department. The ignored local selection file was created during verification:

`.reference/bootstrap-super-admin.local.json`

with:

```json
{
  "authUserId": "<REAL_AUTH_USER_UUID>",
  "expectedEmail": "<EXACT_VERIFIED_ADMIN_EMAIL>",
  "volunteerProfileId": "<OPTIONAL_PROFILE_UUID>",
  "clubPositionSlug": "general-secretary",
  "preferredDepartmentSlug": null
}
```

The file must remain local and ignored.

The default bootstrap path assigns the selected real account to the General Secretary club position and `super_admin` platform role. It does not assign a department unless `preferredDepartmentSlug` is intentionally set.

## Live Admin Verification

The operator-only bootstrap was executed against the linked development project. Database verification confirmed one active `super_admin`, approved profile/onboarding state, primary General Secretary assignment, no department membership, null primary department, history entries, and audit entries.

Normal password login, cookie-session checks, authenticated dashboard screenshots, logout behavior, and browser-back-after-logout checks still require a human password entry in an interactive browser session. Passwords, tokens, and cookies must not be shared.

Structural checks completed:

- initial build passed
- public route regression passed
- clean-browser Membership hydration check passed
- database counts inspected
- exactly one active super admin exists after bootstrap
- no Blood tables exist

## Club Positions Follow-up

The authenticated Club Positions page initially displayed an empty catalogue because the query selected ungranted columns with `select('*')`. The page now queries explicit safe columns, shows active positions by default, supports inactive/archived/all filters, and surfaces safe errors instead of false empty states.

Human-readable platform-role labels are used in Staff/Admin surfaces, and the persistent Admin sidebar masks the email address.

Assignment actions were separated into confirmation dialogs for Make Primary, Complete Term, and Revoke Position. The current active primary General Secretary assignment was not completed, revoked, or changed during QA.

## RSC Runtime Follow-up

After the Club Positions UX update, `/admin/club-positions` showed a runtime RSC serialization error because a render-function prop was passed from the Server Component page to the client `AdminActionForm`.

The page was refactored so create/edit forms own their client-side action state internally. The Server Component page no longer sends ordinary functions across the server/client boundary. A fresh webpack dev server restart showed `/admin/club-positions` returning `200` for the authenticated session without the previous component-payload error.

## Security QA

CM-3.1 security-test drafts cover:

- no public admin data access
- ordinary fake authenticated user denial
- admin RPC denial without admin context
- deferred live checks for final-super-admin protection, suspended-admin denial, role escalation denial, cross-department denial, history creation, and audit creation

## Visual QA

Clean Membership screenshot and hydration result were captured under:

`.tmp/ui-qa/cm3-live/`

Authenticated admin screenshots are deferred until the first real super admin is bootstrapped.

## Rollback

CM-3.1 adds no active migration. The bootstrap draft is operator-only. Rollback for source changes means reverting the documentation/draft updates and removing ignored `.tmp/` captures.

## Next Recommendation

Do not begin BB-1 until the first real super admin is bootstrapped and live admin login/dashboard verification passes.
