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

Bootstrap was not executed because the linked development project currently has no Auth users and no volunteer profiles.

Required step:

Create or invite one real UIUSSC administrator account in the linked Supabase Development project, sign in, and complete `/staff/onboarding`. Do not share the password or tokens.

After that, create the ignored local file:

`.reference/bootstrap-super-admin.local.json`

with:

```json
{
  "authUserId": "<REAL_AUTH_USER_UUID>",
  "expectedEmail": "<EXACT_VERIFIED_ADMIN_EMAIL>",
  "preferredDepartmentSlug": "human-resources"
}
```

The file must remain local and ignored.

## Live Admin Verification

Live authenticated admin verification is deferred until a real selected account exists. Structural checks completed:

- initial build passed
- public route regression passed
- clean-browser Membership hydration check passed
- database counts inspected
- no active super admin exists
- no Blood tables exist

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
