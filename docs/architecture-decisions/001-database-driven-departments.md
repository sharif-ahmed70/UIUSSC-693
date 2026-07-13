# ADR 001: Database-Driven Departments

## Decision

Use `club_departments` instead of a PostgreSQL enum for department names.

## Rationale

UIUSSC departments will change over time. A table supports active/inactive/archived status, display order, descriptions, and historical references without schema migrations for every new department.

## Consequences

Authorization must join against department records and reject inactive or archived departments. Department deletion should be avoided; archival preserves history.
