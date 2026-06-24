# UIUSSC Temporary Access

Temporary access is represented by `user_permission_overrides`.

## Capabilities

An override can:

- allow a permission
- deny/restrict a permission
- apply globally
- apply to one department
- apply to one event
- apply to one record
- start in the future
- expire automatically by timestamp
- be revoked immediately

`user_permission_override_history` is append-only and records status changes.

## Safety

- Every grant or restriction requires a reason.
- Users cannot grant themselves access unless the Super Admin path explicitly permits it.
- Critical permissions require Super Admin.
- Deny overrides beat ordinary role and position permissions.
- Expired access stops working even before a scheduled cleanup job runs.
- No hard delete is used.

## Example

A Public Relations Executive can receive `events.view_internal` scoped to one event with a start and expiry date. After expiry, the permission resolver denies access even if the override row remains present for audit.
