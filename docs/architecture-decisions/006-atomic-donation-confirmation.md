# ADR 006: Atomic Donation Confirmation

## Decision

Donation confirmation updates history, assignment status, request fulfilment, donor availability, and audit logs in one transaction.

## Rationale

One assignment cannot safely mark a multi-unit request fulfilled without recalculating verified units. Partial fulfilment must be consistent.

## Consequences

`units_fulfilled` is not manually edited from ordinary UI. It is recalculated by the trusted confirmation transaction.
