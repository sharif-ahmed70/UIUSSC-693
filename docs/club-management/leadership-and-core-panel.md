# UIUSSC Leadership And Core Panel Architecture

## Purpose

UIUSSC leadership is modeled separately from platform permissions and operational department membership.

The same volunteer can hold a club position, belong to one or more departments, and have platform administration rights, but those are independent assignments with different review and audit requirements.

## Separate Concepts

- Club position: official organizational title, such as General Secretary or President.
- Core Panel membership: a property of selected club positions.
- Platform permission: application authority, such as `super_admin` or `club_admin`.
- Department membership: operational access to a department workspace.

No club position automatically grants `super_admin`. Core Panel members normally receive `club_admin` only when they also need platform access.

## Core Panel Positions

Seeded Core Panel positions:

- President
- Vice President
- General Secretary
- Joint Secretary
- Treasurer
- Organizing Secretary
- Executive Member

These records live in `club_positions`. Assignments live in `volunteer_club_positions` with status, primary flag, term dates, and history-friendly timestamps.

## Platform Role Independence

The permanent technical administrator can keep `super_admin` while holding any current or future club position. A move from General Secretary to President must update `volunteer_club_positions`; it must not automatically change `volunteer_platform_roles`.

This supports real UIUSSC leadership transitions without tying database ownership or emergency access to yearly club-office changes.

## Department Independence

Department membership remains optional. A club-wide executive can complete onboarding with no preferred department by selecting `No department / Club-wide executive role`.

When no department is selected:

- `submit_volunteer_onboarding` keeps `primary_department_id` null.
- no `volunteer_department_memberships` row is created.
- platform admins and club admins can still reach `/staff`.
- the dashboard shows leadership, platform roles, and department status separately.

## Administration

`/admin/club-positions` provides controlled management for:

- position metadata
- Core Panel display
- volunteer position assignment
- primary-position changes
- completion and revocation

The page uses database RPCs rather than broad client-side table updates. RLS remains enabled on both leadership tables.

## Bootstrap Behavior

The first-admin draft supports a local ignored selection:

```json
{
  "authUserId": "<REAL_AUTH_USER_UUID>",
  "expectedEmail": "<EXACT_VERIFIED_ADMIN_EMAIL>",
  "volunteerProfileId": "<OPTIONAL_PROFILE_UUID>",
  "clubPositionSlug": "general-secretary",
  "preferredDepartmentSlug": null
}
```

The transaction can approve the selected profile, assign General Secretary as the primary club position, assign `super_admin`, and leave department membership empty by default.

The draft must remain operator-only. It is not a migration, not a public route, and not a browser feature.

## First Bootstrap Verification

The development bootstrap verified the intended separation:

- General Secretary is an active primary club position.
- General Secretary is a Core Panel position.
- `super_admin` is an independent platform role.
- no operational department membership was created.
- `primary_department_id` remains null.
- platform role and club position changes are audited separately.

## Security Rules

- Do not expose service-role keys in frontend code.
- Do not create fake departments for leadership-only users.
- Do not infer platform authority from Core Panel title alone.
- Do not revoke final `super_admin` access during leadership changes.
- Do not create Blood Support tables as part of leadership work.
