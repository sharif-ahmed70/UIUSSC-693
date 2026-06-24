# UIUSSC Access Governance

CM-4 adds a database-driven access foundation without building the full Event or Task modules.

## Principles

- Navigation visibility is not authorization.
- Every page, query, Server Action, and RPC must independently authorize.
- Club position, platform role, department role, permission policy, and temporary access are separate concepts.
- `super_admin` remains the only full technical override.
- President is highest operational authority, normally through President position plus `club_admin`.
- Vice President and General Secretary can initiate sensitive operational changes, but President approval is required where policy says so.

## Department Roles

Department roles are now:

- `department_head`
- `deputy_head`
- `executive`

Legacy values were migrated:

- `coordinator` -> `deputy_head`
- `volunteer` -> `executive`

Each active department can have at most one approved Department Head and one approved Deputy Head. Executives are not uniqueness-limited.

## Permission Catalogue

`system_permissions` stores permission keys, module ownership, risk level, and supported scopes.

Policy tables map permissions to:

- platform roles
- club positions
- department roles

Temporary grants and restrictions live in `user_permission_overrides`.

## Decision Order

The effective-permission helper uses this order:

1. authenticated approved volunteer profile
2. active Super Admin override
3. active user-specific deny override
4. active user-specific allow override
5. platform-role policy
6. club-position policy
7. department-role policy for matching department scope
8. deny

Expired overrides stop working by timestamp even if their stored status has not yet been updated.

## CM-5 Readiness

CM-4 seeds permissions for events and tasks, but does not implement event/task management. CM-5 can attach resource tables and Server Actions to this permission resolver.
## CM-5A Event Scope

Temporary access now supports Event scope for permissions that declare `supports_event_scope = true`. The admin form submits the event UUID internally from an event selector showing public and operational status. Record scope remains disabled until an allowlisted resource picker exists.

CM-5B task RPCs still require an approved profile, matching department membership, and valid task state. Temporary access does not bypass department consistency, suspended/archived account protection, history, or audit logging.
