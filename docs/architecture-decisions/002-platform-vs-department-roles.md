# ADR 002: Platform Roles Versus Department Roles

## Decision

Keep platform roles in `volunteer_platform_roles` and department roles in `volunteer_department_memberships`.

## Rationale

Club-wide authority is different from department authority. A content admin should not automatically gain Blood Department donor access, and a Blood coordinator should not automatically gain HR authority.

## Consequences

Server-side authorization must evaluate both role systems. Auth claims may cache hints, but trusted database state remains authoritative.
