# CM-4.1 Role Permission Acceptance Testing

CM-4.1 validates the official UIUSSC access model after the club management, event operations, progress reporting, and Blood Support phases.

## Human Access Model

The admin interface should describe responsibilities in club language:

- Super Admin
- President
- Vice-President
- Assistant Vice-President
- General Secretary
- Treasurer
- Department Head
- Deputy Head
- Executive Member

User-facing admin pages should avoid exposing database terms such as permission keys, scopes, policies, and RPC names. The `/admin/access-review` page now translates internal rules into "Can do" and "Cannot do" responsibilities.

## Official Boundaries

- Super Admin has full platform authority and remains protected from final-account removal.
- Advanced website role assignment is Super Admin controlled.
- Core Panel positions can coordinate club operations but should not directly grant advanced role-management powers.
- Department Heads work within their department boundary.
- Department Executives work on assigned event tasks or assigned Blood Support records.
- Blood Support management authority comes from the Blood Department assignment, not from a standalone club position row.

## Hardening Applied

The migration `202606240033_cm41_role_permission_hardening.sql` disables misleading active policies where a standalone club position attempted to use an own-department Blood Support boundary. Club positions do not carry department ids in the authorization resolver, so those rows cannot be the source of department-scoped authority.

The same migration disables non-Super platform-role policies for advanced role assignment and revocation keys. This keeps the ordinary staff setup flow simple and prevents Core Panel platform labels from becoming broad security administration access.

## Acceptance Verification

The read-only verifier is:

```text
supabase/drafts/202606240033_cm41_role_permission_acceptance_verify.sql
```

It checks:

- Official permission catalogue presence.
- President, Core Panel, Treasurer, Department Head, and Executive policy boundaries.
- No advanced role-management policy remains active for non-Super website roles.
- No misleading active Head of Blood standalone position Blood policies remain.
- Blood Support helpers use the Blood Department boundary.
- Assigned-record matching supports Blood request assignments.
- Final Super Admin revocation protection is present.
- Anonymous users cannot read internal management, event operation, task, Blood contact, or audit tables.
- Anonymous users still retain public-read grants for published events, notices, and gallery items.

## Remaining Manual Acceptance

The database verifier checks the persistent access model. Human browser acceptance should still confirm that:

- `/admin/access-review` shows names, positions, departments, and clear "Can do" / "Cannot do" summaries.
- Staff setup remains understandable to club officers.
- A normal member cannot open admin pages.
- A Department Executive sees only assigned work.
- Blood Department staff see Blood Support operations according to their department role or assigned request.
