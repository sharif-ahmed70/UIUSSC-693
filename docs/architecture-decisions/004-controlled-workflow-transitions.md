# ADR 004: Controlled Workflow Transitions

## Decision

Blood request and assignment status changes must happen through trusted Server Actions or reviewed RPCs, not arbitrary client updates.

## Rationale

Status transitions affect privacy, donor contact, units fulfilled, notification, and audit records. They must be permission-checked and atomic.

## Consequences

The database draft records status fields and histories, but final deployment needs reviewed transition functions/actions before staff UI is built.
